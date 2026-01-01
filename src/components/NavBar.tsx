import React from 'react';
import { Link, NavLink } from 'react-router-dom';

import { Button } from '@/components/Button';
import { cx } from '@/lib/utils';

export function NavBar({ onLogout }: { onLogout: () => void }) {
  const navClass = ({ isActive }: { isActive: boolean }) =>
    cx(
      'rounded-lg px-3 py-2 text-sm font-medium',
      isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
    );

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/app" className="text-base font-semibold text-slate-900">
          SASTRA TeamMatch
        </Link>

        <div className="flex items-center gap-2">
          <NavLink to="/app" end className={navClass}>
            Dashboard
          </NavLink>
          <NavLink to="/app/requests" className={navClass}>
            Requests
          </NavLink>
          <Button variant="secondary" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
