/// <reference types="vite/client" />

/** Commit and timestamp of the build currently running. Injected by Vite. */
declare const __BUILD_ID__: string;

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string;
  readonly VITE_OWNER_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
