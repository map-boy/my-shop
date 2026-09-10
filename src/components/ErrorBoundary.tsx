// FILE: src/components/ErrorBoundary.tsx
import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Stops one broken component from blanking the whole shop.
 *
 * Without this, any render-time throw unmounts the entire React tree and the
 * visitor is left staring at a white page — which is exactly what happened when
 * a bad `useEffect` clean-up took down <ScrollToTop>.
 */
class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[my-shop] A component crashed:', error, info.componentStack);
  }

  private reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 py-16 text-center">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Something broke on this page</h1>
        <p className="max-w-md text-[15px] leading-relaxed text-ink-500">
          The rest of the shop is fine — this page hit an unexpected error. Try it again, or head back
          to the home page.
        </p>

        <pre className="thin-scrollbar max-w-xl overflow-x-auto rounded-xl bg-ink-100 p-4 text-left text-[11px] text-ink-700">
          {error.message}
        </pre>

        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <button
            onClick={this.reset}
            className="h-11 rounded-xl bg-brand px-6 text-[12px] font-bold uppercase tracking-[0.08em] transition hover:opacity-90"
          >
            Try again
          </button>
          <a
            href="/"
            className="flex h-11 items-center rounded-xl border border-ink-300 px-6 text-[12px] font-bold uppercase tracking-[0.08em] text-ink-800 transition hover:border-ink-900"
          >
            Back to the shop
          </a>
        </div>

        <p className="font-mono text-[10px] text-ink-400">build {__BUILD_ID__}</p>
      </div>
    );
  }
}

export default ErrorBoundary;
