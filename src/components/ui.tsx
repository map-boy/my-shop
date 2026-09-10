// FILE: src/components/ui.tsx
import React from 'react';
import { Loader2, X } from 'lucide-react';
import { cn } from '../lib/utils';

/* -------------------------------------------------------------------------- */
/*  Button                                                                     */
/* -------------------------------------------------------------------------- */

type ButtonVariant = 'primary' | 'accent' | 'outline' | 'ghost' | 'danger' | 'subtle';
type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand hover:opacity-90 shadow-sm',
  accent: 'bg-accent hover:opacity-90 shadow-sm',
  outline: 'border border-ink-300 text-ink-900 hover:border-ink-900 hover:bg-ink-50',
  ghost: 'text-ink-700 hover:bg-ink-100',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  subtle: 'bg-ink-100 text-ink-900 hover:bg-ink-200',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-[12px]',
  md: 'h-11 px-5 text-[13px]',
  lg: 'h-14 px-8 text-sm',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  full?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  full,
  className,
  children,
  disabled,
  ...rest
}) => (
  <button
    {...rest}
    disabled={disabled || loading}
    className={cn(
      'inline-flex items-center justify-center gap-2 rounded-xl font-semibold uppercase tracking-[0.08em] transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
      VARIANTS[variant],
      SIZES[size],
      full && 'w-full',
      className,
    )}
  >
    {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
    {children}
  </button>
);

/* -------------------------------------------------------------------------- */
/*  Form primitives                                                            */
/* -------------------------------------------------------------------------- */

export const Field: React.FC<{
  label?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ label, hint, required, className, children }) => (
  <div className={cn('w-full', className)}>
    {label && (
      <label className="label">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
    )}
    {children}
    {hint && <p className="mt-1.5 text-[11px] leading-relaxed text-ink-500">{hint}</p>}
  </div>
);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...rest }, ref) => <input ref={ref} className={cn('field', className)} {...rest} />,
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...rest }, ref) => (
  <textarea ref={ref} className={cn('field', className)} {...rest} />
));
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...rest }, ref) => (
  <div className="relative">
    <select ref={ref} className={cn('field pr-9', className)} {...rest}>
      {children}
    </select>
    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400">▾</span>
  </div>
));
Select.displayName = 'Select';

export const Toggle: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  hint?: string;
}> = ({ checked, onChange, label, hint }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="flex w-full items-center gap-3 text-left"
  >
    <span
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors',
        checked ? 'bg-accent' : 'bg-ink-300',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
          checked ? 'left-[1.4rem]' : 'left-0.5',
        )}
      />
    </span>
    {(label || hint) && (
      <span className="min-w-0">
        {label && <span className="block text-sm font-semibold">{label}</span>}
        {hint && <span className="block text-[11px] leading-snug text-ink-500">{hint}</span>}
      </span>
    )}
  </button>
);

/* -------------------------------------------------------------------------- */
/*  Layout helpers                                                             */
/* -------------------------------------------------------------------------- */

export const Badge: React.FC<{
  children: React.ReactNode;
  tone?: 'neutral' | 'green' | 'amber' | 'red' | 'blue' | 'accent';
  className?: string;
}> = ({ children, tone = 'neutral', className }) => {
  const tones = {
    neutral: 'bg-ink-100 text-ink-700',
    green: 'bg-emerald-100 text-emerald-800',
    amber: 'bg-amber-100 text-amber-800',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-800',
    accent: 'bg-accent',
  } as const;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em]',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
};

export const Spinner: React.FC<{ className?: string; size?: number }> = ({ className, size = 22 }) => (
  <Loader2 size={size} className={cn('animate-spin text-ink-400', className)} />
);

export const PageLoader: React.FC<{ label?: string }> = ({ label = 'Loading' }) => (
  <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
    <Spinner size={28} />
    <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-ink-400">{label}</p>
  </div>
);

export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  text?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ icon, title, text, action, className }) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-300 px-6 py-16 text-center',
      className,
    )}
  >
    {icon && <div className="mb-4 text-ink-300">{icon}</div>}
    <h3 className="font-display text-xl font-bold">{title}</h3>
    {text && <p className="mt-2 max-w-sm text-sm text-ink-500">{text}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);

export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ open, onClose, title, subtitle, size = 'md', children, footer }) => {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' } as const;

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade-in bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'light-surface animate-fade-up relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white text-ink-900 shadow-2xl sm:rounded-2xl',
          widths[size],
        )}
      >
        {(title || subtitle) && (
          <header className="flex items-start justify-between gap-4 border-b border-ink-200 px-6 py-5">
            <div className="min-w-0">
              {title && <h2 className="font-display text-xl font-bold text-ink-900">{title}</h2>}
              {subtitle && <p className="mt-1 text-xs text-ink-500">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="rounded-lg p-2 text-ink-500 transition hover:bg-ink-100" aria-label="Close">
              <X size={18} />
            </button>
          </header>
        )}
        <div className="thin-scrollbar flex-1 overflow-y-auto px-6 py-6">{children}</div>
        {footer && <footer className="border-t border-ink-200 bg-ink-50 px-6 py-4">{footer}</footer>}
      </div>
    </div>
  );
};

export const ConfirmDialog: React.FC<{
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ open, title, message, confirmLabel = 'Confirm', destructive, busy, onCancel, onConfirm }) => (
  <Modal open={open} onClose={onCancel} title={title} size="sm">
    <p className="text-sm leading-relaxed text-ink-600">{message}</p>
    <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <Button variant="outline" onClick={onCancel} disabled={busy}>
        Cancel
      </Button>
      <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm} loading={busy}>
        {confirmLabel}
      </Button>
    </div>
  </Modal>
);

export const SectionHeading: React.FC<{
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  action?: React.ReactNode;
}> = ({ eyebrow, title, subtitle, align = 'left', action }) => (
  <div
    className={cn(
      'mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
      align === 'center' && 'sm:flex-col sm:items-center sm:text-center',
    )}
  >
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
      {eyebrow && (
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-accent">{eyebrow}</p>
      )}
      <h2 className="font-display text-3xl font-bold leading-tight text-ink-900 sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-[15px] leading-relaxed text-ink-500">{subtitle}</p>}
    </div>
    {action}
  </div>
);
