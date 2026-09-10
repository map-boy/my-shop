// FILE: src/hooks/useSettingsDraft.ts
import { useEffect, useMemo, useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { logActivity } from '../lib/activity';
import type { StoreSettings } from '../lib/types';
import { errorMessage } from '../lib/utils';

/**
 * Editable copy of the store settings. Changes stay local until `save()` is
 * called, so an administrator can review a whole screen before publishing it.
 */
export function useSettingsDraft(section: string) {
  const { settings } = useStore();
  const { admin } = useAuth();
  const toast = useToast();

  const [draft, setDraft] = useState<StoreSettings>(settings);
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);

  // Adopt incoming changes only while the admin has not started editing,
  // so a live update from another tab never wipes work in progress.
  useEffect(() => {
    if (!touched) setDraft(settings);
  }, [settings, touched]);

  const set = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => {
    setTouched(true);
    setDraft((d) => ({ ...d, [key]: value }));
  };

  /** Patches one field inside a nested settings object. */
  const setIn = <K extends keyof StoreSettings>(key: K, patch: Partial<StoreSettings[K]>) => {
    setTouched(true);
    setDraft((d) => ({ ...d, [key]: { ...(d[key] as object), ...patch } as StoreSettings[K] }));
  };

  const save = async () => {
    setBusy(true);
    try {
      await setDoc(
        doc(db, 'settings', 'store'),
        { ...draft, updatedAt: Date.now(), updatedBy: admin?.email ?? 'admin' },
        { merge: true },
      );
      logActivity(admin?.email ?? 'admin', 'updated settings', section);
      setTouched(false);
      toast.success('Saved — the storefront is already showing it.');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setDraft(settings);
    setTouched(false);
  };

  return useMemo(
    () => ({ draft, set, setIn, save, reset, busy, dirty: touched }),
    [draft, busy, touched],
  );
}
