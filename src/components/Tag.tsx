import React from 'react';

import { cx } from '@/lib/utils';

export function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700',
        className
      )}
    >
      {children}
    </span>
  );
}
