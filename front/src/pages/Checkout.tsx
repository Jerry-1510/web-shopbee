import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, Ticket, Trash2, X, MapPin } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { productApi } from "../utils/api";
import { GlassListSkeleton } from "../components/GlassLoader";

type CheckoutItem = {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  style?: string;
  color?: string;
  variantSummary?: string;
  selectedOptions?: Record<string, string>;
};

type CheckoutVoucher = {
  code: string;
  description?: string;
  discountType?: "percent";
  discountPercent?: number;
  maxDiscountAmount?: number;
  expiry?: string | null;
};

type Address = {
  _id: string;
  fullName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  isDefault?: boolean;
};

type CheckoutLocationState = {
  items?: CheckoutItem[];
  voucher?: CheckoutVoucher;
  fromCart?: boolean;
  fromCartItemIds?: string[];
};

const Checkout = () => {
  const { token } = useAuth();
  const { removeFromCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as CheckoutLocationState;

  const [items, setItems] = useState<CheckoutItem[]>(() => state.items || []);
  const [submitting, setSubmitting] = useState(false);

  // Addresses
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [myVouchers, setMyVouchers] = useState<CheckoutVoucher[]>([]);
  const [vouchersLoading, setVouchersLoading] = useState(false);
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [voucherApplyLoading, setVoucherApplyLoading] = useState(false);
  const [voucherApplyError, setVoucherApplyError] = useState<string | null>(
    null,
  );
  const [selectedVoucher, setSelectedVoucher] =
    useState<CheckoutVoucher | null>(state.voucher || null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const fetchAddresses = async () => {
      setAddressLoading(true);
      try {
        const res = await productApi.getAddresses(token);
        const data = Array.isArray(res.data) ? (res.data as Address[]) : [];
        if (!cancelled) {
          setAddresses(data);
          if (data.length > 0) {
            const def = data.find((a) => a.isDefault) || data[0];
            setSelectedAddress(def);
          }
        }
      } catch (err) {
        console.error("Failed to fetch addresses", err);
      } finally {
        if (!cancelled) setAddressLoading(false);
      }
    };
    fetchAddresses();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!voucherModalOpen) return;
    setVoucherApplyError(null);
    if (!token) {
      setMyVouchers([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setVouchersLoading(true);
      try {
        const res = await productApi.getMyVouchers(token);
        const data = Array.isArray(res.data)
          ? (res.data as CheckoutVoucher[])
          : [];
        if (!cancelled) setMyVouchers(data);
      } catch {
        if (!cancelled) setMyVouchers([]);
      } finally {
        if (!cancelled) setVouchersLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [token, voucherModalOpen]);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + Number(item.price) * Number(item.quantity),
        0,
      ),
    [items],
  );

  const discountAmount = useMemo(() => {
    if (!selectedVoucher) return 0;
    const percent = Number(selectedVoucher.discountPercent || 0);
    if (!percent) return 0;
    const raw = Math.round((subtotal * percent) / 100);
    const cap = Number(selectedVoucher.maxDiscountAmount || 0);
    return cap > 0 ? Math.min(raw, cap) : raw;
  }, [selectedVoucher, subtotal]);

  const finalTotal = useMemo(
    () => Math.max(subtotal - discountAmount, 0),
    [discountAmount, subtotal],
  );

  const updateQuantity = (id: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity } : i))
        .filter((i) => i.quantity > 0),
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handlePlaceOrder = async () => {
    if (!token || items.length === 0) return;
    if (!selectedAddress) {
      alert("Vui lòng thêm địa chỉ giao hàng.");
      return;
    }
    setSubmitting(true);
    try {
      await productApi.createOrder(
        {
          orderItems: items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            image: item.image,
            price: item.price,
            product: String(item.id),
          })),
          voucherCode: selectedVoucher?.code,
          shippingAddress: {
            fullName: selectedAddress.fullName,
            phoneNumber: selectedAddress.phone,
            addressLine: `${selectedAddress.street}, ${selectedAddress.ward}, ${selectedAddress.district}, ${selectedAddress.province}`,
            isDefault: selectedAddress.isDefault,
          },
        },
        token,
      );

      if (state.fromCart && Array.isArray(state.fromCartItemIds)) {
        state.fromCartItemIds.forEach((id) => removeFromCart(id));
      }

      alert("Đặt hàng thành công!");
      navigate("/orders");
    } catch (_err) {
      alert("Đặt hàng thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="site-container py-10 min-h-[60vh]">
        <div className="glass-card rounded-3xl p-8 text-center">
          <p className="text-gray-600 mb-4">
            Không có sản phẩm để thanh toán. Vui lòng chọn “Mua ngay” từ trang
            sản phẩm.
          </p>
          <Link
            to="/"
            className="liquid-btn text-white px-6 py-3 rounded-2xl font-bold"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="site-container py-8 min-h-[60vh]">
      <h1 className="text-2xl font-bold mb-6">Thanh toán</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4 text-shopbee-blue">
              <MapPin size={20} />
              <h2 className="font-bold text-lg text-gray-800">
                Địa chỉ nhận hàng
              </h2>
            </div>
            {addressLoading ? (
              <div className="w-full">
                <GlassListSkeleton
                  rows={3}
                  variant="full"
                  className="w-full"
                  minHeight="min-h-[150px]"
                />
              </div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-3 text-sm">
                  Bạn chưa có địa chỉ nhận hàng.
                </p>
                <Link
                  to="/addresses"
                  className="inline-flex liquid-btn text-white px-5 py-2.5 rounded-2xl font-bold text-sm"
                >
                  Thêm địa chỉ mới
                </Link>
              </div>
            ) : selectedAddress ? (
              <div className="flex items-start justify-between gap-4">
                <div className="text-sm">
                  <p className="font-bold text-gray-900">
                    {selectedAddress.fullName}{" "}
                    <span className="font-normal text-gray-500 mx-1">|</span>{" "}
                    {selectedAddress.phone}
                  </p>
                  <p className="text-gray-600 mt-1">
                    {selectedAddress.street}, {selectedAddress.ward},{" "}
                    {selectedAddress.district}, {selectedAddress.province}
                  </p>
                  {selectedAddress.isDefault && (
                    <span className="inline-block mt-2 px-2 py-0.5 border border-shopbee-blue text-shopbee-blue text-[10px] font-bold rounded">
                      Mặc định
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setAddressModalOpen(true)}
                  className="text-sm font-bold text-shopbee-blue hover:underline shrink-0"
                >
                  Thay đổi
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <button
                  onClick={() => setAddressModalOpen(true)}
                  className="liquid-btn text-white px-5 py-2.5 rounded-2xl font-bold text-sm"
                >
                  Chọn địa chỉ
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  decoding="async"
                  className="w-20 h-20 object-cover rounded-xl shrink-0"
                />
                <div className="flex-1 min-w-0 w-full">
                  <p className="font-medium line-clamp-2">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {item.variantSummary ||
                      (item.style && item.color
                        ? `Phân loại: ${item.style} / ${item.color}`
                        : "")}
                  </p>
                  <p className="text-sm text-gray-500">
                    ₫{item.price.toLocaleString()}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateQuantity(item.id, Math.max(1, item.quantity - 1))
                      }
                      className="px-2 py-1 rounded-lg bg-gray-100"
                      aria-label="Giảm số lượng"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="px-3 py-1 border rounded-lg">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-2 py-1 rounded-lg bg-gray-100"
                      aria-label="Tăng số lượng"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                <div className="w-full sm:w-auto flex justify-end">
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 hover:text-red-600"
                    aria-label="Xóa khỏi thanh toán"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 h-fit">
          <h2 className="font-bold mb-4">Tóm tắt đơn hàng</h2>
          <div className="flex justify-between mb-2 text-sm text-gray-600">
            <span>Tổng tiền hàng</span>
            <span>₫{subtotal.toLocaleString()}</span>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Voucher
            </label>
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white/60 backdrop-blur-xl px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <Ticket size={16} className="text-shopbee-blue" />
                {selectedVoucher ? (
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {selectedVoucher.code}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {selectedVoucher.description || "Voucher đã chọn"}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Chọn voucher từ kho hoặc nhập mã
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {selectedVoucher && (
                  <button
                    type="button"
                    onClick={() => setSelectedVoucher(null)}
                    className="px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Bỏ chọn
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setVoucherModalOpen(true)}
                  className="px-3 py-2 rounded-xl text-xs font-bold border border-shopbee-blue text-shopbee-blue hover:bg-shopbee-blue/5 transition-colors"
                >
                  Chọn
                </button>
              </div>
            </div>
            {discountAmount > 0 && (
              <p className="mt-1 text-xs text-green-600">
                Tiết kiệm ₫{discountAmount.toLocaleString()} từ voucher.
              </p>
            )}
          </div>

          <div className="flex justify-between mb-4 text-sm text-gray-600">
            <span>Vận chuyển</span>
            <span>₫0</span>
          </div>
          <div className="flex justify-between font-bold text-lg mb-6">
            <span>Thành tiền</span>
            <span className="text-shopbee-blue">
              ₫{finalTotal.toLocaleString()}
            </span>
          </div>

          {!token ? (
            <Link
              to="/login"
              className="w-full block text-center liquid-btn text-white font-bold py-3 rounded-2xl"
            >
              Đăng nhập để thanh toán
            </Link>
          ) : (
            <button
              onClick={handlePlaceOrder}
              disabled={submitting || items.length === 0 || !selectedAddress}
              className="w-full liquid-btn text-white font-bold py-3 rounded-2xl disabled:opacity-60"
            >
              {submitting ? "Đang xử lý..." : "Đặt hàng"}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {addressModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
            onClick={() => setAddressModalOpen(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 shrink-0">
                <h3 className="font-bold text-lg">Địa chỉ của tôi</h3>
                <button
                  onClick={() => setAddressModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {addresses.map((addr) => (
                  <button
                    key={addr._id}
                    onClick={() => {
                      setSelectedAddress(addr);
                      setAddressModalOpen(false);
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${
                      selectedAddress?._id === addr._id
                        ? "border-shopbee-blue bg-shopbee-blue/5"
                        : "border-gray-200 hover:border-shopbee-blue/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            selectedAddress?._id === addr._id
                              ? "border-shopbee-blue"
                              : "border-gray-400"
                          }`}
                        >
                          {selectedAddress?._id === addr._id && (
                            <div className="w-2 h-2 rounded-full bg-shopbee-blue" />
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">
                          {addr.fullName}{" "}
                          <span className="font-normal text-gray-500">
                            | {addr.phone}
                          </span>
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {addr.street}, {addr.ward}, {addr.district},{" "}
                          {addr.province}
                        </p>
                        {addr.isDefault && (
                          <span className="inline-block mt-2 px-2 py-0.5 border border-shopbee-blue text-shopbee-blue text-[10px] font-bold rounded">
                            Mặc định
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t shrink-0">
                <Link
                  to="/addresses"
                  className="flex items-center justify-center gap-2 w-full py-3 border border-gray-300 rounded-2xl font-bold hover:bg-gray-50 transition-colors"
                >
                  <Plus size={18} />
                  Thêm địa chỉ mới
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {voucherModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 p-4"
            onClick={() => setVoucherModalOpen(false)}
          >
            <motion.div
              initial={{ y: 16, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 16, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/60">
                <div>
                  <p className="text-sm font-bold text-gray-800">
                    Chọn voucher
                  </p>
                  <p className="text-xs text-gray-500">
                    Nhập mã hoặc chọn trong kho voucher
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setVoucherModalOpen(false)}
                  className="h-9 w-9 rounded-2xl bg-white/70 border border-white/60 flex items-center justify-center text-gray-700 hover:bg-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-auto p-4 space-y-3">
                {!token ? (
                  <div className="rounded-2xl border border-gray-200 bg-white/60 p-4 text-center">
                    <p className="text-sm text-gray-600 mb-3">
                      Vui lòng đăng nhập để dùng voucher.
                    </p>
                    <Link
                      to="/login"
                      className="inline-flex liquid-btn text-white px-5 py-2.5 rounded-2xl font-bold text-sm"
                      onClick={() => setVoucherModalOpen(false)}
                    >
                      Đăng nhập
                    </Link>
                  </div>
                ) : (
                  <>
                    <form
                      className="rounded-2xl border border-gray-200 bg-white/60 p-3"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!token) return;
                        const code = voucherCodeInput.trim().toUpperCase();
                        if (!code) return;
                        setVoucherApplyError(null);
                        setVoucherApplyLoading(true);
                        try {
                          const res = await productApi.addVoucher(code, token);
                          const data = res.data as CheckoutVoucher & {
                            status?: "valid" | "used" | "expired";
                          };
                          if (data.status && data.status !== "valid") {
                            setVoucherApplyError(
                              data.status === "used"
                                ? "Voucher này đã được sử dụng."
                                : "Voucher này đã hết hạn.",
                            );
                            return;
                          }
                          const saved: CheckoutVoucher = {
                            code: data.code || code,
                            description: data.description,
                            discountType: data.discountType,
                            discountPercent: data.discountPercent,
                            maxDiscountAmount: data.maxDiscountAmount,
                            expiry: data.expiry ?? null,
                          };
                          setMyVouchers((prev) => [
                            saved,
                            ...prev.filter((v) => v.code !== saved.code),
                          ]);
                          setSelectedVoucher(saved);
                          setVoucherModalOpen(false);
                          setVoucherCodeInput("");
                        } catch (err) {
                          const serverMessage =
                            err && typeof err === "object" && "response" in err
                              ? (
                                  err as {
                                    response?: { data?: { message?: string } };
                                  }
                                ).response?.data?.message
                              : undefined;
                          setVoucherApplyError(
                            serverMessage ||
                              "Không thể áp dụng voucher. Vui lòng thử lại.",
                          );
                        } finally {
                          setVoucherApplyLoading(false);
                        }
                      }}
                    >
                      <p className="text-xs font-semibold text-gray-700 mb-2">
                        Nhập mã voucher
                      </p>
                      <div className="flex gap-2">
                        <input
                          value={voucherCodeInput}
                          onChange={(e) =>
                            setVoucherCodeInput(e.target.value.toUpperCase())
                          }
                          placeholder="Nhập mã (VD: GIAM10)"
                          className="flex-1 px-3 py-2 rounded-2xl border border-gray-200 bg-white/70 text-sm outline-none focus:ring-2 focus:ring-shopbee-blue/30 focus:border-shopbee-blue/60"
                        />
                        <button
                          type="submit"
                          disabled={voucherApplyLoading}
                          className="px-4 py-2 rounded-2xl text-xs font-bold border border-shopbee-blue text-shopbee-blue hover:bg-shopbee-blue/5 transition-colors disabled:opacity-60"
                        >
                          {voucherApplyLoading ? "Đang áp dụng..." : "Áp dụng"}
                        </button>
                      </div>
                      {voucherApplyError && (
                        <p className="mt-2 text-xs text-red-500">
                          {voucherApplyError}
                        </p>
                      )}
                    </form>

                    {vouchersLoading ? (
                      <div className="rounded-2xl border border-gray-200 bg-white/60 p-4">
                        <GlassListSkeleton
                          rows={3}
                          variant="compact"
                          className="w-full"
                        />
                      </div>
                    ) : myVouchers.length === 0 ? (
                      <div className="rounded-2xl border border-gray-200 bg-white/60 p-4 text-center">
                        <p className="text-sm text-gray-600">
                          Bạn chưa có voucher nào trong kho.
                        </p>
                        <Link
                          to="/vouchers"
                          className="inline-flex mt-3 px-5 py-2.5 rounded-2xl border border-shopbee-blue text-shopbee-blue font-bold text-sm hover:bg-shopbee-blue/5 transition-colors"
                          onClick={() => setVoucherModalOpen(false)}
                        >
                          Đi tới Kho voucher
                        </Link>
                      </div>
                    ) : (
                      myVouchers.map((v) => {
                        const isSelected = selectedVoucher?.code === v.code;
                        const percent = Number(v.discountPercent || 0);
                        const cap = Number(v.maxDiscountAmount || 0);
                        return (
                          <button
                            key={v.code}
                            type="button"
                            onClick={() => {
                              setSelectedVoucher(v);
                              setVoucherModalOpen(false);
                            }}
                            className={`w-full text-left rounded-3xl border p-4 transition-all ${
                              isSelected
                                ? "border-shopbee-blue bg-shopbee-blue/5"
                                : "border-gray-200 bg-white/60 hover:bg-white"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-extrabold text-gray-900">
                                  {v.code}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  {v.description}
                                </p>
                                {v.expiry && (
                                  <p className="text-[11px] text-gray-400 mt-2">
                                    HSD:{" "}
                                    {new Date(v.expiry).toLocaleDateString(
                                      "vi-VN",
                                    )}
                                  </p>
                                )}
                              </div>
                              <span className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full border border-shopbee-blue/40 text-shopbee-blue bg-white/70">
                                -{percent}%
                                {cap > 0
                                  ? ` • tối đa ₫${cap.toLocaleString()}`
                                  : ""}
                              </span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Checkout;



