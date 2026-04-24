import { useEffect, useState, useCallback, useRef } from "react";
import { productApi } from "../../utils/api";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Bot,
  TrendingUp,
  MessageSquare,
  PlusCircle,
  List,
  History,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { io } from "socket.io-client";
import { AdminDashboardSkeleton } from "../../components/GlassLoader";

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProductsSold: 0,
    productsSold: [] as { _id: string; totalQuantity: number }[],
    lowStockProducts: [] as { _id: string; name: string; stock: number }[],
    aiReplyTotal: 0,
    aiReplyToday: 0,
    aiReplyLast7Days: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const hasLoadedRef = useRef(false);
  const inFlightRef = useRef(false);
  const userId = user?.id || user?._id || "";

  const fetchStats = useCallback(
    async (showSkeleton = false) => {
      if (!token) return;
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      if (showSkeleton && !hasLoadedRef.current) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      try {
        const res = await productApi.getDashboardStats(token);
        setStats((prev) => ({
          ...prev,
          ...res.data,
          totalSales: Number(res.data.totalSales || 0),
          totalOrders: Number(res.data.totalOrders || 0),
          totalProductsSold: res.data.totalProductsSold ?? 0,
          aiReplyTotal: Number(res.data.aiReplyTotal || 0),
          aiReplyToday: Number(res.data.aiReplyToday || 0),
          aiReplyLast7Days: Number(res.data.aiReplyLast7Days || 0),
          productsSold: Array.isArray(res.data.productsSold)
            ? res.data.productsSold
            : [],
          lowStockProducts: Array.isArray(res.data.lowStockProducts)
            ? res.data.lowStockProducts
            : [],
        }));
        setErrorMessage("");
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
        setErrorMessage("Không thể tải dữ liệu Dashboard. Vui lòng thử lại.");
      } finally {
        hasLoadedRef.current = true;
        inFlightRef.current = false;
        setRefreshing(false);
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (!token) return;
    fetchStats(true);

    if (!userId) return;

    const socket = io("http://localhost:5000");
    socket.emit("chat:join", { userId });

    socket.on("dashboard:update", () => fetchStats());

    return () => {
      socket.disconnect();
    };
  }, [fetchStats, token, userId]);

  const topQuantity = stats.productsSold[0]?.totalQuantity || 1;

  if (loading) {
    return <AdminDashboardSkeleton />;
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-6 md:pb-10">
      <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Tổng quan về tình hình kinh doanh của shop
          </p>
          {refreshing && (
            <p className="text-xs text-shopbee-blue mt-1">
              Đang cập nhật dữ liệu...
            </p>
          )}
          {errorMessage && (
            <p className="text-xs text-red-500 mt-1">{errorMessage}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/products/new"
            className="w-full md:w-auto justify-center flex items-center gap-2 px-4 md:px-5 py-2.5 bg-shopbee-blue text-white rounded-xl font-bold hover:bg-shopbee-blue/90 transition-all shadow-lg shadow-shopbee-blue/30 active:scale-95 border border-white/10"
          >
            <PlusCircle size={20} />
            Thêm sản phẩm
          </Link>
        </div>
      </div>

      {/* Business Overview */}
      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-shopbee-blue" />
          Tổng quan kinh doanh
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="glass-card p-4 md:p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-shopbee-blue/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-center space-x-4">
              <div className="bg-shopbee-blue/10 p-4 rounded-2xl">
                <DollarSign className="text-shopbee-blue" size={28} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Tổng doanh thu
                </p>
                <p className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">
                  {stats.totalSales.toLocaleString()} ₫
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 md:p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-center space-x-4">
              <div className="bg-amber-500/10 p-4 rounded-2xl">
                <ShoppingCart className="text-amber-500" size={28} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Tổng đơn hàng
                </p>
                <p className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">
                  {stats.totalOrders}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 md:p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
            <div className="flex items-center space-x-4">
              <div className="bg-purple-500/10 p-4 rounded-2xl">
                <Package className="text-purple-500" size={28} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Sản phẩm đã bán
                </p>
                <p className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">
                  {stats.totalProductsSold}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Performance & Automation */}
      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Bot size={20} className="text-emerald-500" />
          Hiệu suất AI & Tự động hóa
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="glass-card p-4 md:p-6 rounded-3xl bg-gradient-to-br from-white to-emerald-50/30 dark:from-gray-800 dark:to-emerald-900/10">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-emerald-500/10 p-3 rounded-xl">
                <Bot className="text-emerald-500" size={24} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                Hôm nay
              </span>
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Số câu trả lời
            </p>
            <p className="text-xl md:text-2xl font-black">
              {stats.aiReplyToday}
            </p>
          </div>

          <div className="glass-card p-4 md:p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-emerald-500/10 p-3 rounded-xl">
                <History className="text-emerald-500" size={24} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                7 ngày qua
              </span>
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Số câu trả lời
            </p>
            <p className="text-xl md:text-2xl font-black">
              {stats.aiReplyLast7Days}
            </p>
          </div>

          <div className="glass-card p-4 md:p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-emerald-500/10 p-3 rounded-xl">
                <MessageSquare className="text-emerald-500" size={24} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                Tất cả
              </span>
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Tổng phản hồi AI
            </p>
            <p className="text-xl md:text-2xl font-black">
              {stats.aiReplyTotal}
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Top Selling Products */}
        <div className="lg:col-span-2 glass-card rounded-3xl overflow-hidden flex flex-col">
          <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center gap-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp size={20} className="text-shopbee-blue" />
              Sản phẩm bán chạy nhất
            </h2>
            <Link
              to="/admin/products"
              className="text-shopbee-blue text-sm font-bold flex items-center gap-1 hover:underline"
            >
              Tất cả <ArrowRight size={14} />
            </Link>
          </div>
          <div className="p-0">
            {stats.productsSold.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {stats.productsSold.map((product, index) => (
                  <div
                    key={product._id}
                    className="flex items-center justify-between p-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 md:gap-4 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold text-sm text-gray-500">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white line-clamp-1">
                          {product._id}
                        </p>
                        <p className="text-xs text-gray-500">
                          Mã sản phẩm: {product._id.substring(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-shopbee-blue">
                        {product.totalQuantity}{" "}
                        <span className="text-[10px] font-normal text-gray-500">
                          đã bán
                        </span>
                      </p>
                      <div className="w-20 md:w-24 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-shopbee-blue rounded-full"
                          style={{
                            width: `${Math.min((product.totalQuantity / topQuantity) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center text-gray-500">
                Chưa có dữ liệu bán hàng.
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="glass-card rounded-3xl overflow-hidden flex flex-col">
          <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <AlertCircle size={20} className="text-amber-500" />
              Sắp hết hàng
            </h2>
          </div>
          <div className="p-4 md:p-6 flex-1">
            {stats.lowStockProducts.length > 0 ? (
              <div className="space-y-4">
                {stats.lowStockProducts.map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100/50 dark:border-amber-800/30"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-amber-600 font-medium">
                        Còn lại: {product.stock}
                      </p>
                    </div>
                    <Link
                      to={`/admin/products/edit/${product._id}`}
                      className="shrink-0 p-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm text-amber-600 hover:text-amber-700 transition-colors"
                    >
                      <PlusCircle size={18} />
                    </Link>
                  </div>
                ))}
                <Link
                  to="/admin/products"
                  className="block text-center text-xs font-bold text-gray-500 hover:text-shopbee-blue transition-colors pt-2"
                >
                  Xem tất cả kho hàng
                </Link>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500 mb-3">
                  <Package size={24} />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Kho hàng ổn định
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Tất cả sản phẩm đều còn đủ số lượng.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="glass-card p-4 md:p-6 rounded-3xl">
            <h2 className="text-lg font-bold mb-4">Lối tắt quản lý</h2>
            <div className="grid grid-cols-1 gap-3">
              <Link
                to="/admin/products"
                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-shopbee-blue/5 transition-colors group"
              >
                <div className="bg-shopbee-blue/10 p-2 rounded-xl text-shopbee-blue group-hover:scale-110 transition-transform">
                  <List size={20} />
                </div>
                <span className="font-semibold text-sm">
                  Danh sách sản phẩm
                </span>
              </Link>
              <Link
                to="/admin/chat"
                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-emerald-500/5 transition-colors group"
              >
                <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-500 group-hover:scale-110 transition-transform">
                  <MessageSquare size={20} />
                </div>
                <span className="font-semibold text-sm">Hỗ trợ khách hàng</span>
              </Link>
              <Link
                to="/admin/reviews"
                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-amber-500/5 transition-colors group"
              >
                <div className="bg-amber-500/10 p-2 rounded-xl text-amber-500 group-hover:scale-110 transition-transform">
                  <TrendingUp size={20} />
                </div>
                <span className="font-semibold text-sm">Quản lý đánh giá</span>
              </Link>
            </div>
          </div>

          {/* AI Helper Info */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 md:p-6 rounded-3xl text-white shadow-lg shadow-emerald-500/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <Bot size={24} />
              </div>
              <h3 className="font-bold">Trợ lý AI ShopBee</h3>
            </div>
            <p className="text-emerald-50 text-xs leading-relaxed">
              AI đang giúp bạn trả lời <strong>{stats.aiReplyToday}</strong> câu
              hỏi trong ngày hôm nay, tiết kiệm khoảng{" "}
              <strong>{Math.round(stats.aiReplyToday * 2.5)}</strong> phút phản
              hồi thủ công.
            </p>
            <div className="mt-4 pt-4 border-t border-white/10">
              <Link
                to="/admin/chat"
                className="text-xs font-bold flex items-center gap-1 hover:underline"
              >
                Xem chi tiết các cuộc hội thoại <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;



