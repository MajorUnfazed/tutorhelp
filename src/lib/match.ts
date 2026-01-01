import { MIN_OVERLAP_HOURS } from '@/lib/constants';
import { minutesToHours, timeToMinutes } from '@/lib/utils';
import type { IntentCard } from '@/types';

export type MatchScoreBreakdown = {
  role: number;
  skill: number;
  availability: number;
  hostel: number;
  commitment: number;
  total: number;
  overlapHours: number;
  roleOverlap: string[];
  skillOverlap: string[];
};

function intersection(a: string[], b: string[]): string[] {
  const bSet = new Set(b.map((x) => x.toLowerCase()));
  const out: string[] = [];
  for (const item of a) {
    if (bSet.has(item.toLowerCase())) out.push(item);
  }
  return out;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function computeOverlapHours(a: IntentCard, b: IntentCard): number {
  const aStart = timeToMinutes(a.availability.startTime);
  const aEnd = timeToMinutes(a.availability.endTime);
  const bStart = timeToMinutes(b.availability.startTime);
  const bEnd = timeToMinutes(b.availability.endTime);

  if (aStart == null || aEnd == null || bStart == null || bEnd == null) return 0;
  if (aEnd <= aStart || bEnd <= bStart) return 0;

  const overlapMins = Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart));

  const weekdayFactor = a.availability.weekdays && b.availability.weekdays ? 1 : 0;
  const weekendFactor = a.availability.weekends && b.availability.weekends ? 1 : 0;

  // Simple MVP model: treat overlap as "per available day type".
  const effectiveMins = overlapMins * (weekdayFactor + weekendFactor);
  return minutesToHours(effectiveMins);
}

export function passesHardFilters(
  source: IntentCard,
  candidate: IntentCard
): {
  ok: boolean;
  reason?: string;
  overlapHours: number;
  roleOverlap: string[];
  skillOverlap: string[];
} {
  const roleOverlap = intersection(source.lookingForRoles, candidate.lookingForRoles);
  const skillOverlap = intersection(source.requiredSkills, candidate.requiredSkills);
  const overlapHours = computeOverlapHours(source, candidate);

  const weekendsMatch = source.availability.weekends && candidate.availability.weekends;
  const timeOk = overlapHours >= MIN_OVERLAP_HOURS || weekendsMatch;
  const interestOk = roleOverlap.length >= 1 || skillOverlap.length >= 1;

  if (!timeOk) {
    return { ok: false, reason: 'Availability does not overlap enough.', overlapHours, roleOverlap, skillOverlap };
  }

  if (!interestOk) {
    return { ok: false, reason: 'No role or skill overlap.', overlapHours, roleOverlap, skillOverlap };
  }

  return { ok: true, overlapHours, roleOverlap, skillOverlap };
}

function commitmentBonus(a: IntentCard, b: IntentCard): number {
  const levels = ['casual', 'serious', 'win'] as const;
  const ai = levels.indexOf(a.commitmentLevel);
  const bi = levels.indexOf(b.commitmentLevel);
  if (ai === -1 || bi === -1) return 0;
  if (ai === bi) return 5;
  if (Math.abs(ai - bi) === 1) return 2;
  return 0;
}

export function scoreMatch(source: IntentCard, candidate: IntentCard): MatchScoreBreakdown {
  const roleOverlap = intersection(source.lookingForRoles, candidate.lookingForRoles);
  const skillOverlap = intersection(source.requiredSkills, candidate.requiredSkills);
  const overlapHours = computeOverlapHours(source, candidate);

  const roleScore = clamp(
    (roleOverlap.length / Math.max(1, Math.max(source.lookingForRoles.length, candidate.lookingForRoles.length))) * 40,
    0,
    40
  );

  const skillScore = clamp(
    (skillOverlap.length / Math.max(1, Math.max(source.requiredSkills.length, candidate.requiredSkills.length))) * 30,
    0,
    30
  );

  // Cap effective overlap at 6 hours for scoring.
  const availabilityScore = clamp((Math.min(overlapHours, 6) / 6) * 20, 0, 20);

  const hostelScore = source.hostelStatus === candidate.hostelStatus ? 5 : 0;
  const commitmentScore = commitmentBonus(source, candidate);

  const total = clamp(roleScore + skillScore + availabilityScore + hostelScore + commitmentScore, 0, 100);

  return {
    role: Math.round(roleScore),
    skill: Math.round(skillScore),
    availability: Math.round(availabilityScore),
    hostel: Math.round(hostelScore),
    commitment: Math.round(commitmentScore),
    total: Math.round(total),
    overlapHours,
    roleOverlap,
    skillOverlap
  };
}

export function whyMatched(source: IntentCard, candidate: IntentCard, breakdown: MatchScoreBreakdown): string[] {
  const reasons: Array<{ score: number; text: string }> = [];

  if (breakdown.role > 0 && breakdown.roleOverlap.length > 0) {
    reasons.push({
      score: breakdown.role,
      text: `Role overlap: you both selected ${breakdown.roleOverlap.slice(0, 3).join(', ')}.`
    });
  }

  if (breakdown.skill > 0 && breakdown.skillOverlap.length > 0) {
    reasons.push({
      score: breakdown.skill,
      text: `Skill overlap: ${breakdown.skillOverlap.slice(0, 4).join(', ')}.`
    });
  }

  if (breakdown.availability > 0) {
    const weekendsMatch = source.availability.weekends && candidate.availability.weekends;
    reasons.push({
      score: breakdown.availability,
      text: weekendsMatch
        ? `You both are available on weekends, with ~${breakdown.overlapHours.toFixed(1)}h time overlap.`
        : `Your availability overlaps by ~${breakdown.overlapHours.toFixed(1)} hours.`
    });
  }

  if (breakdown.commitment > 0) {
    reasons.push({
      score: breakdown.commitment,
      text: `Commitment level aligns (${source.commitmentLevel} vs ${candidate.commitmentLevel}).`
    });
  }

  if (breakdown.hostel > 0) {
    reasons.push({
      score: breakdown.hostel,
      text: `Same hostel status (${source.hostelStatus}).`
    });
  }

  reasons.sort((a, b) => b.score - a.score);
  return reasons.slice(0, 3).map((r) => r.text);
}
