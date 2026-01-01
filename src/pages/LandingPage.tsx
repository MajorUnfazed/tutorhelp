import React, { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { useAuth } from '@/contexts/AuthContext';

export function LandingPage() {
  const { user, loading, signInGoogle, signInEmail, signUpEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => email.trim() && password.length >= 6, [email, password]);

  if (!loading && user) return <Navigate to="/app" replace />;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-14">
        <div className="mx-auto max-w-xl">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">SASTRA TeamMatch</h1>
          <p className="mt-2 text-slate-600">
            Find teammates for events based on requirements and availability.
            <br />
            Get clear “why matched” explanations.
          </p>

          <Card className="mt-8 p-5">
            <div className="text-sm font-medium text-slate-900">Sign in</div>
            <div className="mt-4 grid gap-3">
              <Button
                onClick={async () => {
                  setError(null);
                  setBusy(true);
                  try {
                    await signInGoogle();
                  } catch (e: any) {
                    setError(e?.message ?? 'Google sign-in failed');
                  } finally {
                    setBusy(false);
                  }
                }}
                disabled={busy}
              >
                Continue with Google
              </Button>

              <div className="mt-2 text-xs uppercase tracking-wide text-slate-500">or</div>

              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@sastra.edu"
              />
              <Input
                label="Password (min 6 chars)"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {error ? <div className="text-sm text-rose-600">{error}</div> : null}

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button
                  variant="secondary"
                  disabled={busy || !canSubmit}
                  onClick={async () => {
                    setError(null);
                    setBusy(true);
                    try {
                      await signInEmail(email.trim(), password);
                    } catch (e: any) {
                      setError(e?.message ?? 'Email sign-in failed');
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Sign in
                </Button>
                <Button
                  disabled={busy || !canSubmit}
                  onClick={async () => {
                    setError(null);
                    setBusy(true);
                    try {
                      await signUpEmail(email.trim(), password);
                    } catch (e: any) {
                      setError(e?.message ?? 'Sign up failed');
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Create account
                </Button>
              </div>

              <div className="text-xs text-slate-500">
                Tip: enable Google + Email/Password providers in Firebase Auth.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
