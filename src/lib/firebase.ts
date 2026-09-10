// FILE: src/lib/firebase.ts
import { initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

/**
 * Firebase web configuration.
 *
 * These are *public* client identifiers (not secrets) — access is controlled by
 * the Firestore / Storage security rules that ship with this repo. They are
 * still read from the environment first so the same build can be pointed at a
 * staging project from GitHub Environment secrets.
 */
const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyCRD4Lni_kp2ndrcjxQA_vPbhAFPvA2J-c',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'my-shop-84749.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'my-shop-84749',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'my-shop-84749.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '627398185087',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:627398185087:web:182804c7a7ee2aaee16f4a',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? 'G-2HHKEENZ84',
};

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
export const OWNER_EMAIL = (import.meta.env.VITE_OWNER_EMAIL ?? 'techubwenge@gmail.com')
  .trim()
  .toLowerCase();

export default app;
