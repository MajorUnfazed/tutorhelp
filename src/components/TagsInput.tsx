import React, { useMemo, useState } from 'react';

import { Button } from '@/components/Button';
import { Tag } from '@/components/Tag';
import { uniqNormalized } from '@/lib/utils';

export function TagsInput({
  label,
  value,
  onChange,
  placeholder,
  suggestions
}: {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  suggestions?: readonly string[];
}) {
  const [draft, setDraft] = useState('');

  const normalized = useMemo(() => uniqNormalized(value), [value]);

  const addFromDraft = () => {
    const parts = draft
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    const next = uniqNormalized([...normalized, ...parts]);
    onChange(next);
    setDraft('');
  };

  const remove = (tag: string) => {
    onChange(normalized.filter((t) => t.toLowerCase() !== tag.toLowerCase()));
  };

  return (
    <div>
      <div className="mb-1 text-sm font-medium text-slate-700">{label}</div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addFromDraft();
            }
          }}
          placeholder={placeholder ?? 'Type and press Enter (or comma)'}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
        />
        <Button type="button" variant="secondary" onClick={addFromDraft}>
          Add
        </Button>
      </div>

      {suggestions && suggestions.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              className="text-xs text-slate-600 hover:text-slate-900"
              onClick={() => onChange(uniqNormalized([...normalized, s]))}
            >
              + {s}
            </button>
          ))}
        </div>
      ) : null}

      {normalized.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {normalized.map((t) => (
            <button key={t} type="button" onClick={() => remove(t)}>
              <Tag className="hover:border-slate-300">{t} ×</Tag>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-2 text-xs text-slate-500">No tags yet.</div>
      )}
    </div>
  );
}
