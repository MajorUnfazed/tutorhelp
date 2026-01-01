import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Tag } from '@/components/Tag';
import { useAuth } from '@/contexts/AuthContext';
import { deleteIntentCard, listMyIntentCards } from '@/lib/firestore';
import type { IntentCard } from '@/types';

function fmtAvailability(a: IntentCard['availability']): string {
  const days = [a.weekdays ? 'Weekdays' : null, a.weekends ? 'Weekends' : null].filter(Boolean).join(' + ');
  return `${days || 'No days'} • ${a.startTime}–${a.endTime}`;
}

export function DashboardPage() {
  const { user } = useAuth();
  const [cards, setCards] = useState<IntentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      setCards(await listMyIntentCards(user.uid));
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load intent cards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xl font-semibold text-slate-900">Dashboard</div>
          <div className="mt-1 text-sm text-slate-600">Create an intent card and find teammates in seconds.</div>
        </div>
        <Link to="/app/intent/new">
          <Button>Create Intent Card</Button>
        </Link>
      </div>

      {error ? <div className="text-sm text-rose-600">{error}</div> : null}

      <div className="grid gap-4">
        {loading ? (
          <Card className="p-5">
            <div className="text-sm text-slate-600">Loading your intent cards…</div>
          </Card>
        ) : cards.length === 0 ? (
          <Card className="p-5">
            <div className="text-sm font-medium text-slate-900">No intent cards yet</div>
            <div className="mt-1 text-sm text-slate-600">Create one to start matching.</div>
            <div className="mt-4">
              <Link to="/app/intent/new">
                <Button>Create your first card</Button>
              </Link>
            </div>
          </Card>
        ) : (
          cards.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {c.eventName} <span className="text-slate-500">• {c.eventType}</span>
                  </div>
                  <div className="mt-1 text-sm text-slate-600">{fmtAvailability(c.availability)}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {c.lookingForRoles.map((r) => (
                      <Tag key={r}>{r}</Tag>
                    ))}
                    {c.requiredSkills.slice(0, 4).map((s) => (
                      <Tag key={s} className="bg-white">
                        {s}
                      </Tag>
                    ))}
                  </div>
                  <div className="mt-3 text-sm text-slate-700">{c.shortGoal}</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link to={`/app/intent/${c.id}/matches`}>
                    <Button>View Matches</Button>
                  </Link>
                  <Link to={`/app/intent/${c.id}/edit`}>
                    <Button variant="secondary">Edit</Button>
                  </Link>
                  <Button
                    variant="danger"
                    onClick={async () => {
                      const ok = confirm('Delete this intent card?');
                      if (!ok) return;
                      await deleteIntentCard(c.id);
                      await refresh();
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
