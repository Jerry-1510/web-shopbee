import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { productApi } from "../utils/api";
import { ShoppingCart, MapPin } from "lucide-react";
import AnimatedPage from "../components/AnimatedPage";
import {
  GlassListSkeleton,
  GlassProgressLoader,
} from "../components/GlassLoader";

interface OrderItem {
  name: string;
  quantity: number;
  image: string;
  price: number;
  product: string;
}

interface Order {
  _id: string;
  orderItems: OrderItem[];
  shippingAddress?: {
    fullName: string;
    phoneNumber: string;
    addressLine: string;
  };
  totalPrice: number;
  isPaid: boolean;
  isCancelled?: boolean;
  createdAt: string;
}

const OrdersPage = () => {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await productApi.getMyOrders(token);
        setOrders(res.data);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token]);

  if (!user || !token) {
    return (
      <AnimatedPage>
        <div className="site-container py-10 min-h-[60vh]">
          <div className="glass-card rounded-3xl p-8 text-center">
            <ShoppingCart size={28} className="mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600 mb-4">
              Vui lòng đăng nhập để xem đơn mua của bạn
            </p>
            <Link
              to="/login"
              className="liquid-btn text-white px-6 py-3 rounded-2xl font-bold"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="space-y-4">
        <div className="glass-card rounded-3xl p-6 mb-4">
          <h1 className="text-lg font-bold mb-1">Đơn mua</h1>
          <p className="text-sm text-gray-500">
            Xem lại các đơn hàng đã đặt trên ShopBee
          </p>
        </div>

        {loading ? (
          <div className="space-y-6">
            <GlassProgressLoader label="Đang tải đơn hàng..." variant="full" minHeight="min-h-[200px]" />
            <GlassListSkeleton rows={6} variant="full" minHeight="min-h-[600px]" />
          </div>
        ) : orders.length === 0 ? (
          <div className="glass-card rounded-3xl p-8 text-center">
            <p className="text-sm text-gray-500">
              Bạn chưa có đơn hàng nào. Hãy tiếp tục mua sắm nhé!
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order._id}
              className="glass-card rounded-3xl p-4 md:p-5 flex flex-col gap-3"
            >
              <div className="flex justify-between text-xs text-gray-500">
                <span>
                  Mã đơn:{" "}
                  <span className="font-mono text-gray-700">
                    {order._id.slice(-8).toUpperCase()}
                  </span>
                </span>
                <span>
                  Ngày đặt:{" "}
                  {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>

              {order.shippingAddress && (
                <div className="bg-gray-50 p-3 rounded-2xl flex gap-3 items-start text-sm">
                  <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-gray-700">
                      {order.shippingAddress.fullName} |{" "}
                      {order.shippingAddress.phoneNumber}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {order.shippingAddress.addressLine}
                    </p>
                  </div>
                </div>
              )}

              <div className="divide-y divide-gray-100">
                {order.orderItems.map((item) => (
                  <div
                    key={item.product + item.name}
                    className="py-3 flex items-center gap-3"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-14 rounded-2xl object-cover bg-gray-100"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium line-clamp-2">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Số lượng: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-shopbee-blue">
                        ₫{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  Trạng thái:{" "}
                  <span className="font-semibold text-gray-700">
                    {order.isCancelled
                      ? "Đã hủy"
                      : order.isPaid
                        ? "Đã thanh toán"
                        : "Chờ thanh toán"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold">
                    Tổng:{" "}
                    <span className="text-shopbee-blue">
                      ₫{order.totalPrice.toLocaleString()}
                    </span>
                  </span>
                  {!order.isPaid && !order.isCancelled && (
                    <button
                      onClick={async () => {
                        try {
                          await productApi.cancelOrder(order._id, token);
                          setOrders((prev) =>
                            prev.map((o) =>
                              o._id === order._id
                                ? { ...o, isCancelled: true }
                                : o,
                            ),
                          );
                        } catch {
                          alert("Không thể hủy đơn hàng. Vui lòng thử lại.");
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl border border-red-500 text-red-500 text-xs font-bold hover:bg-red-50 transition-colors"
                    >
                      Hủy đơn
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </AnimatedPage>
  );
};

export default OrdersPage;



