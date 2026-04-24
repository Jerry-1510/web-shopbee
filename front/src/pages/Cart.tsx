import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { productApi } from "../utils/api";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2, Plus, Minus, Ticket, X } from "lucide-react";
import { GlassListSkeleton } from "../components/GlassLoader";

type CheckoutVoucher = {
  code: string;
  description?: string;
  discountType?: "percent";
  discountPercent?: number;
  maxDiscountAmount?: number;
  expiry?: string | null;
};

const Cart = () => {
  const {
    cart,
    cartTotal: _cartTotal,
    cartCount,
    updateQuantity,
    removeFromCart,
  } = useCart();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [myVouchers, setMyVouchers] = useState<CheckoutVoucher[]>([]);
  const [vouchersLoading, setVouchersLoading] = useState(false);
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [voucherApplyLoading, setVoucherApplyLoading] = useState(false);
  const [voucherApplyError, setVoucherApplyError] = useState<string | null>(
    null,
  );
  const [selectedVoucher, setSelectedVoucher] =
    useState<CheckoutVoucher | null>(null);
  const [selectedIds, setSelectedIds] = useState<Array<string | number>>([]);

  useEffect(() => {
    setSelectedIds((prev) => {
      const ids = cart.map((item) => item.id);
      if (prev.length === 0) {
        return ids;
      }
      const prevSet = new Set(prev);
      return ids.filter((id) => prevSet.has(id));
    });
  }, [cart]);

  const allSelected = cart.length > 0 && selectedIds.length === cart.length;
  const selectedCount = selectedIds.length;

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

  const selectedTotal = useMemo(
    () =>
      cart
        .filter((item) => selectedIds.includes(item.id))
        .reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart, selectedIds],
  );

  const discountAmount = useMemo(() => {
    if (!selectedVoucher) return 0;
    const percent = Number(selectedVoucher.discountPercent || 0);
    if (!percent) return 0;
    const raw = Math.round((selectedTotal * percent) / 100);
    const cap = Number(selectedVoucher.maxDiscountAmount || 0);
    return cap > 0 ? Math.min(raw, cap) : raw;
  }, [selectedVoucher, selectedTotal]);

  const finalTotal = useMemo(
    () => Math.max(selectedTotal - discountAmount, 0),
    [selectedTotal, discountAmount],
  );

  const handleCheckout = () => {
    if (!token || cart.length === 0) return;
    const selectedItems = cart.filter((item) => selectedIds.includes(item.id));
    if (selectedItems.length === 0) {
      alert("Vui lòng chọn ít nhất một sản phẩm để thanh toán.");
      return;
    }
    const items = selectedItems.map((item) => ({
      id: String(item.id),
      name: item.name,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
      style: "",
      color: "",
      variantSummary: item.variantSummary || "",
      selectedOptions: item.selectedOptions || {},
    }));

    navigate("/checkout", {
      state: {
        items,
        voucher: selectedVoucher,
        fromCart: true,
        fromCartItemIds: selectedItems.map((item) => String(item.id)),
      },
    });
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center flex-col gap-4 px-4">
        <p className="text-gray-500">Giỏ hàng của bạn đang trống.</p>
        <Link
          to="/"
          className="liquid-btn text-white px-6 py-3 rounded-2xl font-bold"
        >
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="site-container py-4 md:py-8 pb-20 md:pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 md:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">
          Giỏ hàng ({cartCount})
        </h1>
        <div className="flex items-center justify-between sm:justify-start gap-3 text-sm text-gray-600">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => {
                if (allSelected) {
                  setSelectedIds([]);
                } else {
                  setSelectedIds(cart.map((item) => item.id));
                }
              }}
              className="w-4 h-4 rounded border-gray-300 text-shopbee-blue focus:ring-shopbee-blue"
            />
            <span>Chọn tất cả</span>
          </label>
          <span className="text-xs text-gray-400">
            Đã chọn {selectedCount}/{cartCount}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <div key={item.id} className="glass-card rounded-2xl p-3 sm:p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.id)}
                  onChange={() => {
                    setSelectedIds((prev) =>
                      prev.includes(item.id)
                        ? prev.filter((id) => id !== item.id)
                        : [...prev, item.id],
                    );
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-shopbee-blue focus:ring-shopbee-blue mt-1"
                />
                <Link
                  to={`/product/${item.id}`}
                  className="flex-1 flex items-center gap-3 group min-w-0"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl group-hover:scale-105 transition-transform shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-medium group-hover:text-shopbee-blue transition-colors line-clamp-2 text-sm sm:text-base">
                      {item.name}
                    </p>
                    {item.variantSummary && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {item.variantSummary}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      ₫{item.price.toLocaleString()}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-500 hover:text-red-600 shrink-0"
                  aria-label="Xóa khỏi giỏ"
                >
                  <Trash2 size={19} />
                </button>
              </div>
              <div className="mt-3 pl-7 sm:pl-8 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      updateQuantity(item.id, Math.max(1, item.quantity - 1))
                    }
                    className="px-2 py-1 rounded-lg bg-gray-100"
                    aria-label="Giảm số lượng"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="px-3 py-1 border rounded-lg min-w-10 text-center">
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
                <p className="text-sm sm:text-base font-bold text-shopbee-blue whitespace-nowrap">
                  ₫{(item.price * item.quantity).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="glass-card rounded-2xl p-4 sm:p-6 h-fit lg:sticky lg:top-24">
          <h2 className="font-bold mb-4">Tóm tắt đơn hàng</h2>
          <div className="flex justify-between mb-2 text-sm text-gray-600">
            <span>Tổng tiền hàng</span>
            <span>₫{selectedTotal.toLocaleString()}</span>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Voucher
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-gray-200 bg-white/60 backdrop-blur-xl px-3 py-2">
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
                  <p className="text-sm text-gray-500">Chọn voucher từ kho</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
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
          <button
            onClick={handleCheckout}
            className="w-full liquid-btn text-white font-bold py-3 rounded-2xl"
          >
            Thanh toán
          </button>
        </div>
      </div>

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
                    Chỉ hiển thị voucher còn hiệu lực trong kho
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
                      <div className="flex flex-col sm:flex-row gap-2">
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
                          className="px-4 py-2 rounded-2xl text-xs font-bold border border-shopbee-blue text-shopbee-blue hover:bg-shopbee-blue/5 transition-colors disabled:opacity-60 sm:w-auto w-full"
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

export default Cart;



