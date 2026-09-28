import React from 'react';
import { Globe } from 'lucide-react';
import { LANGS, useI18n, type Lang } from '../lib/i18n';

const LanguageSwitcher: React.FC = () => {
  const { lang, setLang } = useI18n();
  return (
    <label className="flex items-center rounded-lg p-2 text-ink-800 transition hover:bg-ink-100">
      <Globe size={18} />
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        aria-label="Language"
        className="ml-1 max-w-[6.5rem] bg-transparent text-xs font-semibold outline-none"
      >
        {LANGS.map((l) => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
    </label>
  );
};

export default LanguageSwitcher;