import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, X } from "lucide-react";
import AnimatedPage from "../components/AnimatedPage";
import { useAuth } from "../context/AuthContext";
import { productApi } from "../utils/api";
import { GlassListSkeleton, GlassProgressLoader } from "../components/GlassLoader";

type Voucher = {
  code: string;
  description: string;
  discount: string;
  expiry: string;
  shop?: string;
  shopLogo?: string;
};

type VoucherStatus = "valid" | "used" | "expired";

type VoucherHistoryItem = Voucher & {
  status: VoucherStatus;
  usedAt?: string;
};

const VouchersPage = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showAddInput, setShowAddInput] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [activeSection, setActiveSection] = useState<
    "my" | "discover" | "history"
  >("my");
  const [myVouchers, setMyVouchers] = useState<Voucher[]>([]);
  const [shopVouchers, setShopVouchers] = useState<Voucher[]>([]);
  const [history, setHistory] = useState<VoucherHistoryItem[]>([]);

  const handleApplyVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherCode.trim()) return;
    if (!token) {
      alert("Vui lòng đăng nhập để thêm voucher vào kho.");
      return;
    }
    const code = voucherCode.trim().toUpperCase();
    try {
      const res = await productApi.addVoucher(code, token);
      const saved = (res.data as Voucher) || {
        code,
        description: "Mã bạn vừa thêm, hãy kiểm tra khi thanh toán.",
        discount: "",
        expiry: "Chưa xác định",
      };
      setMyVouchers((prev) => [
        saved,
        ...prev.filter((v) => v.code !== saved.code),
      ]);
      setHistory((prev) => [
        {
          ...(saved as Voucher),
          status: "valid",
        },
        ...prev,
      ]);
      setShowAddInput(false);
      setVoucherCode("");
    } catch (_err) {
      alert("Không thể thêm voucher. Vui lòng thử lại.");
    }
  };

  const myVoucherCodeSet = useMemo(
    () => new Set(myVouchers.map((v) => v.code)),
    [myVouchers],
  );

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [myRes, discoverRes, historyRes] = await Promise.all([
          productApi.getMyVouchers(token),
          productApi.getShopVouchers(token),
          productApi.getVoucherHistory(token),
        ]);
        if (!cancelled && Array.isArray(myRes.data)) {
          setMyVouchers(myRes.data as Voucher[]);
        }
        if (!cancelled && Array.isArray(discoverRes.data)) {
          setShopVouchers(discoverRes.data as Voucher[]);
        }
        if (!cancelled && Array.isArray(historyRes.data)) {
          setHistory(historyRes.data as VoucherHistoryItem[]);
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu voucher", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetchData();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <AnimatedPage>
      <div className="space-y-4">
        <div className="glass-card rounded-3xl p-5 h-fit space-y-4">
          <p className="font-bold text-gray-700 dark:text-slate-100 text-sm">
            Kho voucher
          </p>
          <motion.div
            layout
            className="w-full rounded-2xl bg-white/70 dark:bg-slate-900/40 border border-shopbee-blue/40 shadow-sm hover:shadow-xl hover:border-shopbee-blue/70 backdrop-blur-xl transition-all duration-300 overflow-hidden"
          >
            <div className="flex items-center justify-between px-3 pt-3 pb-2">
              <button
                type="button"
                onClick={() => setActiveSection("my")}
                className="flex-1 text-left text-xs font-semibold text-gray-700 dark:text-slate-100"
              >
                Thêm mã voucher
              </button>
              <motion.button
                type="button"
                onClick={() => setShowAddInput((prev) => !prev)}
                whileTap={{ scale: 0.9 }}
                className="h-7 w-7 rounded-full bg-white/80 shadow-sm flex items-center justify-center text-shopbee-blue"
              >
                <motion.span
                  animate={{ rotate: showAddInput ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {showAddInput ? <X size={16} /> : <Plus size={16} />}
                </motion.span>
              </motion.button>
            </div>
            <AnimatePresence initial={false}>
              {showAddInput && (
                <motion.form
                  key="form"
                  onSubmit={handleApplyVoucher}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                  className="px-3 pb-3 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={voucherCode}
                        onChange={(e) =>
                          setVoucherCode(e.target.value.toUpperCase())
                        }
                        placeholder="Nhập mã voucher của bạn"
                        className="w-full rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-transparent px-3 pr-8 py-2 text-sm outline-none focus:border-shopbee-blue/70 focus:ring-2 focus:ring-shopbee-blue/20 transition-all placeholder:text-gray-400"
                      />
                      {voucherCode && (
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-shopbee-blue/80">
                          <Check size={16} />
                        </span>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="liquid-btn px-3 py-2 rounded-2xl text-xs font-bold text-white shadow-md hover:shadow-lg transition-all"
                    >
                      Áp dụng
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Nhập mã bạn nhận được từ chương trình khuyến mãi.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
          <motion.button
            type="button"
            onClick={() => setActiveSection("discover")}
            whileHover={{ y: -1, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full px-4 py-2.5 rounded-2xl text-sm backdrop-blur-xl border transition-all ${
              activeSection === "discover"
                ? "border-shopbee-blue text-shopbee-blue bg-gradient-to-r from-shopbee-blue/10 via-white/40 to-shopbee-lightBlue/20 dark:from-shopbee-blue/40 dark:via-slate-900/70 dark:to-slate-800/80 shadow-lg"
                : "border-white/60 dark:border-slate-700/70 text-gray-700 dark:text-slate-100 bg-white/60 dark:bg-slate-900/50 hover:bg-white/80 dark:hover:bg-slate-900/70 shadow-sm"
            }`}
          >
            Tìm thêm voucher
          </motion.button>
          <motion.button
            type="button"
            onClick={() => setActiveSection("history")}
            whileHover={{ y: -1, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full px-4 py-2.5 rounded-2xl text-sm backdrop-blur-xl border transition-all ${
              activeSection === "history"
                ? "border-shopbee-blue text-shopbee-blue bg-gradient-to-r from-shopbee-blue/10 via-white/40 to-shopbee-lightBlue/20 dark:from-shopbee-blue/40 dark:via-slate-900/70 dark:to-slate-800/80 shadow-lg"
                : "border-white/60 dark:border-slate-700/70 text-gray-700 dark:text-slate-100 bg-white/60 dark:bg-slate-900/50 hover:bg-white/80 dark:hover:bg-slate-900/70 shadow-sm"
            }`}
          >
            Lịch sử voucher
          </motion.button>
        </div>

        <div className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              <GlassProgressLoader
                label="Đang đồng bộ kho voucher..."
                variant="full"
              />
              <GlassListSkeleton rows={5} variant="full" />
            </div>
          ) : (
            <>
          {activeSection === "my" && (
            <div className="glass-card rounded-3xl p-6">
              <h1 className="text-lg font-bold mb-1 text-gray-900 dark:text-slate-100">
                Kho voucher của bạn
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                Quản lý các mã giảm giá có thể sử dụng khi thanh toán.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myVouchers.map((v) => (
                  <div
                    key={v.code}
                    className="rounded-3xl border border-dashed border-shopbee-blue/60 dark:border-slate-700/80 bg-gradient-to-r from-shopbee-blue/5 to-shopbee-lightBlue/5 dark:from-slate-900/70 dark:to-slate-800/80 p-4 flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-2xl bg-white/80 dark:bg-slate-900/80 flex items-center justify-center shadow-sm ring-1 ring-shopbee-blue/10 overflow-hidden">
                          {v.shopLogo ? (
                            <img
                              src={v.shopLogo}
                              alt={v.shop || v.code}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-bold text-shopbee-blue">
                              {(v.shop || "M")[0]}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-shopbee-blue uppercase tracking-widest">
                            {v.shop || "Mã giảm"}
                          </p>
                          <p className="text-xl font-extrabold text-gray-900 dark:text-slate-100 mt-0.5">
                            {v.code}
                          </p>
                        </div>
                      </div>
                      {v.discount && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 text-shopbee-blue dark:text-shopbee-lightBlue font-semibold border border-shopbee-blue/40 dark:border-shopbee-lightBlue/60">
                          {v.discount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-slate-300 mb-2">
                      {v.description}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-slate-400">
                      HSD: {v.expiry}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "discover" && (
            <div className="glass-card rounded-3xl p-6">
              <h1 className="text-lg font-bold mb-1 text-gray-900 dark:text-slate-100">
                Voucher từ các shop
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                Chọn voucher yêu thích để thêm vào kho của bạn.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shopVouchers.map((v) => {
                  const alreadySaved = myVoucherCodeSet.has(v.code);
                  return (
                    <div
                      key={v.code}
                      className="rounded-3xl border border-dashed border-gray-200 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/70 p-4 flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-2xl bg-gray-900 text-white flex items-center justify-center shadow-sm overflow-hidden">
                            {v.shopLogo ? (
                              <img
                                src={v.shopLogo}
                                alt={v.shop || v.code}
                                loading="lazy"
                                decoding="async"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-bold">
                                {(v.shop || "S")[0]}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">
                              {v.shop || "Shop"}
                            </p>
                            <p className="text-xl font-extrabold text-gray-900 dark:text-slate-100 mt-1">
                              {v.code}
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900 text-white font-semibold">
                          {v.discount}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-slate-300 mb-2">
                        {v.description}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-slate-400 mb-3">
                        HSD: {v.expiry}
                      </p>
                      <button
                        type="button"
                        disabled={alreadySaved}
                        onClick={async () => {
                          if (alreadySaved || !token) return;
                          try {
                            const res = await productApi.addVoucher(
                              v.code,
                              token
                            );
                            const saved = (res.data as Voucher) || v;
                            setMyVouchers((prev) => [
                              saved,
                              ...prev.filter((m) => m.code !== saved.code),
                            ]);
                            setHistory((prev) => [
                              {
                                ...(saved as Voucher),
                                status: "valid",
                              },
                              ...prev,
                            ]);
                          } catch (_err) {
                            alert("Không thể lưu voucher. Vui lòng thử lại.");
                          }
                        }}
                        className={`mt-auto px-4 py-2 rounded-2xl text-xs font-semibold transition-colors ${
                          alreadySaved
                            ? "bg-gray-100 dark:bg-slate-800/60 text-gray-400 dark:text-slate-400 cursor-default"
                            : "liquid-btn text-white"
                        }`}
                      >
                        {alreadySaved ? "Đã lưu vào kho" : "Lưu voucher"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeSection === "history" && (
            <div className="glass-card rounded-3xl p-6">
              <h1 className="text-lg font-bold mb-1 text-gray-900 dark:text-slate-100">
                Lịch sử voucher
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                Xem trạng thái hiệu lực và các voucher đã sử dụng.
              </p>

              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {history.map((item) => {
                  let statusLabel = "";
                  let statusClass = "";

                  if (item.status === "valid") {
                    statusLabel = "Còn hiệu lực";
                    statusClass =
                      "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/40";
                  } else if (item.status === "used") {
                    statusLabel = "Đã sử dụng";
                    statusClass =
                      "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/40";
                  } else {
                    statusLabel = "Hết hạn";
                    statusClass =
                      "bg-gray-50 text-gray-500 border-gray-200 dark:bg-slate-700/40 dark:text-slate-300 dark:border-slate-600";
                  }

                  return (
                    <div
                      key={item.code + item.status + (item.usedAt || "")}
                      className="py-3 flex items-start justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">
                          {item.code}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-slate-300">
                          {item.description}
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-slate-400 mt-1">
                          HSD: {item.expiry}
                          {item.usedAt && ` • Sử dụng ngày ${item.usedAt}`}
                        </p>
                      </div>
                      <span
                        className={`text-[11px] px-2.5 py-1 rounded-full border whitespace-nowrap ${statusClass}`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
};

export default VouchersPage;



