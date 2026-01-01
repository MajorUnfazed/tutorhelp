import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Select } from '@/components/Select';
import { Tag } from '@/components/Tag';
import { TagsInput } from '@/components/TagsInput';
import { useAuth } from '@/contexts/AuthContext';
import { COMMITMENT_LEVELS, EVENT_TYPES, HOSTEL_STATUSES, ROLES, SKILL_SUGGESTIONS } from '@/lib/constants';
import { createIntentCard, getIntentCardById, updateIntentCard } from '@/lib/firestore';
import { cx, uniqNormalized } from '@/lib/utils';
import type { Availability, CommitmentLevel, EventType, HostelStatus, IntentCard } from '@/types';

type Mode = 'create' | 'edit';

type FormState = {
  eventType: EventType;
  eventName: string;
  lookingForRoles: string[];
  requiredSkills: string[];
  availability: Availability;
  hostelStatus: HostelStatus;
  commitmentLevel: CommitmentLevel;
  shortGoal: string;
  isPublic: boolean;
};

const defaultState: FormState = {
  eventType: 'Hackathon',
  eventName: '',
  lookingForRoles: [],
  requiredSkills: [],
  availability: {
    weekdays: true,
    weekends: true,
    startTime: '18:00',
    endTime: '21:00'
  },
  hostelStatus: 'hosteler',
  commitmentLevel: 'serious',
  shortGoal: '',
  isPublic: true
};

