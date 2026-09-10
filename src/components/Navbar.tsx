// FILE: src/components/Navbar.tsx
import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, Search, ShoppingBag, X, Phone, ChevronRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useCart } from '../context/CartContext';
import { cn } from '../lib/utils';

const LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/shop' },
  { label: 'Categories', to: '/categories' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

const AnnouncementBar: React.FC = () => {
  const { settings } = useStore();
  const a = settings.announcement;
  if (!a.enabled || !a.text) return null;
  return (
    <div className="overflow-hidden py-2 text-center" style={{ background: a.bg, color: a.color }}>
      <Link to={a.link || '/shop'} className="text-[11px] font-semibold tracking-[0.12em] sm:tracking-[0.2em]">
        {a.text}
      </Link>
    </div>
  );
};

const Navbar: React.FC = () => {
  const { settings, categories } = useStore();
  const { count, setOpen } = useCart();
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [term, setTerm] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menu ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menu]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/shop?q=${encodeURIComponent(term.trim())}`);
    setSearchOpen(false);
    setMenu(false);
  };

  return (
    <>
      <AnnouncementBar />

      <header
        className={cn(
          'sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md transition-all',
          scrolled ? 'border-ink-200 shadow-sm' : 'border-transparent',
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:h-20 sm:px-6">
          <button
            onClick={() => setMenu(true)}
            className="-ml-2 rounded-lg p-2 text-ink-800 transition hover:bg-ink-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt={settings.storeName} className="h-9 w-auto object-contain sm:h-10" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-sm font-black sm:h-10 sm:w-10">
                {settings.storeName.slice(0, 1)}
              </span>
            )}
            <span className="font-display text-lg font-bold tracking-tight text-ink-900 sm:text-xl">
              {settings.storeName}
            </span>
          </Link>

          <nav className="ml-8 hidden items-center gap-1 lg:flex">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors',
                    isActive ? 'text-brand' : 'text-ink-600 hover:text-ink-900',
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <form onSubmit={submitSearch} className="relative hidden xl:block">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search products…"
                className="h-10 w-56 rounded-full border border-ink-200 bg-ink-50 pl-10 pr-4 text-sm outline-none transition focus:w-72 focus:border-ink-400 focus:bg-white"
              />
            </form>

            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="rounded-lg p-2.5 text-ink-800 transition hover:bg-ink-100 xl:hidden"
              aria-label="Search"
            >
              <Search size={20} />
            </button>

            {settings.contact.whatsapp && (
              <a
                href={`https://wa.me/${settings.contact.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="hidden rounded-lg p-2.5 text-ink-800 transition hover:bg-ink-100 sm:block"
                aria-label="WhatsApp"
              >
                <Phone size={20} />
              </a>
            )}

            <button
              onClick={() => setOpen(true)}
              className="relative rounded-lg p-2.5 text-ink-800 transition hover:bg-ink-100"
              aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}
            >
              <ShoppingBag size={20} />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-black">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          </div>
        </div>

        {searchOpen && (
          <form onSubmit={submitSearch} className="animate-fade-in border-t border-ink-200 bg-white px-4 py-3 xl:hidden">
            <div className="relative">
              <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                autoFocus
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search products…"
                className="h-11 w-full rounded-full border border-ink-200 bg-ink-50 pl-10 pr-4 text-sm outline-none focus:border-ink-400 focus:bg-white"
              />
            </div>
          </form>
        )}
      </header>

      {/* Mobile drawer */}
      {menu && (
        <div className="fixed inset-0 z-[120] lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-black/50" onClick={() => setMenu(false)} />
          <aside className="animate-slide-in absolute right-0 top-0 flex h-full w-[85%] max-w-sm flex-col bg-white">
            <div className="flex items-center justify-between border-b border-ink-200 px-5 py-5">
              <span className="font-display text-lg font-bold">{settings.storeName}</span>
              <button onClick={() => setMenu(false)} className="rounded-lg p-2 hover:bg-ink-100" aria-label="Close menu">
                <X size={20} />
              </button>
            </div>

            <nav className="thin-scrollbar flex-1 overflow-y-auto px-3 py-4">
              {LINKS.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === '/'}
                  onClick={() => setMenu(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between rounded-xl px-4 py-3.5 text-[15px] font-semibold transition',
                      isActive ? 'bg-ink-100 text-ink-900' : 'text-ink-700 hover:bg-ink-50',
                    )
                  }
                >
                  {l.label}
                  <ChevronRight size={16} className="text-ink-400" />
                </NavLink>
              ))}

              {categories.length > 0 && (
                <>
                  <p className="mt-6 px-4 text-[11px] font-bold uppercase tracking-[0.2em] text-ink-400">
                    Categories
                  </p>
                  {categories.slice(0, 10).map((c) => (
                    <Link
                      key={c.id}
                      to={`/shop?category=${c.id}`}
                      onClick={() => setMenu(false)}
                      className="block rounded-xl px-4 py-3 text-sm text-ink-600 transition hover:bg-ink-50"
                    >
                      {c.name}
                    </Link>
                  ))}
                </>
              )}
            </nav>

            <div className="border-t border-ink-200 px-5 py-5 text-xs text-ink-500">
              <p className="font-semibold text-ink-800">{settings.contact.phone}</p>
              <p className="mt-1">{settings.contact.hours}</p>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

export default Navbar;
