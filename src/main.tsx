// FILE: src/main.tsx
import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import './index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root is missing from index.html');

const root: Root = createRoot(container);

/**
 * Anything that blows up while the app is still starting — a bad Firebase
 * config being the usual suspect — would otherwise leave a blank white page
 * and a minified stack trace in the console. Show something readable instead.
 */
function renderFatal(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error('[my-shop] The application failed to start:', error);

  root.render(
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        padding: '2rem 1.5rem',
        textAlign: 'center',
        fontFamily: "'Inter', system-ui, sans-serif",
        color: '#171614',
      }}
    >
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>The shop could not start</h1>
      <p style={{ maxWidth: '32rem', lineHeight: 1.7, color: '#5d5a54', margin: 0 }}>
        This is a configuration problem, not something a shopper did wrong. The most common cause is a
        missing or blank <code>VITE_FIREBASE_API_KEY</code> in the build environment.
      </p>
      <pre
        style={{
          maxWidth: '40rem',
          overflowX: 'auto',
          background: '#efeeec',
          borderRadius: '12px',
          padding: '1rem',
          fontSize: '0.75rem',
          textAlign: 'left',
          margin: 0,
        }}
      >
        {message}
      </pre>
      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: '0.5rem',
          height: '2.75rem',
          padding: '0 1.5rem',
          borderRadius: '12px',
          border: 'none',
          background: '#111827',
          color: '#fff',
          fontSize: '0.8rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>,
  );
}

// Loaded dynamically so a throw during module evaluation (Firebase rejecting an
// invalid API key, for instance) is catchable rather than fatal.
import('./App')
  .then(({ default: App }) =>
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    ),
  )
  .catch(renderFatal);
