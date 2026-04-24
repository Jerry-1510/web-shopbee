import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Search,
  ShoppingCart,
  Bell,
  HelpCircle,
  Globe,
  Sun,
  Moon,
  User,
  LogOut,
  ShieldCheck,
  Menu,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { productApi } from "../utils/api";
import type { Notification } from "../types";
import { io } from "socket.io-client";
import { prefetchRouteByPath } from "../utils/routePrefetch";

const Navbar = () => {
  const logo = "/logo.png";
  const { cartCount } = useCart();
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isAdmin, isSeller, token, login } = useAuth();
  const [searchValue, setSearchValue] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasLoadedNotifications, setHasLoadedNotifications] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const currentPathRef = useRef(location.pathname);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  type ApiError = { response?: { data?: { message?: string } } };

  const handleBecomeSeller = async () => {
    if (!token) return;
    try {
      const res = await productApi.becomeSeller(token);
      login(res.data.user, res.data.token);
      alert("Chúc mừng! Bạn đã trở thành người bán hàng.");
      navigate("/admin/dashboard");
    } catch (error) {
      const apiError = error as ApiError;
      alert(apiError.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const fetchNotifications = useCallback(async () => {
    if (!user || !token) return [] as Notification[];
    try {
      const res = await productApi.getNotifications(token);
      const list = (res.data || []) as Notification[];
      setNotifications(list);
      return list;
    } catch (error) {
      console.error("Lỗi khi tải thông báo:", error);
      return [] as Notification[];
    }
  }, [user, token]);

  useEffect(() => {
    currentPathRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    if (user && token) {
      const socket = io("http://localhost:5000");
      socket.emit("chat:join", { userId: user.id });
      socket.on("notification:new", (newNotification: Notification) => {
        if (
          newNotification.type === "chat" &&
          currentPathRef.current === "/admin/chat"
        ) {
          return;
        }
        setNotifications((prev) => [newNotification, ...prev]);
        setHasLoadedNotifications(true);
      });
      return () => {
        socket.disconnect();
      };
    }
  }, [user, token]);

  const markAllNotificationsAsRead = async (list?: Notification[]) => {
    if (!token) return;
    const source = list ?? notifications;
    const unread = source.filter((n) => !n.isRead);
    if (unread.length === 0) return;
    try {
      await Promise.all(
        unread.map((n) => productApi.markNotificationAsRead(n._id, token)),
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Lỗi khi đánh dấu tất cả thông báo đã đọc:", error);
    }
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  const handleNotificationClick = async (n: Notification) => {
    if (!token) return;
    if (!n.isRead) {
      try {
        await productApi.markNotificationAsRead(n._id, token);
        setNotifications((prev) =>
          prev.map((item) =>
            item._id === n._id ? { ...item, isRead: true } : item,
          ),
        );
      } catch (error) {
        console.error("Lỗi khi đánh dấu đã đọc:", error);
      }
    }
    setShowNotifications(false);
    navigate("/notifications", { state: { highlightId: n._id } });
  };

  // DB health indicator removed per requirement

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchValue.trim()) {
      navigate(`/?search=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-white/20 dark:border-slate-800/60">
      <div className="site-container">
        {/* Top Navbar */}
        <div className="relative flex justify-between items-center py-2 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
          <div className="hidden md:flex space-x-4">
            {isSeller ? (
              <Link
                to="/admin/dashboard"
                className="hover:text-shopbee-blue transition-colors"
                onMouseEnter={() => prefetchRouteByPath("/admin/dashboard")}
              >
                Kênh Người Bán
              </Link>
            ) : user ? (
              <button
                onClick={handleBecomeSeller}
                className="hover:text-shopbee-blue transition-colors cursor-pointer"
              >
                Trở thành Người Bán
              </button>
            ) : (
              <Link
                to="/login"
                className="hover:text-shopbee-blue transition-colors"
                onMouseEnter={() => prefetchRouteByPath("/login")}
              >
                Kênh Người Bán
              </Link>
            )}
            <button
              type="button"
              className="hover:text-shopbee-blue transition-colors"
            >
              Tải ứng dụng
            </button>
            <div className="flex items-center space-x-1">
              <span>Kết nối</span>
            </div>
          </div>
          <div className="flex space-x-4 items-center">
            <button
              className="md:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Mở menu"
              onClick={() => setMobileMenuOpen((v) => !v)}
            >
              <Menu size={16} />
            </button>

            <button
              onClick={toggleTheme}
              className="hidden md:inline-flex hover:text-shopbee-blue transition-colors"
            >
              {theme === "light" ? <Moon size={13} /> : <Sun size={13} />}
            </button>

            <div className="relative hidden md:block">
              <button
                onClick={() => {
                  setShowNotifications(false);
                  navigate("/notifications");
                }}
                onMouseEnter={async () => {
                  setShowNotifications(true);
                  const list = hasLoadedNotifications
                    ? notifications
                    : await fetchNotifications();
                  if (!hasLoadedNotifications) {
                    setHasLoadedNotifications(true);
                  }
                  await markAllNotificationsAsRead(list);
                }}
                className="flex items-center space-x-1 hover:text-shopbee-blue transition-colors relative py-1"
              >
                <Bell size={13} />
                <span>Thông báo</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center border border-white dark:border-gray-900">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div
                  onMouseLeave={() => setShowNotifications(false)}
                  className="absolute top-full right-0 mt-1 w-80 glass-card rounded-2xl py-2 z-[100] border border-white/40 shadow-xl animate-in fade-in slide-in-from-top-2"
                >
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <span className="font-bold text-sm">
                      Thông báo mới nhận
                    </span>
                    <button
                      className="text-[10px] text-shopbee-blue hover:underline"
                      onClick={() => {
                        setShowNotifications(false);
                        navigate("/notifications");
                      }}
                    >
                      Xem tất cả
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          className={`px-4 py-3 hover:bg-shopbee-blue/5 transition-colors cursor-pointer border-b border-gray-50 dark:border-gray-800/50 last:border-0 ${
                            !n.isRead ? "bg-shopbee-blue/[0.02]" : ""
                          }`}
                          onClick={() => handleNotificationClick(n)}
                        >
                          <p className="text-xs font-bold mb-0.5">{n.title}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2">
                            {n.message}
                          </p>
                          <p className="text-[9px] text-gray-400 mt-1 uppercase">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-10 text-center flex flex-col items-center">
                        <Bell
                          size={32}
                          className="text-gray-200 dark:text-gray-700 mb-2"
                        />
                        <p className="text-xs text-gray-400">
                          Chưa có thông báo nào
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              className="hidden md:flex items-center space-x-1 hover:text-shopbee-blue transition-colors"
            >
              <HelpCircle size={13} />
              <span>Hỗ trợ</span>
            </button>
            <div className="hidden md:flex items-center space-x-1 cursor-pointer hover:text-shopbee-blue transition-colors">
              <Globe size={13} />
              <span>Tiếng Việt</span>
            </div>
            {/* Mobile Logo - centered */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 md:hidden">
              <Link to="/" aria-label="Trang chủ">
                <img
                  src={logo}
                  alt="ShopBee"
                  className="h-[72px] w-[72px] object-contain"
                />
              </Link>
            </div>
            {/* Mobile language - right aligned (balanced with menu) */}
            <button
              aria-label="Ngôn ngữ"
              className="absolute right-2 top-1/2 -translate-y-1/2 md:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Globe size={16} />
            </button>

            {user ? (
              <div className="relative hidden md:block">
                <button
                  onMouseEnter={() => setShowUserMenu(true)}
                  className="flex items-center space-x-2 hover:text-shopbee-blue transition-colors py-1"
                >
                  <div className="w-6 h-6 rounded-full bg-shopbee-blue/10 flex items-center justify-center overflow-hidden">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={12} className="text-shopbee-blue" />
                    )}
                  </div>
                  <span className="font-bold max-w-[140px] truncate">
                    {user.name}
                  </span>
                </button>

                {showUserMenu && (
                  <div
                    onMouseLeave={() => setShowUserMenu(false)}
                    className="absolute top-full right-0 mt-1 w-52 glass-card rounded-2xl py-2 z-[100] border border-white/40 shadow-xl animate-in fade-in slide-in-from-top-2"
                  >
                    <Link
                      to="/account"
                      className="block px-4 py-2 text-sm hover:bg-shopbee-blue/5 text-gray-800 dark:text-slate-100 transition-colors"
                      onMouseEnter={() => prefetchRouteByPath("/account")}
                    >
                      Tài khoản của tôi
                    </Link>
                    <Link
                      to="/orders"
                      className="block px-4 py-2 text-sm hover:bg-shopbee-blue/5 text-gray-800 dark:text-slate-100 transition-colors"
                      onMouseEnter={() => prefetchRouteByPath("/orders")}
                    >
                      Đơn mua
                    </Link>
                    <Link
                      to="/vouchers"
                      className="block px-4 py-2 text-sm hover:bg-shopbee-blue/5 text-gray-800 dark:text-slate-100 transition-colors"
                      onMouseEnter={() => prefetchRouteByPath("/vouchers")}
                    >
                      Kho voucher
                    </Link>
                    {isAdmin && (
                      <>
                        <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                        <Link
                          to="/admin/dashboard"
                          className="flex items-center space-x-3 px-4 py-2 hover:bg-shopbee-blue/5 text-shopbee-blue font-bold transition-colors text-sm"
                          onMouseEnter={() =>
                            prefetchRouteByPath("/admin/dashboard")
                          }
                        >
                          <ShieldCheck size={16} />
                          <span>Kênh Người Bán</span>
                        </Link>
                      </>
                    )}
                    <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                    <button
                      onClick={() => {
                        logout();
                        navigate("/");
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-red-50 text-red-500 transition-colors text-sm"
                    >
                      <LogOut size={16} />
                      <span>Đăng Xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex space-x-3">
                <Link to="/register" className="hover:text-shopbee-blue">
                  Đăng Ký
                </Link>
                <div className="border-r border-gray-300 dark:border-gray-600 h-3 my-auto"></div>
                <Link
                  to="/login"
                  className="hover:text-shopbee-blue font-bold"
                  onMouseEnter={() => prefetchRouteByPath("/login")}
                >
                  Đăng Nhập
                </Link>
              </div>
            )}
          </div>
        </div>

        {!isAdminRoute && (
          <div className="flex flex-col md:flex-row items-stretch md:items-center py-2 md:py-3 gap-2 md:gap-8">
            <Link to="/" className="hidden md:flex items-center shrink-0">
              <img
                src={logo}
                alt="ShopBee"
                className="h-[72px] w-[72px] object-contain"
              />
            </Link>

            {!(
              location.pathname === "/login" ||
              location.pathname === "/register"
            ) && (
              <div className="w-full md:flex-1 order-1 md:order-2">
                <div className="flex items-center gap-3">
                  <form
                    onSubmit={handleSearch}
                    className="flex-1 rounded-2xl flex p-1.5 bg-white/95 dark:bg-slate-800/70 border border-gray-200 dark:border-slate-700 shadow-sm focus-within:ring-2 focus-within:ring-shopbee-blue/30"
                  >
                    <input
                      type="text"
                      placeholder="Tìm kiếm sản phẩm..."
                      className="flex-1 px-4 py-2 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 bg-transparent outline-none text-sm"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="liquid-btn text-white p-2 rounded-xl"
                    >
                      <Search size={18} />
                    </button>
                  </form>

                  <Link
                    to="/cart"
                    className="hidden md:inline-flex relative p-2.5 bg-gray-100 dark:bg-gray-800/50 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group"
                    onMouseEnter={() => prefetchRouteByPath("/cart")}
                  >
                    <ShoppingCart
                      size={22}
                      className="text-gray-700 dark:text-gray-300 group-hover:text-shopbee-blue transition-colors"
                    />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 glass glass-capsule glass-tint-blue text-slate-900 dark:text-slate-100 text-[9px] px-1.5 py-0.5 font-bold ring-2 ring-white dark:ring-slate-900">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 glass-card rounded-2xl p-3 border border-white/40">
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              <Link
                to={isAdmin ? "/admin/dashboard" : "/login"}
                className="p-2 rounded-xl hover:bg-shopbee-blue/5 text-gray-700 dark:text-gray-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Kênh Người Bán
              </Link>
              <button
                type="button"
                className="p-2 rounded-xl hover:bg-shopbee-blue/5 text-gray-700 dark:text-gray-200 text-left"
                onClick={() => setMobileMenuOpen(false)}
              >
                Tải ứng dụng
              </button>
              <button
                className="p-2 rounded-xl hover:bg-shopbee-blue/5 text-left text-gray-700 dark:text-gray-200"
                onClick={() => {
                  setMobileMenuOpen(false);
                  toggleTheme();
                }}
              >
                Chuyển giao diện
              </button>
              <button
                type="button"
                className="p-2 rounded-xl hover:bg-shopbee-blue/5 text-gray-700 dark:text-gray-200 text-left"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/notifications");
                }}
              >
                Thông báo
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;


