// FILE: src/App.tsx
import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';

import { AuthProvider, useAuth } from '@/app/context/AuthContext';
import { StoreProvider, useStore } from '@/app/context/StoreContext';
import { CartProvider } from '@/app/context/CartContext';
import { ToastProvider } from '@/app/context/ToastContext';
import { LanguageProvider } from '@/shared/lib/i18n';
import { AdminDataProvider } from '@/shared/hooks/useAdminData';

import Navbar from '@/shared/components/Navbar';
import Footer from '@/shared/components/Footer';
import CartDrawer from '@/shared/components/CartDrawer';
import ErrorBoundary from '@/shared/components/ErrorBoundary';

import Home from '@/features/storefront/pages/Home';
import Shop from '@/features/storefront/pages/Shop';
import ProductDetail from '@/features/storefront/pages/ProductDetail';
import Categories from '@/features/storefront/pages/Categories';
import Cart from '@/features/storefront/pages/Cart';
import Checkout from '@/features/storefront/pages/Checkout';
import OrderSuccess from '@/features/storefront/pages/OrderSuccess';
import About from '@/features/storefront/pages/About';
import Contact from '@/features/storefront/pages/Contact';
import NotFound from '@/features/storefront/pages/NotFound';
import Legal from '@/features/storefront/pages/Legal';
import Blog from '@/features/storefront/pages/Blog';
import BlogPost from '@/features/storefront/pages/BlogPost';
import { PageLoader } from '@/shared/components/ui';
import SectionsBar from '@/shared/components/SectionsBar';
import SectionShelves from '@/shared/components/SectionShelves';
import Splash from '@/shared/components/Splash';
import SectionPage from '@/features/storefront/pages/SectionPage';
import SellerShop from '@/features/storefront/pages/SellerShop';
import Tracker from '@/shared/components/Tracker';
import AgentTracker from '@/shared/components/AgentTracker';
import PushPrompt from '@/shared/components/PushPrompt';
import { L10n } from '@/shared/lib/i18n';

// The dashboard is loaded on demand - shoppers never download it.
const AdminLogin = React.lazy(() => import('@/features/admin/pages/AdminLogin'));
const AdminLayout = React.lazy(() => import('@/features/admin/pages/AdminLayout'));
const Dashboard = React.lazy(() => import('@/features/admin/pages/Dashboard'));
const AdminProducts = React.lazy(() => import('@/features/admin/pages/AdminProducts'));
const AdminCategories = React.lazy(() => import('@/features/admin/pages/AdminCategories'));
const AdminSections = React.lazy(() => import('@/features/admin/pages/AdminSections'));
const AdminInventory = React.lazy(() => import('@/features/admin/pages/AdminInventory'));
const AdminOrders = React.lazy(() => import('@/features/admin/pages/AdminOrders'));
const AdminCustomers = React.lazy(() => import('@/features/admin/pages/AdminCustomers'));
const AdminCoupons = React.lazy(() => import('@/features/admin/pages/AdminCoupons'));
const AdminMessages = React.lazy(() => import('@/features/admin/pages/AdminMessages'));
const AdminHomeBuilder = React.lazy(() => import('@/features/admin/pages/AdminHomeBuilder'));
const AdminSettings = React.lazy(() => import('@/features/admin/pages/AdminSettings'));
const AdminTeam = React.lazy(() => import('@/features/admin/pages/AdminTeam'));
const ShopProfile = React.lazy(() => import('@/features/admin/pages/ShopProfile'));
const AdminTraffic = React.lazy(() => import('@/features/admin/pages/AdminTraffic'));
const AdminNotify = React.lazy(() => import('@/features/admin/pages/AdminNotify'));
const AdminBlog = React.lazy(() => import('@/features/admin/pages/AdminBlog'));
const AdminAgents = React.lazy(() => import('@/features/admin/pages/AdminAgents'));
const AgentDashboard = React.lazy(() => import('@/features/storefront/pages/AgentDashboard'));
const AgentProgram = React.lazy(() => import('@/features/storefront/pages/AgentProgram'));
const AdminApplications = React.lazy(() => import('@/features/admin/pages/AdminApplications'));

const CanonicalTag: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname.startsWith('/admin')) return;
    const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') || '/' : '/';
    let el = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!el) {
      el = document.createElement('link');
      el.rel = 'canonical';
      document.head.appendChild(el);
    }
    el.href = 'https://karibu.fit' + path;
  }, [pathname]);
  return null;
};

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    // Braces matter: the arrow shorthand would hand React whatever
    // window.scrollTo returns, and React would then call it as a clean-up
    // function. Browser extensions patch scrollTo and some return a value.
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

