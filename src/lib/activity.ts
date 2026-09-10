// FILE: src/lib/activity.ts
import { addDoc, collection } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Appends an entry to the audit trail. Never throws — a failed log must never
 * take down the action that produced it.
 */
export function logActivity(actor: string, action: string, target: string): void {
  void addDoc(collection(db, 'activity'), {
    actor,
    action,
    target,
    at: Date.now(),
  }).catch(() => undefined);
}
