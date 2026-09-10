import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { execSync } from 'node:child_process';

/** Stamped into the bundle so you can tell which commit a deployed site is running. */
function buildId(): string {
  const sha =
    process.env.GITHUB_SHA?.slice(0, 7) ||
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
    (() => {
      try {
        return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
          .toString()
          .trim();
      } catch {
        return 'unknown';
      }
    })();
  return `${sha} · ${new Date().toISOString().slice(0, 16).replace('T', ' ')}Z`;
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __BUILD_ID__: JSON.stringify(buildId()),
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
        },
      },
    },
  },
});
