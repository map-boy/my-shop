// FILE: src/components/SectionsBar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSections } from '../lib/sections';
import { L10n } from '../lib/i18n';
import { cn } from '../lib/utils';

const chip = 'shrink-0 rounded-full px-4 py-2 text-[12px] font-bold uppercase tracking-[0.12em] transition';
const on = 'bg-ink-900 text-white';
const off = 'bg-ink-100 text-ink-700 hover:bg-ink-200';

const SectionsBar: React.FC = () => {
  const { live } = useSections();
  const { pathname } = useLocation();
  if (pathname.startsWith('/admin') || live.length === 0) return null;
  return (
    <div className="border-b border-ink-200 bg-white">
      <div className="no-scrollbar mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2 sm:px-6">
        <Link to="/shop" className={cn(chip, pathname === '/shop' ? on : off)}>{L10n('All')}</Link>
        {live.map((s) => (
          <Link key={s.id} to={'/section/' + s.slug} className={cn(chip, pathname === '/section/' + s.slug ? on : off)}>
            {L10n(s.name)}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SectionsBar;