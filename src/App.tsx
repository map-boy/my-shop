// FILE: src/App.tsx
import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import { StoreProvider, useStore } from './context/StoreContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './lib/i18n';
import { AdminDataProvider } from './hooks/useAdminData';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import ErrorBoundary from './components/ErrorBoundary';

import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Categories from './pages/Categories';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import About from './pages/About';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import Legal from './pages/Legal';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import { PageLoader } from './components/ui';
import SectionsBar from './components/SectionsBar';
import SectionShelves from './components/SectionShelves';
import SectionPage from './pages/SectionPage';
import SellerShop from './pages/SellerShop';
import Tracker from './components/Tracker';
import PushPrompt from './components/PushPrompt';
import { L10n } from './lib/i18n';

// The dashboard is loaded on demand - shoppers never download it.
const AdminLogin = React.lazy(() => import('./pages/admin/AdminLogin'));
const AdminLayout = React.lazy(() => import('./pages/admin/AdminLayout'));
const Dashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts = React.lazy(() => import('./pages/admin/AdminProducts'));
const AdminCategories = React.lazy(() => import('./pages/admin/AdminCategories'));
const AdminSections = React.lazy(() => import('./pages/admin/AdminSections'));
const AdminInventory = React.lazy(() => import('./pages/admin/AdminInventory'));
const AdminOrders = React.lazy(() => import('./pages/admin/AdminOrders'));
const AdminCustomers = React.lazy(() => import('./pages/admin/AdminCustomers'));
const AdminCoupons = React.lazy(() => import('./pages/admin/AdminCoupons'));
const AdminMessages = React.lazy(() => import('./pages/admin/AdminMessages'));
const AdminHomeBuilder = React.lazy(() => import('./pages/admin/AdminHomeBuilder'));
const AdminSettings = React.lazy(() => import('./pages/admin/AdminSettings'));
const AdminTeam = React.lazy(() => import('./pages/admin/AdminTeam'));
const ShopProfile = React.lazy(() => import('./pages/admin/ShopProfile'));
const AdminTraffic = React.lazy(() => import('./pages/admin/AdminTraffic'));
const AdminNotify = React.lazy(() => import('./pages/admin/AdminNotify'));
const AdminBlog = React.lazy(() => import('./pages/admin/AdminBlog'));

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
            <Tracker />
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
