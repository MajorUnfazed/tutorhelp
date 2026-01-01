import React from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-14">
        <Card className="p-6">
          <div className="text-lg font-semibold text-slate-900">Page not found</div>
          <div className="mt-2 text-sm text-slate-600">That route doesn’t exist.</div>
          <div className="mt-4">
            <Link to="/">
              <Button variant="secondary">Go Home</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