export function IntentFormPage({ mode }: { mode: Mode }) {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();

  const [state, setState] = useState<FormState>(defaultState);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (mode !== 'edit' || !id) return;
      setLoading(true);
      setError(null);
      try {
        const card = await getIntentCardById(id);
        if (!card) {
          setError('Intent card not found');
          return;
        }
        if (card.ownerUid !== user?.uid) {
          setError('You do not have permission to edit this card.');
          return;
        }
        setState({
          eventType: card.eventType,
          eventName: card.eventName,
          lookingForRoles: card.lookingForRoles,
          requiredSkills: card.requiredSkills,
          availability: card.availability,
          hostelStatus: card.hostelStatus,
          commitmentLevel: card.commitmentLevel,
          shortGoal: card.shortGoal,
          isPublic: card.isPublic
        });
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load intent card');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [mode, id, user?.uid]);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!state.eventName.trim()) e.eventName = 'Event name is required';
    if (state.lookingForRoles.length === 0) e.lookingForRoles = 'Select at least one role';
    if (!state.shortGoal.trim()) e.shortGoal = 'Short goal is required';
    if (state.shortGoal.trim().length > 140) e.shortGoal = 'Keep it under 140 characters';
    if (!state.availability.startTime || !state.availability.endTime) e.availability = 'Time range is required';
    if (!state.availability.weekdays && !state.availability.weekends) e.availability = 'Pick weekdays and/or weekends';
    return e;
  }, [state]);

  const canSave = Object.keys(errors).length === 0;

  if (mode === 'edit' && !id) return <Navigate to="/app" replace />;

  const toggleRole = (role: string) => {
    const next = state.lookingForRoles.includes(role)
      ? state.lookingForRoles.filter((r) => r !== role)
      : [...state.lookingForRoles, role];
    setState((s) => ({ ...s, lookingForRoles: next }));
  };

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold text-slate-900">{mode === 'create' ? 'Create' : 'Edit'} Intent Card</div>
          <div className="mt-1 text-sm text-slate-600">Keep it short and specific—matching works better.</div>
        </div>
        <Link to="/app">
          <Button variant="secondary">Back</Button>
        </Link>
      </div>

      {error ? <div className="text-sm text-rose-600">{error}</div> : null}

      <Card className="p-5">
        {loading ? (
          <div className="text-sm text-slate-600">Loading…</div>
        ) : (
          <form
            className="grid gap-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!user) return;
              if (!canSave) return;

              setSaving(true);
              setError(null);
              try {
                const base: Omit<IntentCard, 'id' | 'createdAt' | 'updatedAt'> = {
                  ownerUid: user.uid,
                  ownerName: user.displayName ?? 'Student',
                  ownerEmail: user.email ?? undefined,
                  ownerPhotoURL: user.photoURL ?? undefined,
                  eventType: state.eventType,
                  eventName: state.eventName.trim(),
                  lookingForRoles: uniqNormalized(state.lookingForRoles),
                  requiredSkills: uniqNormalized(state.requiredSkills),
                  availability: state.availability,
                  hostelStatus: state.hostelStatus,
                  commitmentLevel: state.commitmentLevel,
                  shortGoal: state.shortGoal.trim(),
                  isPublic: state.isPublic
                };

                if (mode === 'create') {
                  const newId = await createIntentCard(base);
                  nav(`/app/intent/${newId}/matches`);
                } else {
                  await updateIntentCard(id!, {
                    eventType: base.eventType,
                    eventName: base.eventName,
                    lookingForRoles: base.lookingForRoles,
                    requiredSkills: base.requiredSkills,
                    availability: base.availability,
                    hostelStatus: base.hostelStatus,
                    commitmentLevel: base.commitmentLevel,
                    shortGoal: base.shortGoal,
                    isPublic: base.isPublic
                  });
                  nav(`/app/intent/${id!}/matches`);
                }
              } catch (err: any) {
                setError(err?.message ?? 'Failed to save');
              } finally {
                setSaving(false);
              }
            }}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Event Type"
                value={state.eventType}
                onChange={(e) => setState((s) => ({ ...s, eventType: e.target.value as EventType }))}
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
              <Input
                label="Event Name"
                value={state.eventName}
                onChange={(e) => setState((s) => ({ ...s, eventName: e.target.value }))}
                placeholder="e.g., Smart India Hackathon"
                error={errors.eventName}
              />
            </div>

            <div>
              <div className="mb-1 text-sm font-medium text-slate-700">Looking For Roles</div>
              <div className="flex flex-wrap gap-2">
                {ROLES.map((r) => {
                  const active = state.lookingForRoles.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => toggleRole(r)}
                      className={cx(
                        'rounded-full border px-3 py-1 text-sm',
                        active
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
              {errors.lookingForRoles ? <div className="mt-1 text-xs text-rose-600">{errors.lookingForRoles}</div> : null}
            </div>

            <TagsInput
              label="Required Skills (tags)"
              value={state.requiredSkills}
              onChange={(next) => setState((s) => ({ ...s, requiredSkills: next }))}
              placeholder="React, Python, Figma"
              suggestions={SKILL_SUGGESTIONS}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <div className="mb-1 text-sm font-medium text-slate-700">Availability</div>
                <div className="grid gap-3 rounded-xl border border-slate-200 p-3">
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={state.availability.weekdays}
                        onChange={(e) =>
                          setState((s) => ({
                            ...s,
                            availability: { ...s.availability, weekdays: e.target.checked }
                          }))
                        }
                      />
                      Weekdays
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={state.availability.weekends}
                        onChange={(e) =>
                          setState((s) => ({
                            ...s,
                            availability: { ...s.availability, weekends: e.target.checked }
                          }))
                        }
                      />
                      Weekends
                    </label>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Input
                      label="Start time"
                      type="time"
                      value={state.availability.startTime}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          availability: { ...s.availability, startTime: e.target.value }
                        }))
                      }
                    />
                    <Input
                      label="End time"
                      type="time"
                      value={state.availability.endTime}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          availability: { ...s.availability, endTime: e.target.value }
                        }))
                      }
                    />
                  </div>

                  {errors.availability ? <div className="text-xs text-rose-600">{errors.availability}</div> : null}
                </div>
              </div>

              <Select
                label="Hostel Status"
                value={state.hostelStatus}
                onChange={(e) => setState((s) => ({ ...s, hostelStatus: e.target.value as HostelStatus }))}
              >
                {HOSTEL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Commitment Level"
                value={state.commitmentLevel}
                onChange={(e) => setState((s) => ({ ...s, commitmentLevel: e.target.value as CommitmentLevel }))}
              >
                {COMMITMENT_LEVELS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>

              <label className="flex items-center gap-2 pt-7 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={state.isPublic}
                  onChange={(e) => setState((s) => ({ ...s, isPublic: e.target.checked }))}
                />
                Public (allow others to match)
              </label>
            </div>

            <div>
              <div className="mb-1 text-sm font-medium text-slate-700">Short Goal (1–2 lines)</div>
              <textarea
                value={state.shortGoal}
                onChange={(e) => setState((s) => ({ ...s, shortGoal: e.target.value }))}
                className={cx(
                  'w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none',
                  errors.shortGoal ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-slate-400'
                )}
                rows={3}
                placeholder="e.g., Build a polished MVP and pitch confidently."
              />
              {errors.shortGoal ? <div className="mt-1 text-xs text-rose-600">{errors.shortGoal}</div> : null}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <Tag>Roles: {state.lookingForRoles.length}</Tag>
                <Tag>Skills: {state.requiredSkills.length}</Tag>
                <Tag>{state.isPublic ? 'Public' : 'Private'}</Tag>
              </div>

              <Button type="submit" disabled={saving || !canSave}>
                {saving ? 'Saving…' : mode === 'create' ? 'Create & Match' : 'Save & Match'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
