import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { productApi } from "../utils/api";
import AnimatedPage from "../components/AnimatedPage";
import { GlassProgressLoader, GlassListSkeleton } from "../components/GlassLoader";

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

type AddressDraft = Omit<Address, "_id">;

const emptyDraft: AddressDraft = {
  fullName: "",
  phone: "",
  province: "",
  district: "",
  ward: "",
  street: "",
  isDefault: false,
};

const AddressesPage = () => {
  const { user, token } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AddressDraft>(emptyDraft);

  const canUse = Boolean(user && token);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await productApi.getAddresses(token);
        const data = Array.isArray(res.data) ? (res.data as Address[]) : [];
        if (!cancelled) setAddresses(data);
      } catch {
        if (!cancelled) setAddresses([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const defaultAddress = useMemo(
    () => addresses.find((a) => a.isDefault) || null,
    [addresses]
  );

  if (!user) {
    return (
      <AnimatedPage>
        <div className="site-container py-10 min-h-[60vh]">
          <div className="glass-card rounded-3xl p-8 text-center">
            <p className="text-gray-600 mb-4">
              Vui lòng đăng nhập để quản lý địa chỉ
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

  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setShowForm(true);
  };

  const openEdit = (addr: Address) => {
    setEditingId(addr._id);
    setDraft({
      fullName: addr.fullName,
      phone: addr.phone,
      province: addr.province,
      district: addr.district,
      ward: addr.ward,
      street: addr.street,
      isDefault: Boolean(addr.isDefault),
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setDraft(emptyDraft);
  };

  const handleSave = async () => {
    if (!token) return;
    const payload = {
      fullName: draft.fullName.trim(),
      phone: draft.phone.trim(),
      province: draft.province.trim(),
      district: draft.district.trim(),
      ward: draft.ward.trim(),
      street: draft.street.trim(),
      isDefault: Boolean(draft.isDefault),
    };
    if (
      !payload.fullName ||
      !payload.phone ||
      !payload.province ||
      !payload.district ||
      !payload.ward ||
      !payload.street
    ) {
      alert("Vui lòng nhập đầy đủ thông tin địa chỉ.");
      return;
    }

    setSaving(true);
    try {
      const res = editingId
        ? await productApi.updateAddress(editingId, payload, token)
        : await productApi.addAddress(payload, token);
      const data = Array.isArray(res.data) ? (res.data as Address[]) : [];
      setAddresses(data);
      closeForm();
    } catch (err) {
      const message =
        err &&
        typeof err === "object" &&
        "response" in err
          ? (
              err as {
                response?: { data?: { message?: string } };
              }
            ).response?.data?.message
          : undefined;
      alert(message || "Không thể lưu địa chỉ. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    setSaving(true);
    try {
      const res = await productApi.deleteAddress(id, token);
      const data = Array.isArray(res.data) ? (res.data as Address[]) : [];
      setAddresses(data);
    } catch {
      alert("Không thể xóa địa chỉ. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!token) return;
    setSaving(true);
    try {
      const res = await productApi.setDefaultAddress(id, token);
      const data = Array.isArray(res.data) ? (res.data as Address[]) : [];
      setAddresses(data);
    } catch {
      alert("Không thể đặt địa chỉ mặc định. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold mb-1">Địa chỉ của tôi</h1>
              <p className="text-sm text-gray-500">
                Quản lý địa chỉ nhận hàng để thanh toán nhanh hơn
              </p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              disabled={!canUse || saving}
              className="px-4 py-2.5 rounded-2xl liquid-btn text-white text-sm font-bold disabled:opacity-60"
            >
              Thêm địa chỉ
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <GlassProgressLoader label="Đang tải địa chỉ..." variant="full" />
            <GlassListSkeleton rows={3} variant="full" />
          </div>
        ) : addresses.length === 0 ? (
          <div className="glass-card rounded-3xl p-8 text-center">
            <p className="text-sm text-gray-500">
              Bạn chưa có địa chỉ nào. Hãy thêm địa chỉ nhận hàng.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((a) => (
              <div
                key={a._id}
                className="glass-card rounded-3xl p-5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900">{a.fullName}</p>
                      <span className="text-gray-300">•</span>
                      <p className="text-sm text-gray-600">{a.phone}</p>
                      {a.isDefault && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full border border-shopbee-blue/40 text-shopbee-blue bg-white/70">
                          Mặc định
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {a.street}, {a.ward}, {a.district}, {a.province}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!a.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(a._id)}
                        disabled={saving}
                        className="px-3 py-2 rounded-2xl text-xs font-bold border border-shopbee-blue text-shopbee-blue hover:bg-shopbee-blue/5 transition-colors disabled:opacity-60"
                      >
                        Đặt mặc định
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEdit(a)}
                      disabled={saving}
                      className="px-3 py-2 rounded-2xl text-xs font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(a._id)}
                      disabled={saving}
                      className="px-3 py-2 rounded-2xl text-xs font-bold border border-red-500 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-60"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
                {defaultAddress && defaultAddress._id === a._id && (
                  <p className="text-[11px] text-gray-400">
                    Địa chỉ này sẽ được ưu tiên khi bạn đặt hàng.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <div className="glass-card rounded-3xl p-6">
            <p className="font-bold text-gray-800 mb-4">
              {editingId ? "Cập nhật địa chỉ" : "Thêm địa chỉ mới"}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">
                  Họ và tên
                </label>
                <input
                  value={draft.fullName}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, fullName: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-shopbee-blue/40 focus:border-shopbee-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">
                  Số điện thoại
                </label>
                <input
                  value={draft.phone}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, phone: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-shopbee-blue/40 focus:border-shopbee-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">
                  Tỉnh/Thành phố
                </label>
                <input
                  value={draft.province}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, province: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-shopbee-blue/40 focus:border-shopbee-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">
                  Quận/Huyện
                </label>
                <input
                  value={draft.district}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, district: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-shopbee-blue/40 focus:border-shopbee-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">
                  Phường/Xã
                </label>
                <input
                  value={draft.ward}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, ward: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-shopbee-blue/40 focus:border-shopbee-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">
                  Địa chỉ cụ thể
                </label>
                <input
                  value={draft.street}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, street: e.target.value }))
                  }
                  placeholder="Số nhà, tên đường..."
                  className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-shopbee-blue/40 focus:border-shopbee-blue"
                />
              </div>
            </div>

            <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={Boolean(draft.isDefault)}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, isDefault: e.target.checked }))
                }
              />
              Đặt làm địa chỉ mặc định
            </label>

            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={!canUse || saving}
                className="px-6 py-3 rounded-2xl liquid-btn text-white font-bold disabled:opacity-60"
              >
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="px-6 py-3 rounded-2xl border border-gray-200 bg-white text-gray-700 font-bold hover:bg-gray-50 disabled:opacity-60"
              >
                Hủy
              </button>
            </div>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
};

export default AddressesPage;