/**
 * Guards the screens that belong to the platform rather than to a seller.
 * Hiding a link is presentation; this is what stops a seller reaching the page
 * by typing its address. The security rules refuse the data either way.
 */
const PlatformOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { managesEverything, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!managesEverything) return <Navigate to="/admin/dashboard" replace />;
  return <>{children}</>;
};

/** Storefront chrome: navigation, cart drawer and footer around every shop page. */
const StoreLayout: React.FC = () => {
  const { settings } = useStore();

  if (settings.maintenance.enabled) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display text-4xl font-bold sm:text-5xl">{L10n(settings.maintenance.title)}</h1>
        <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-500">{L10n(settings.maintenance.message)}</p>
        {settings.contact.phone && (
          <p className="mt-8 text-sm text-ink-600">
            {L10n("Need something urgently? Call")}{' '}
            <a href={`tel:${settings.contact.phone}`} className="font-semibold text-accent">
              {settings.contact.phone}
            </a>
          </p>
        )}
        <a href="/admin" className="mt-12 text-[11px] font-bold uppercase tracking-[0.2em] text-ink-400 hover:text-accent">
          {L10n("Administrator sign-in")}
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
        <SectionsBar />
      <main className="flex-1">
        <Outlet />
        <SectionShelves />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <ToastProvider>
      <AuthProvider>
        <StoreProvider>
          <LanguageProvider><CartProvider>
            <ScrollToTop />
            <Splash />
<CanonicalTag />
            <Tracker />
            <AgentTracker />
            <PushPrompt />
            <ErrorBoundary>
            <React.Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Storefront */}
              <Route element={<StoreLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/shop/:seller" element={<SellerShop />} />
                <Route path="/section/:slug" element={<SectionPage />} />
                <Route path="/product/:slug" element={<ProductDetail />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order/:id" element={<OrderSuccess />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy" element={<Legal kind="privacy" />} />
                <Route path="/terms" element={<Legal kind="terms" />} />
                <Route path="/shipping-returns" element={<Legal kind="shipping-returns" />} />
                <Route path="/disclaimer" element={<Legal kind="disclaimer" />} />
                <Route path="/cookies" element={<Legal kind="cookies" />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/agent" element={<AgentDashboard />} />
                <Route path="/agents" element={<AgentProgram />} />
          <Route path="*" element={<NotFound />} />
              </Route>

              {/* Dashboard */}
              <Route path="/admin" element={<AdminLogin />} />
              <Route
                element={
                  <AdminDataProvider>
                    <AdminLayout />
                  </AdminDataProvider>
                }
              >
                <Route path="/admin/dashboard" element={<Dashboard />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/categories" element={<PlatformOnly><AdminCategories /></PlatformOnly>} />
                <Route path="/admin/sections" element={<PlatformOnly><AdminSections /></PlatformOnly>} />
                <Route path="/admin/inventory" element={<AdminInventory />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/customers" element={<PlatformOnly><AdminCustomers /></PlatformOnly>} />
                <Route path="/admin/coupons" element={<AdminCoupons />} />
                <Route path="/admin/messages" element={<PlatformOnly><AdminMessages /></PlatformOnly>} />
                <Route path="/admin/home-builder" element={<PlatformOnly><AdminHomeBuilder /></PlatformOnly>} />
                <Route path="/admin/settings" element={<PlatformOnly><AdminSettings /></PlatformOnly>} />
                <Route path="/admin/team" element={<PlatformOnly><AdminTeam /></PlatformOnly>} />
                <Route path="/admin/shop-profile" element={<ShopProfile />} />
                <Route path="/admin/traffic" element={<AdminTraffic />} />
                <Route path="/admin/notify" element={<AdminNotify />} />
                <Route path="/admin/blog" element={<PlatformOnly><AdminBlog /></PlatformOnly>} />
                <Route path="/admin/applications" element={<PlatformOnly><AdminApplications /></PlatformOnly>} />
                <Route path="/admin/agents" element={<PlatformOnly><AdminAgents /></PlatformOnly>} />
              </Route>

              <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />
            </Routes>
            </React.Suspense>
            </ErrorBoundary>
          </CartProvider></LanguageProvider>
        </StoreProvider>
      </AuthProvider>
    </ToastProvider>
  </BrowserRouter>
);

export default App;
