import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigationType,
  Navigate,
} from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import type { ReactNode } from "react";
import { CartProvider } from "./context/CartContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import { AnimatePresence } from "framer-motion";
import AnimatedPage from "./components/AnimatedPage";
import { prefetchLikelyRoutes } from "./utils/routePrefetch";
import { GlassListSkeleton } from "./components/GlassLoader";

const Home = lazy(() => import("./pages/Home"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const ShopHome = lazy(() => import("./pages/ShopHome"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const NotificationsPage = lazy(() => import("./pages/Notifications"));
const AccountPage = lazy(() => import("./pages/Account"));
const AddressesPage = lazy(() => import("./pages/Addresses"));
const OrdersPage = lazy(() => import("./pages/Orders"));
const VouchersPage = lazy(() => import("./pages/Vouchers"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProductList = lazy(() => import("./pages/admin/AdminProductList"));
const AdminProductForm = lazy(() => import("./pages/admin/AdminProductForm"));
const AdminReviewList = lazy(() => import("./pages/admin/AdminReviewList"));
const AdminChat = lazy(() => import("./pages/admin/AdminChat"));
const AdminShopProfile = lazy(() => import("./pages/admin/AdminShopProfile"));
const Chatbot = lazy(() => import("./components/Chatbot"));
const AccountLayout = lazy(() => import("./components/AccountLayout"));

function App() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const isAdminRoute = location.pathname.startsWith("/admin");

  useEffect(() => {
    prefetchLikelyRoutes(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    return () => {
      sessionStorage.setItem(
        `scroll-position:${location.key}`,
        String(window.scrollY),
      );
    };
  }, [location.key]);

  useEffect(() => {
    if (navigationType === "POP") {
      const savedPosition = Number(
        sessionStorage.getItem(`scroll-position:${location.key}`) ?? "0",
      );
      window.scrollTo({
        top: Number.isFinite(savedPosition) ? savedPosition : 0,
        left: 0,
        behavior: "auto",
      });
      return;
    }
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [location.key, navigationType]);

  const pageFallback = (
    <div className="site-container py-8 min-h-[50vh]">
      <GlassListSkeleton rows={8} variant="full" className="w-full" />
    </div>
  );

  const renderPage = (node: ReactNode) => (
    <Suspense fallback={pageFallback}>
      <AnimatedPage>{node}</AnimatedPage>
    </Suspense>
  );

  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <Layout>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={renderPage(<Home />)} />
                <Route
                  path="/product/:id"
                  element={renderPage(<ProductDetail />)}
                />
                <Route path="/cart" element={renderPage(<Cart />)} />
                <Route path="/checkout" element={renderPage(<Checkout />)} />
                <Route path="/shop" element={renderPage(<ShopHome />)} />
                <Route path="/login" element={renderPage(<Login />)} />
                <Route path="/register" element={renderPage(<Register />)} />
                <Route
                  path="/notifications"
                  element={renderPage(<NotificationsPage />)}
                />

                <Route
                  element={
                    <Suspense fallback={pageFallback}>
                      <AccountLayout />
                    </Suspense>
                  }
                >
                  <Route
                    path="/account"
                    element={renderPage(<AccountPage />)}
                  />
                  <Route
                    path="/addresses"
                    element={renderPage(<AddressesPage />)}
                  />
                  <Route path="/orders" element={renderPage(<OrdersPage />)} />
                  <Route
                    path="/vouchers"
                    element={renderPage(<VouchersPage />)}
                  />
                </Route>

                <Route
                  path="/admin"
                  element={
                    <Suspense fallback={pageFallback}>
                      <AdminLayout />
                    </Suspense>
                  }
                >
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route
                    path="dashboard"
                    element={renderPage(<AdminDashboard />)}
                  />
                  <Route
                    path="products"
                    element={renderPage(<AdminProductList />)}
                  />
                  <Route
                    path="products/new"
                    element={renderPage(<AdminProductForm />)}
                  />
                  <Route
                    path="products/edit/:id"
                    element={renderPage(<AdminProductForm />)}
                  />
                  <Route
                    path="shop-profile"
                    element={renderPage(<AdminShopProfile />)}
                  />
                  <Route
                    path="reviews"
                    element={renderPage(<AdminReviewList />)}
                  />
                  <Route path="chat" element={renderPage(<AdminChat />)} />
                </Route>

                <Route path="*" element={renderPage(<Home />)} />
              </Routes>
            </AnimatePresence>
            {!isAdminRoute && (
              <Suspense fallback={null}>
                <Chatbot />
              </Suspense>
            )}
          </Layout>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const Root = () => (
  <Router>
    <App />
  </Router>
);

export default Root;



