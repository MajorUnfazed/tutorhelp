import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { NavBar } from '@/components/NavBar';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardPage } from '@/pages/DashboardPage';
import { IntentFormPage } from '@/pages/IntentFormPage';
import { LandingPage } from '@/pages/LandingPage';
import { MatchesPage } from '@/pages/MatchesPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RequestsPage } from '@/pages/RequestsPage';

function AppShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="text-sm text-slate-600">Loading…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function App() {
  const { user, logout } = useAuth();

  return (
    <BrowserRouter>
      {user ? <NavBar onLogout={logout} /> : null}
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppShell>
                <DashboardPage />
              </AppShell>
            </RequireAuth>
          }
        />

        <Route
          path="/app/intent/new"
          element={
            <RequireAuth>
              <AppShell>
                <IntentFormPage mode="create" />
              </AppShell>
            </RequireAuth>
          }
        />

        <Route
          path="/app/intent/:id/edit"
          element={
            <RequireAuth>
              <AppShell>
                <IntentFormPage mode="edit" />
              </AppShell>
            </RequireAuth>
          }
        />

        <Route
          path="/app/intent/:id/matches"
          element={
            <RequireAuth>
              <AppShell>
                <MatchesPage />
              </AppShell>
            </RequireAuth>
          }
        />

        <Route
          path="/app/requests"
          element={
            <RequireAuth>
              <AppShell>
                <RequestsPage />
              </AppShell>
            </RequireAuth>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
