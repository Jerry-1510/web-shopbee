import { useEffect, useState } from "react";
import { NavLink, Outlet, Navigate, useLocation } from "react-router-dom";
import {
  Home,
  Package,
  BarChart2,
  MessageSquare,
  MessageCircle,
  Store,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const AdminLayout = () => {
  const NAVBAR_OFFSET = "3.5rem";
  const { isSeller, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  if (!isSeller) {
    return <Navigate to="/" replace />;
  }

  const shopTitle = user?.shopName || user?.name || "Kênh Người Bán";
  const shopAvatar = user?.shopAvatar || user?.avatar || "";
  const navItems = [
    { to: "/admin/dashboard", label: "Dashboard", icon: BarChart2 },
    { to: "/admin/products", label: "Sản phẩm", icon: Package },
    { to: "/admin/shop-profile", label: "Thông tin shop", icon: Store },
    { to: "/admin/reviews", label: "Đánh giá", icon: MessageSquare },
    { to: "/admin/chat", label: "Chat khách hàng", icon: MessageCircle },
  ];

  const navClassName = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-3 p-3 rounded-2xl transition-all font-bold ${
      isActive
        ? "bg-shopbee-blue/10 text-shopbee-blue shadow-sm"
        : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
    }`;

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 relative">
      <button
        type="button"
        onClick={() => setMobileMenuOpen(true)}
        className="md:hidden fixed left-4 z-40 p-2 rounded-xl bg-white/90 dark:bg-slate-900/90 shadow-md border border-gray-100 dark:border-slate-800"
        style={{ top: `calc(${NAVBAR_OFFSET} + 0.75rem)` }}
      >
        <Menu size={18} />
      </button>

      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-black/35"
          style={{ top: NAVBAR_OFFSET }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`w-[86vw] max-w-[320px] md:w-64 bg-white dark:bg-slate-900 shadow-md p-4 flex flex-col fixed left-0 z-50 transition-transform md:sticky md:translate-x-0 md:self-start md:shrink-0 overflow-y-auto ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          top: NAVBAR_OFFSET,
          height: `calc(100vh - ${NAVBAR_OFFSET})`,
        }}
      >
        <div className="md:hidden flex justify-end mb-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-9 h-9 rounded-2xl bg-shopbee-blue/10 flex items-center justify-center overflow-hidden">
            {shopAvatar ? (
              <img
                src={shopAvatar}
                alt={shopTitle}
                className="w-full h-full object-cover"
              />
            ) : (
              <Store size={20} className="text-shopbee-blue" />
            )}
          </div>
          <div>
            <h1 className="text-base font-black uppercase tracking-tight text-shopbee-blue">
              {shopTitle}
            </h1>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Kênh Người Bán
            </p>
          </div>
        </div>
        <nav className="flex flex-col space-y-2 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={navClassName}
              onClick={() => setMobileMenuOpen(false)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
          <NavLink
            to="/"
            className="flex items-center space-x-3 p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 font-bold transition-all"
          >
            <Home size={20} />
            <span>Về trang chủ</span>
          </NavLink>
        </div>
      </aside>
      <main className="flex-1 p-3 pt-16 md:pt-8 md:p-8 lg:p-10 min-w-0">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;



