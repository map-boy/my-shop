// FILE: src/pages/admin/AdminNotify.tsx
import React, { useState } from 'react';
import { getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { Bell, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAdminData } from '../../hooks/useAdminData';
import { useToast } from '../../context/ToastContext';
import { Button, Field, Input, Textarea } from '../../components/ui';
import { errorMessage, slugify } from '../../lib/utils';

const AdminNotify: React.FC = () => {
  const { admin, isSeller, managesEverything } = useAuth();
  const { admins } = useAdminData();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [audience, setAudience] = useState('all');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('');

  const defaultUrl = isSeller ? `/shop/${slugify(admin?.shopName ?? '')}` : '/';

  const send = async () => {
    if (!title.trim() || !body.trim()) return toast.error('Write a title and a message.');
    setBusy(true);
    setResult('');
    try {
      const t = await getAuth(getApp()).currentUser?.getIdToken();
      if (!t) throw new Error('Sign in again, then retry.');
      const r = await fetch('/api/push-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), url: url.trim() || defaultUrl, audience }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || `Failed (${r.status})`);
      setResult(`Sent to ${j.sent} of ${j.total} devices.`);
      toast.success(`Sent to ${j.sent} devices.`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">Notifications</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">Send a notification</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-400">
          {managesEverything
            ? 'Reaches shoppers who allowed notifications. Choose everyone, or only people who looked at one seller.'
            : 'Reaches shoppers who allowed notifications and looked at your shop or your products.'}
        </p>
      </header>

      <section className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <h2 className="flex items-center gap-2.5 font-display text-xl font-bold text-white">
          <Bell size={19} className="text-accent" /> Message
        </h2>
        {managesEverything && (
          <Field label="Audience">
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-2.5 text-sm text-white"
            >
              <option value="all">Everyone</option>
              {admins.filter((a) => a.role === 'seller').map((a) => (
                <option key={a.email} value={a.email}>{a.shopName || a.email}</option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Title" required hint="Up to 60 characters.">
          <Input value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} placeholder="New arrivals at Uwase Fashion" />
        </Field>
        <Field label="Message" required hint="Up to 180 characters.">
          <Textarea value={body} maxLength={180} onChange={(e) => setBody(e.target.value)} placeholder="Fresh dresses and shirts just landed. Tap to see." />
        </Field>
        <Field label="Opens page" hint={`A path on this site. Default: ${defaultUrl}`}>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={defaultUrl} />
        </Field>
        <Button variant="accent" icon={<Send size={14} />} loading={busy} onClick={() => void send()}>
          Send now
        </Button>
        {result && <p className="text-sm text-ink-300">{result}</p>}
      </section>
    </div>
  );
};

export default AdminNotify;