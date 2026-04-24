import { Link, useLocation } from "react-router-dom";
import { Bell, Home, User, ShoppingCart, MessageCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { motion } from "framer-motion";
import type { Transition } from "framer-motion";

const MobileBottomNav = () => {
  const location = useLocation();
  const { user: _user } = useAuth();
  const { cartCount } = useCart();
  const hiddenRoutes = ["/login", "/register"];
  if (hiddenRoutes.includes(location.pathname)) return null;

  const path = location.pathname;
  const isHome = path === "/";
  const isCart = path.startsWith("/cart");
  const isNotif = path.startsWith("/notifications");
  const isAccount = path.startsWith("/account");
  const liquidTransition: Transition = {
    type: "tween",
    duration: 0.28,
    ease: "easeOut",
  };

  return (
    <div className="md:hidden fixed bottom-4 left-0 right-0 z-50 px-4 safe-bottom pointer-events-none">
      <div className="pointer-events-auto">
        <div className="rounded-3xl bg-white/30 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/60 dark:border-slate-800/80 shadow-[0_10px_35px_rgba(15,23,42,0.35)] px-4 py-2 flex items-center gap-4">
          <Link
            to="/"
            className="flex-1 relative flex flex-col items-center text-[10px]"
          >
            <span className="relative inline-flex flex-col items-center gap-0.5 w-full py-1.5">
              {isHome && (
                <motion.span
                  layoutId="navActive"
                  className="absolute top-1 bottom-1 left-1/2 -translate-x-1/2 w-14 sm:w-18 rounded-full bg-white/35 dark:bg-slate-800/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/70 shadow-[0_0_14px_rgba(15,23,42,0.28)]"
                  transition={liquidTransition}
                />
              )}
              <span className="relative z-10 flex items-center justify-center w-5 h-5">
                <Home
                  size={18}
                  className={
                    isHome
                      ? "text-shopbee-blue"
                      : "text-slate-400/70 dark:text-slate-400/70"
                  }
                />
              </span>
              <span
                className={`relative z-10 text-[9px] sm:text-[10px] font-medium whitespace-nowrap ${
                  isHome
                    ? "text-shopbee-blue"
                    : "text-slate-400/80 dark:text-slate-400/80"
                }`}
              >
                Trang chủ
              </span>
            </span>
          </Link>

          <Link
            to="/cart"
            className="flex-1 relative flex flex-col items-center text-[11px]"
          >
            <span className="relative inline-flex flex-col items-center gap-0.5 w-full py-1.5">
              {isCart && (
                <motion.span
                  layoutId="navActive"
                  className="absolute top-1 bottom-1 left-1/2 -translate-x-1/2 w-14 sm:w-18 rounded-full bg-white/35 dark:bg-slate-800/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/70 shadow-[0_0_14px_rgba(15,23,42,0.28)]"
                  transition={liquidTransition}
                />
              )}
              <span className="relative z-10 flex items-center justify-center w-5 h-5">
                <ShoppingCart
                  size={18}
                  className={
                    isCart
                      ? "text-shopbee-blue"
                      : "text-slate-400/70 dark:text-slate-400/70"
                  }
                />
              </span>
              <span
                className={`relative z-10 text-[9px] sm:text-[10px] font-medium whitespace-nowrap ${
                  isCart
                    ? "text-shopbee-blue"
                    : "text-slate-400/80 dark:text-slate-400/80"
                }`}
              >
                Giỏ hàng
              </span>
            </span>
            {cartCount > 0 && (
              <span className="absolute -top-0.5 right-3 glass glass-capsule glass-tint-blue text-slate-900 dark:text-slate-100 text-[9px] px-1 py-[1px] font-bold">
                {cartCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("open-chatbot"))}
            className="flex-1 relative flex flex-col items-center text-[10px]"
          >
            <span className="relative inline-flex flex-col items-center gap-1 w-full pt-5 pb-1">
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 flex items-center justify-center">
                <span className="w-12 h-12 rounded-full bg-gradient-to-b from-[#7C3AED] to-[#A78BFA] shadow-[0_8px_22px_rgba(124,58,237,0.55)] flex items-center justify-center">
                  <MessageCircle size={20} className="text-white" />
                </span>
              </span>
              <span className="mt-4 relative z-10 text-[9px] sm:text-[10px] font-semibold text-gray-900 dark:text-slate-100">
                Chat
              </span>
            </span>
          </button>

          <Link
            to="/notifications"
            className="flex-1 relative flex flex-col items-center text-[10px]"
            aria-label="Thông báo"
          >
            <span className="relative inline-flex flex-col items-center gap-0.5 w-full py-1.5">
              {isNotif && (
                <motion.span
                  layoutId="navActive"
                  className="absolute top-1 bottom-1 left-1/2 -translate-x-1/2 w-14 sm:w-18 rounded-full bg-white/35 dark:bg-slate-800/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/70 shadow-[0_0_14px_rgba(15,23,42,0.28)]"
                  transition={liquidTransition}
                />
              )}
              <span className="relative z-10 flex items-center justify-center w-5 h-5">
                <Bell
                  size={18}
                  className={
                    isNotif
                      ? "text-shopbee-blue"
                      : "text-slate-400/70 dark:text-slate-400/70"
                  }
                />
              </span>
              <span
                className={`relative z-10 text-[9px] sm:text-[10px] font-medium whitespace-nowrap ${
                  isNotif
                    ? "text-shopbee-blue"
                    : "text-slate-400/80 dark:text-slate-400/80"
                }`}
              >
                Thông báo
              </span>
            </span>
          </Link>

          <Link
            to="/account"
            className="flex-1 relative flex flex-col items-center text-[10px]"
          >
            <span className="relative inline-flex flex-col items-center gap-0.5 w-full py-1.5">
              {isAccount && (
                <motion.span
                  layoutId="navActive"
                  className="absolute top-1 bottom-1 left-1/2 -translate-x-1/2 w-14 sm:w-18 rounded-full bg-white/35 dark:bg-slate-800/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/70 shadow-[0_0_14px_rgba(15,23,42,0.28)]"
                  transition={liquidTransition}
                />
              )}
              <span className="relative z-10 flex items-center justify-center w-5 h-5">
                <User
                  size={18}
                  className={
                    isAccount
                      ? "text-shopbee-blue"
                      : "text-slate-400/70 dark:text-slate-400/70"
                  }
                />
              </span>
              <span
                className={`relative z-10 text-[9px] sm:text-[10px] font-medium whitespace-nowrap ${
                  isAccount
                    ? "text-shopbee-blue"
                    : "text-slate-400/80 dark:text-slate-400/80"
                }`}
              >
                Tôi
              </span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MobileBottomNav;



