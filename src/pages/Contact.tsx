// FILE: src/pages/Contact.tsx
import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { Clock, Mail, MapPin, MessageSquare, Phone, Send } from 'lucide-react';
import { db } from '../lib/firebase';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { Button, Field, Input, Textarea } from '../components/ui';
import { errorMessage } from '../lib/utils';
import { useI18n } from '../lib/i18n';

const Contact: React.FC = () => {
  const { settings } = useStore();
  const toast = useToast();
  const { t } = useI18n();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', body: '' });
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.includes('@') || !form.body.trim()) {
      return toast.error(t('contact.fill'));
    }
    setBusy(true);
    try {
      await addDoc(collection(db, 'messages'), {
        ...form,
        email: form.email.toLowerCase(),
        read: false,
        createdAt: Date.now(),
      });
      setForm({ name: '', email: '', phone: '', subject: '', body: '' });
      toast.success(t('contact.sent'));
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const details = [
    settings.contact.phone && { icon: Phone, label: t('contact.call'), value: settings.contact.phone, href: `tel:${settings.contact.phone}` },
    settings.contact.email && { icon: Mail, label: t('contact.email'), value: settings.contact.email, href: `mailto:${settings.contact.email}` },
    settings.contact.address && { icon: MapPin, label: t('contact.visit'), value: settings.contact.address, href: settings.contact.mapUrl },
    settings.contact.hours && { icon: Clock, label: t('contact.open'), value: settings.contact.hours, href: '' },
  ].filter(Boolean) as { icon: any; label: string; value: string; href: string }[];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="mb-12 max-w-2xl">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-accent">{t('contact.eyebrow')}</p>
        <h1 className="font-display text-4xl font-bold sm:text-5xl">{t('contact.title')}</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-500">
          {t('contact.intro')}</p>
      </header>

      <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-4">
          {details.map((d) => (
            <div key={d.label} className="flex items-start gap-4 rounded-brand border border-ink-200 p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink-50 text-accent">
                <d.icon size={19} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-400">{d.label}</p>
                {d.href ? (
                  <a href={d.href} target={d.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="mt-1 block break-words text-sm font-semibold text-ink-900 hover:text-accent">
                    {d.value}
                  </a>
                ) : (
                  <p className="mt-1 text-sm font-semibold text-ink-900">{d.value}</p>
                )}
              </div>
            </div>
          ))}

          {settings.contact.whatsapp && (
            <a
              href={`https://wa.me/${settings.contact.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-4 rounded-brand bg-brand p-5 transition hover:opacity-90"
            >
              <MessageSquare size={20} />
              <span className="text-sm font-bold uppercase tracking-[0.1em]">{t('contact.chat')}</span>
            </a>
          )}
        </div>

        <form onSubmit={submit} className="rounded-brand border border-ink-200 p-6 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('contact.name')} required>
              <Input value={form.name} onChange={set('name')} placeholder="Jane Doe" />
            </Field>
            <Field label={t('contact.email')} required>
              <Input type="email" value={form.email} onChange={set('email')} placeholder="jane@example.com" />
            </Field>
            <Field label={t('contact.phone')}>
              <Input value={form.phone} onChange={set('phone')} placeholder="+250 7…" />
            </Field>
            <Field label={t('contact.subject')}>
              <Input value={form.subject} onChange={set('subject')} placeholder={t('contact.subjectPh')} />
            </Field>
            <Field label={t('contact.message')} required className="sm:col-span-2">
              <Textarea value={form.body} onChange={set('body')} placeholder={t('contact.messagePh')} className="min-h-40" />
            </Field>
          </div>
          <Button type="submit" size="lg" className="mt-6" loading={busy} icon={<Send size={16} />}>
            {t('contact.send')}
          </Button>
        </form>
      </div>

      {settings.contact.mapUrl && (
        <div className="mt-14 overflow-hidden rounded-brand border border-ink-200">
          <iframe
            title={t('contact.location')}
            src={settings.contact.mapUrl}
            loading="lazy"
            className="h-[360px] w-full border-0"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}
    </div>
  );
};

export default Contact;
