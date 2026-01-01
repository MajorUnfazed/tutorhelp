import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Tag } from '@/components/Tag';
import { useAuth } from '@/contexts/AuthContext';
import { createConnectionRequest, getIntentCardById, listPublicIntentCards } from '@/lib/firestore';
import { passesHardFilters, scoreMatch, whyMatched } from '@/lib/match';
import type { MatchScoreBreakdown } from '@/lib/match';
import type { IntentCard } from '@/types';

function fmtAvailability(a: IntentCard['availability']): string {
  const days = [a.weekdays ? 'Weekdays' : null, a.weekends ? 'Weekends' : null].filter(Boolean).join(' + ');
  return `${days || 'No days'} • ${a.startTime}–${a.endTime}`;
}

export function MatchesPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [source, setSource] = useState<IntentCard | null>(null);
  const [candidates, setCandidates] = useState<IntentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!id || !user) return;
      setLoading(true);
      setError(null);
      try {
        const card = await getIntentCardById(id);
        if (!card) {
          setError('Intent card not found.');
          setSource(null);
          return;
        }
        if (card.ownerUid !== user.uid) {
          setError('You can only view matches for your own intent cards.');
          setSource(null);
          return;
        }
        setSource(card);

        // Pull public cards (small limit to avoid indexes/complexity)
        const publicCards = await listPublicIntentCards(200);
        const filtered = publicCards.filter((c) => c.ownerUid !== user.uid && c.id !== card.id);
        setCandidates(filtered);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load matches.');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id, user]);

  type MatchItem = {
    card: IntentCard;
    breakdown: MatchScoreBreakdown;
    reasons: string[];
  };

  const matches = useMemo(() => {
    if (!source) return [];

    const out: MatchItem[] = [];
    for (const c of candidates) {
      const hf = passesHardFilters(source, c);
      if (!hf.ok) continue;
      const breakdown = scoreMatch(source, c);
      const reasons = whyMatched(source, c, breakdown);
      out.push({ card: c, breakdown, reasons });
    }

    out.sort((a, b) => b.breakdown.total - a.breakdown.total);
    return out.slice(0, 10);
  }, [source, candidates]);

  const sendRequest = async (target: IntentCard) => {
    if (!user || !source) return;
    const key = target.id;
    setSending((s) => ({ ...s, [key]: true }));
    try {
      await createConnectionRequest({
        fromUid: user.uid,
        fromName: user.displayName ?? 'Student',
        fromPhotoURL: user.photoURL ?? undefined,
        toUid: target.ownerUid,
        toName: target.ownerName,
        toPhotoURL: target.ownerPhotoURL ?? undefined,
        fromIntentCardId: source.id,
        toIntentCardId: target.id
      });
      alert('Request sent!');
    } catch (e: any) {
      alert(e?.message ?? 'Failed to send request');
    } finally {
      setSending((s) => ({ ...s, [key]: false }));
    }
  };

  return (
    <div className="grid gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xl font-semibold text-slate-900">Matches</div>
          <div className="mt-1 text-sm text-slate-600">Top matches with “why matched” explanations.</div>
        </div>
        <Link to="/app">
          <Button variant="secondary">Back</Button>
        </Link>
      </div>

      {error ? <div className="text-sm text-rose-600">{error}</div> : null}

      {loading ? (
        <Card className="p-5">
          <div className="text-sm text-slate-600">Loading matches…</div>
        </Card>
      ) : !source ? (
        <Card className="p-5">
          <div className="text-sm text-slate-600">No source card.</div>
        </Card>
      ) : (
        <>
          <Card className="p-5">
            <div className="text-sm font-semibold text-slate-900">
              {source.eventName} <span className="text-slate-500">• {source.eventType}</span>
            </div>
            <div className="mt-1 text-sm text-slate-600">{fmtAvailability(source.availability)}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {source.lookingForRoles.map((r) => (
                <Tag key={r}>{r}</Tag>
              ))}
              {source.requiredSkills.slice(0, 6).map((s) => (
                <Tag key={s} className="bg-white">
                  {s}
                </Tag>
              ))}
            </div>
            <div className="mt-3 text-sm text-slate-700">{source.shortGoal}</div>
          </Card>

          {matches.length === 0 ? (
            <Card className="p-5">
              <div className="text-sm font-medium text-slate-900">No strong matches yet</div>
              <div className="mt-1 text-sm text-slate-600">
                Try widening roles/skills or adjusting availability.
              </div>
            </Card>
          ) : (
            <div className="grid gap-4">
              {matches.map((m) => (
                <Card key={m.card.id} className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-slate-900">{m.card.ownerName}</div>
                        <Tag className="bg-white">Score {m.breakdown.total}/100</Tag>
                      </div>

                      <div className="mt-1 text-sm text-slate-600">{fmtAvailability(m.card.availability)}</div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {m.card.lookingForRoles.slice(0, 6).map((r) => (
                          <Tag key={r}>{r}</Tag>
                        ))}
                        {m.card.requiredSkills.slice(0, 6).map((s) => (
                          <Tag key={s} className="bg-white">
                            {s}
                          </Tag>
                        ))}
                      </div>

                      <div className="mt-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Why matched</div>
                        <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                          {m.reasons.map((r, idx) => (
                            <li key={idx}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => sendRequest(m.card)}
                        disabled={!!sending[m.card.id]}
                      >
                        {sending[m.card.id] ? 'Sending…' : 'Request to connect'}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
