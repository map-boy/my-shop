// FILE: src/lib/autoTranslate.ts
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { textKey } from './i18n';

export const AUTO_LANGS = ['fr', 'ar', 'rw'] as const;
type Table = { m?: Record<string, string> };

async function call(lang: string, texts: string[], token: string): Promise<string[]> {
  const r = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ lang, texts }),
  });
  if (!r.ok) throw new Error('translate ' + r.status);
  const j = (await r.json()) as { t?: string[] };
  return Array.isArray(j.t) ? j.t : [];
}

/**
 * Translates every English text that has no saved translation yet (French, Arabic, Kinyarwanda)
 * and stores it in Firestore `translations/{lang}` keyed by textKey(text). Existing entries are never touched.
 */
export async function translateMissing(
  input: Array<string | undefined | null>,
): Promise<{ added: number; failed: number }> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Sign in again to translate.');
  const uniq = Array.from(
    new Set(input.filter((s): s is string => typeof s === 'string' && s.length <= 4500 && /[A-Za-z]{2}/.test(s))),
  );
  if (!uniq.length) return { added: 0, failed: 0 };

  let added = 0;
  let failed = 0;
  for (const lang of AUTO_LANGS) {
    const snap = await getDoc(doc(db, 'translations', lang)).catch(() => null);
    const have = (snap?.data() as Table | undefined)?.m ?? {};
    const todo = uniq.filter((s) => !have[textKey(s)]);
    if (!todo.length) continue;

    const chunks: string[][] = [];
    let cur: string[] = [];
    let chars = 0;
    for (const s of todo) {
      if (cur.length >= 40 || chars + s.length > 9000) { chunks.push(cur); cur = []; chars = 0; }
      cur.push(s);
      chars += s.length;
    }
    if (cur.length) chunks.push(cur);

    const fresh: Record<string, string> = {};
    for (const chunk of chunks) {
      try {
        const out = await call(lang, chunk, token);
        chunk.forEach((s, k) => {
          const v = out[k];
          if (v) fresh[textKey(s)] = v; else failed++;
        });
      } catch {
        failed += chunk.length;
      }
    }
    const n = Object.keys(fresh).length;
    if (n) {
      await setDoc(doc(db, 'translations', lang), { m: fresh }, { merge: true });
      added += n;
    }
  }
  return { added, failed };
}