// FILE: src/components/Footer.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { addDoc, collection } from 'firebase/firestore';
import { Facebook, Instagram, Twitter, Youtube, Linkedin, Mail, MapPin, Phone, Lock } from 'lucide-react';
import { db } from '../lib/firebase';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { Button } from './ui';

const SOCIAL_ICONS = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  linkedin: Linkedin,
} as const;

const Footer: React.FC = () => {
  const { settings } = useStore();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return toast.error('Enter a valid e-mail address.');
    setBusy(true);
    try {
      await addDoc(collection(db, 'subscribers'), { email: email.toLowerCase(), createdAt: Date.now() });
      setEmail('');
      toast.success('You are on the list. Talk soon!');
    } catch {
      toast.error('Could not subscribe right now.');
    } finally {
      setBusy(false);
    }
  };

  const socials = Object.entries(settings.social).filter(([, url]) => !!url);

  return (
    <footer className="mt-24 bg-ink-950 text-ink-300">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(2,1fr)_1.3fr]">
          {/* Brand */}
          <div>
            <div className="mb-5 flex items-center gap-3">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="" className="h-10 w-auto object-contain" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-sm font-black">
                  {settings.storeName.slice(0, 1)}
                </span>
              )}
              <span className="font-display text-xl font-bold text-white">{settings.storeName}</span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-ink-400">{settings.footer.about}</p>

            {socials.length > 0 && (
              <div className="mt-7 flex flex-wrap gap-2.5">
                {socials.map(([key, url]) => {
                  const Icon = SOCIAL_ICONS[key as keyof typeof SOCIAL_ICONS];
                  return (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={key}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 transition hover:border-accent hover:text-accent"
                    >
                      {Icon ? <Icon size={17} /> : key.slice(0, 1).toUpperCase()}
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Link columns */}
          {settings.footer.columns.slice(0, 2).map((col) => (
            <div key={col.title}>
              <h4 className="mb-5 text-[11px] font-bold uppercase tracking-[0.24em] text-white">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={`${l.label}-${l.href}`}>
                    {l.href.startsWith('http') ? (
                      <a href={l.href} target="_blank" rel="noreferrer" className="text-sm text-ink-400 transition hover:text-accent">
                        {l.label}
                      </a>
                    ) : (
                      <Link to={l.href} className="text-sm text-ink-400 transition hover:text-accent">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact + newsletter */}
          <div>
            <h4 className="mb-5 text-[11px] font-bold uppercase tracking-[0.24em] text-white">Get in touch</h4>
            <ul className="space-y-3.5 text-sm text-ink-400">
              {settings.contact.phone && (
                <li className="flex items-start gap-3">
                  <Phone size={16} className="mt-0.5 shrink-0 text-accent" />
                  <a href={`tel:${settings.contact.phone}`} className="hover:text-accent">
                    {settings.contact.phone}
                  </a>
                </li>
              )}
              {settings.contact.email && (
                <li className="flex items-start gap-3">
                  <Mail size={16} className="mt-0.5 shrink-0 text-accent" />
                  <a href={`mailto:${settings.contact.email}`} className="break-all hover:text-accent">
                    {settings.contact.email}
                  </a>
                </li>
              )}
              {settings.contact.address && (
                <li className="flex items-start gap-3">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-accent" />
                  <span>{settings.contact.address}</span>
                </li>
              )}
            </ul>

            <form onSubmit={subscribe} className="mt-7 flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your e-mail"
                className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-ink-500 focus:border-accent"
              />
              <Button type="submit" variant="accent" loading={busy} className="shrink-0">
                Join
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <p>{settings.footer.copyright}</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span>{settings.footer.paymentNote}</span>
            <Link to="/admin" className="inline-flex items-center gap-1.5 transition hover:text-accent">
              <Lock size={12} /> Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
