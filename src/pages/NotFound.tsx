import { useI18n } from '../lib/i18n';
// FILE: src/pages/NotFound.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui';

const NotFound: React.FC = () => {
  const { t } = useI18n();
  return (
  <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
    <p className="font-display text-7xl font-bold text-ink-200">404</p>
    <h1 className="mt-4 font-display text-3xl font-bold">{t('notFound.title')}</h1>
    <p className="mt-3 text-sm text-ink-500">
      {t('notFound.text')}
    </p>
    <div className="mt-9 flex gap-3">
      <Link to="/"><Button>{t('notFound.home')}</Button></Link>
      <Link to="/shop"><Button variant="outline">{t('notFound.shop')}</Button></Link>
    </div>
  </div>
); };

export default NotFound;
