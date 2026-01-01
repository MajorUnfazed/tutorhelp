import React, { useEffect, useState } from 'react';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Tag } from '@/components/Tag';
import { useAuth } from '@/contexts/AuthContext';
import {
  createConnectionFromRequest,
  listIncomingRequests,
  listOutgoingRequests,
  updateRequestStatus
} from '@/lib/firestore';
import type { ConnectionRequest } from '@/types';

function statusTag(status: string) {
  if (status === 'accepted') return <Tag className="bg-emerald-50">accepted</Tag>;
  if (status === 'rejected') return <Tag className="bg-rose-50">rejected</Tag>;
  return <Tag>pending</Tag>;
}

export function RequestsPage() {
  const { user } = useAuth();
  const [incoming, setIncoming] = useState<ConnectionRequest[]>([]);
  const [outgoing, setOutgoing] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [inc, out] = await Promise.all([listIncomingRequests(user.uid), listOutgoingRequests(user.uid)]);
      setIncoming(inc);
      setOutgoing(out);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const accept = async (r: ConnectionRequest) => {
    setBusy((b) => ({ ...b, [r.id]: true }));
    try {
      await updateRequestStatus(r.id, 'accepted');
      await createConnectionFromRequest(r.id, r.fromUid, r.toUid);
      await refresh();
    } finally {
      setBusy((b) => ({ ...b, [r.id]: false }));
    }
  };

  const reject = async (r: ConnectionRequest) => {
    setBusy((b) => ({ ...b, [r.id]: true }));
    try {
      await updateRequestStatus(r.id, 'rejected');
      await refresh();
    } finally {
      setBusy((b) => ({ ...b, [r.id]: false }));
    }
  };

  return (
    <div className="grid gap-6">
      <div>
        <div className="text-xl font-semibold text-slate-900">Requests</div>
        <div className="mt-1 text-sm text-slate-600">Accept/reject connection requests.</div>
      </div>

      {error ? <div className="text-sm text-rose-600">{error}</div> : null}

      {loading ? (
        <Card className="p-5">
          <div className="text-sm text-slate-600">Loading…</div>
        </Card>
      ) : (
        <div className="grid gap-4">
          <Card className="p-5">
            <div className="text-sm font-semibold text-slate-900">Incoming</div>
            {incoming.length === 0 ? (
              <div className="mt-2 text-sm text-slate-600">No incoming requests.</div>
            ) : (
              <div className="mt-3 grid gap-3">
                {incoming.map((r) => (
                  <div key={r.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-slate-900">{r.fromName}</div>
                        {statusTag(r.status)}
                      </div>
                      <div className="mt-1 text-xs text-slate-600">From card: {r.fromIntentCardId}</div>
                    </div>

                    {r.status === 'pending' ? (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => accept(r)}
                          disabled={!!busy[r.id]}
                        >
                          {busy[r.id] ? 'Working…' : 'Accept'}
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => reject(r)}
                          disabled={!!busy[r.id]}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="text-sm font-semibold text-slate-900">Outgoing</div>
            {outgoing.length === 0 ? (
              <div className="mt-2 text-sm text-slate-600">No outgoing requests.</div>
            ) : (
              <div className="mt-3 grid gap-3">
                {outgoing.map((r) => (
                  <div key={r.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-slate-900">{r.toName}</div>
                        {statusTag(r.status)}
                      </div>
                      <div className="mt-1 text-xs text-slate-600">To card: {r.toIntentCardId}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
