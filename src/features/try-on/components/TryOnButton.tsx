import React from 'react';
import { Link } from 'react-router-dom';
import { TRY_ON_ENABLED } from '../flag';
import { useTT } from '../strings';
/** Drop into ProductDetail later. Renders nothing while the flag is off. */
export default function TryOnButton() {
  const t = useTT(); if (!TRY_ON_ENABLED) return null;
  return <Link to="/try-on" className="inline-flex items-center justify-center rounded-xl border border-neutral-900 px-4 py-3 text-sm font-medium">{t('title')}</Link>;
}