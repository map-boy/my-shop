// FILE: src/lib/firebase.ts
import { initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

/**
 * Reads a build-time variable, treating a blank value as "not set".
 *
 * This matters: a CI job that references a secret which does not exist — say
 * `VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}` before the
 * GitHub Environment has been filled in — hands Vite an *empty string*, not
 * `undefined`. `??` would happily inline that empty string and Firebase would
 * then fail at start-up with `auth/invalid-api-key`.
 */
function envOr(value: string | undefined, fallback: string): string {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed || fallback;
}

/**
 * Firebase web configuration.
 *
 * These are *public* client identifiers (not secrets) — access is controlled by
 * the Firestore / Storage security rules that ship with this repo. They are
 * still read from the environment first so the same build can be pointed at a
 * staging project without a code change.
 */
const firebaseConfig: FirebaseOptions = {
  apiKey: envOr(import.meta.env.VITE_FIREBASE_API_KEY, 'AIzaSyCRD4Lni_kp2ndrcjxQA_vPbhAFPvA2J-c'),
  authDomain: envOr(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, 'my-shop-84749.firebaseapp.com'),
  projectId: envOr(import.meta.env.VITE_FIREBASE_PROJECT_ID, 'my-shop-84749'),
  storageBucket: envOr(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, 'my-shop-84749.firebasestorage.app'),
  messagingSenderId: envOr(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, '627398185087'),
  appId: envOr(import.meta.env.VITE_FIREBASE_APP_ID, '1:627398185087:web:182804c7a7ee2aaee16f4a'),
  measurementId: envOr(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, 'G-2HHKEENZ84'),
};

/**
 * A Firebase browser API key always starts with `AIza`. Catching a malformed
 * one here produces a readable message instead of a blank page and a minified
 * `auth/invalid-api-key` deep inside the SDK.
 */
export const configError: string | null = /^AIza[0-9A-Za-z_-]{30,}$/.test(String(firebaseConfig.apiKey))
  ? null
  : `The Firebase API key this build was given is not valid ("${String(firebaseConfig.apiKey).slice(0, 12)}…"). ` +
    'Check that VITE_FIREBASE_API_KEY is set — and not blank — wherever the site is built.';

if (configError) console.error('[my-shop]', configError);

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Keep the admin signed in across reloads.
setPersistence(auth, browserLocalPersistence).catch(() => {
  /* Safari private mode — fall back to the default in-memory persistence. */
});

/**
 * Bootstrap super administrator. This account can always reach the dashboard
 * even before the `admins` collection exists, and is the only one that cannot
 * be removed. Everyone else is granted access from Dashboard → Team.
 */
export const OWNER_EMAIL = envOr(import.meta.env.VITE_OWNER_EMAIL, 'techubwenge@gmail.com').toLowerCase();

export default app;
