// FILE: src/lib/agent.ts
// Affiliate tracking: ?ref=CODE is remembered 30 days (first touch). Active time is counted only while the tab is visible AND the visitor is interacting.
import { doc, increment, serverTimestamp, setDoc, updateDoc, type DocumentReference } from 'firebase/firestore';
import { db } from './firebase';

const KEY = 'ag.ref';
const TTL = 30 * 864e5;
const BOT = /bot|crawl|spider|headless|lighthouse|preview|facebookexternalhit|whatsapp/i;

let ref: DocumentReference | null = null;
let ready: Promise<void> = Promise.resolve();
let dead = false;
let timer: number | undefined;
let lastTouch = Date.now();
let scrolledSent = false;
const seen = new Set<string>();

const day = () => new Date().toISOString().slice(0, 10);

function once(store: Storage, key: string): boolean {
  try { if (store.getItem(key)) return false; store.setItem(key, '1'); return true; } catch { return false; }
}

function readRef(): { code: string; at: number } | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { code: string; at: number };
    if (!v.code || Date.now() - v.at > TTL) return null;
    return v;
  } catch { return null; }
}

export function getRef(): string { return readRef()?.code ?? ''; }

export function captureRef(search: string): void {
  try {
    const raw = new URLSearchParams(search).get('ref');
    if (!raw) return;
    const code = raw.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 24);
    if (!code) return;
    if (readRef()) return; // first touch wins for 30 days
    localStorage.setItem(KEY, JSON.stringify({ code, at: Date.now() }));
  } catch { /* ignore */ }
}

function visitorId(): string {
  try {
    let v = localStorage.getItem('ag.vid');
    if (!v) { v = (crypto.randomUUID?.() ?? String(Math.random()).slice(2) + Date.now()).replace(/-/g, '').slice(0, 24); localStorage.setItem('ag.vid', v); }
    return v;
  } catch { return 'anon' + Math.random().toString(36).slice(2, 10); }
}

function push(extra: Record<string, unknown>): void {
  if (!ref || dead) return;
  const r = ref;
  void ready
    .then(() => (dead ? undefined : updateDoc(r, { ...extra, lastAt: Date.now(), lastServer: serverTimestamp() })))
    .catch((e) => { const c = (e as { code?: string })?.code; if (c === 'permission-denied' || c === 'not-found') dead = true; });
}

export function startAgentSession(): void {
  if (timer !== undefined || typeof window === 'undefined') return;
  const code = getRef();
  if (!code) return;
  const ua = navigator.userAgent || '';
  if (BOT.test(ua)) return;
  const vid = visitorId();
  const d = day();
  const id = `${vid}__${code}__${d}`;
  ref = doc(db, 'agentVisits', id);
  const r = ref;
  if (once(localStorage, 'ag.c.' + id)) {
    ready = setDoc(r, {
      code, vid, day: d, startedAt: Date.now(), lastAt: Date.now(), lastServer: serverTimestamp(),
      activeSec: 0, pages: 0, productViews: 0, scrolled: false, waClicks: 0,
      landing: location.pathname.slice(0, 80), ua: ua.slice(0, 160),
    }).catch(() => { dead = true; });
  }
  const touch = () => { lastTouch = Date.now(); };
  ['mousemove', 'touchstart', 'keydown', 'click'].forEach((e) => window.addEventListener(e, touch, { passive: true }));
  window.addEventListener('scroll', () => {
    touch();
    if (!scrolledSent) { scrolledSent = true; push({ scrolled: true }); }
  }, { passive: true });
  timer = window.setInterval(() => {
    if (document.visibilityState === 'visible' && Date.now() - lastTouch < 30000) push({ activeSec: increment(10) });
  }, 10000);
}

export function notePage(pathname: string): void {
  if (!ref || dead || seen.size > 40 || seen.has(pathname)) return;
  seen.add(pathname);
  const extra: Record<string, unknown> = { pages: increment(1) };
  if (pathname.startsWith('/product/')) extra.productViews = increment(1);
  push(extra);
}

export function logAgentLead(p: { id: string; name: string; price: number; qty: number }): void {
  const code = getRef();
  if (!code) return;
  push({ waClicks: increment(1) });
  const id = `${visitorId()}__${p.id}__${day()}`;
  void setDoc(doc(db, 'agentLeads', id), {
    code, vid: visitorId(), productId: p.id, productName: String(p.name).slice(0, 120),
    price: Number(p.price) || 0, qty: Number(p.qty) || 1, status: 'lead', amount: 0, note: '', createdAt: Date.now(),
  }).catch(() => undefined);
}