// FILE: src/App.tsx
import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { StoreProvider, useStore } from './context/StoreContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { AdminDataProvider } from './hooks/useAdminData';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';

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
import { PageLoader } from './components/ui';

// The dashboard is loaded on demand — shoppers never download it.
const AdminLogin = React.lazy(() => import('./pages/admin/AdminLogin'));
const AdminLayout = React.lazy(() => import('./pages/admin/AdminLayout'));
const Dashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts = React.lazy(() => import('./pages/admin/AdminProducts'));
const AdminCategories = React.lazy(() => import('./pages/admin/AdminCategories'));
const AdminInventory = React.lazy(() => import('./pages/admin/AdminInventory'));
const AdminOrders = React.lazy(() => import('./pages/admin/AdminOrders'));
const AdminCustomers = React.lazy(() => import('./pages/admin/AdminCustomers'));
const AdminCoupons = React.lazy(() => import('./pages/admin/AdminCoupons'));
const AdminMessages = React.lazy(() => import('./pages/admin/AdminMessages'));
const AdminHomeBuilder = React.lazy(() => import('./pages/admin/AdminHomeBuilder'));
const AdminSettings = React.lazy(() => import('./pages/admin/AdminSettings'));
const AdminTeam = React.lazy(() => import('./pages/admin/AdminTeam'));

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
};

/** Storefront chrome: navigation, cart drawer and footer around every shop page. */
const StoreLayout: React.FC = () => {
  const { settings } = useStore();

  if (settings.maintenance.enabled) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display text-4xl font-bold sm:text-5xl">{settings.maintenance.title}</h1>
        <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-500">{settings.maintenance.message}</p>
        {settings.contact.phone && (
          <p className="mt-8 text-sm text-ink-600">
            Need something urgently? Call{' '}
            <a href={`tel:${settings.contact.phone}`} className="font-semibold text-accent">
              {settings.contact.phone}
            </a>
          </p>
        )}
        <a href="/admin" className="mt-12 text-[11px] font-bold uppercase tracking-[0.2em] text-ink-400 hover:text-accent">
          Administrator sign-in
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
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
          <CartProvider>
            <ScrollToTop />
            <React.Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Storefront */}
              <Route element={<StoreLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:slug" element={<ProductDetail />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order/:id" element={<OrderSuccess />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
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
                <Route path="/admin/categories" element={<AdminCategories />} />
                <Route path="/admin/inventory" element={<AdminInventory />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/customers" element={<AdminCustomers />} />
                <Route path="/admin/coupons" element={<AdminCoupons />} />
                <Route path="/admin/messages" element={<AdminMessages />} />
                <Route path="/admin/home-builder" element={<AdminHomeBuilder />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/admin/team" element={<AdminTeam />} />
              </Route>

              <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />
            </Routes>
            </React.Suspense>
          </CartProvider>
        </StoreProvider>
      </AuthProvider>
    </ToastProvider>
  </BrowserRouter>
);

export default App;
