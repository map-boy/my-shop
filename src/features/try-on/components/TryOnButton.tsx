import React from 'react';
import { Link } from 'react-router-dom';
import { TRY_ON_ENABLED } from '../flag';
import { useTT } from '../strings';
interface Props { slug: string; img?: string }
/** Product-page button. Renders nothing while the flag is off. */
export default function TryOnButton({ slug, img }: Props) {
  const t = useTT(); if (!TRY_ON_ENABLED || !slug) return null;
  const q = new URLSearchParams({ p: slug }); if (img) q.set('img', img);
  return <Link to={`/try-on?${q.toString()}`} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-ink-900 py-3 text-sm font-semibold text-ink-900 transition hover:bg-ink-900 hover:text-white">{t('title')}</Link>;
}