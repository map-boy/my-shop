// FILE: src/lib/sections.ts
import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from './firebase';
import type { Section } from './types';

let cache: Section[] = [];
let ready = false;
let started = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

function start() {
  if (started) return;
  started = true;
  onSnapshot(
    query(collection(db, 'sections'), orderBy('order', 'asc')),
    (snap) => {
      cache = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Section);
      ready = true;
      emit();
    },
    () => { ready = true; emit(); },
  );
}

/** Shared live list of storefront sections (Cagua, Mangaze, ...). One Firestore listener for the whole app. */
export function useSections() {
  const [, force] = useState(0);
  useEffect(() => {
    start();
    const f = () => force((n) => n + 1);
    subs.add(f);
    f();
    return () => { subs.delete(f); };
  }, []);
  return { sections: cache, live: cache.filter((s) => s.enabled !== false), loading: !ready };
}