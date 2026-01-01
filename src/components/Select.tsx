import React from 'react';

import { cx } from '@/lib/utils';

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
};

export function Select({ label, error, className, children, ...props }: Props) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-medium text-slate-700">{label}</div>
      <select
        className={cx(
          'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 outline-none',
          error ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-slate-400',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error ? <div className="mt-1 text-xs text-rose-600">{error}</div> : null}
    </label>
  );
}
