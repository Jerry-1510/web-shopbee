import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { Store, Save, Upload, User, Image, MapPin } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { productApi } from "../../utils/api";

const AdminShopProfile = () => {
  const { user, token, login } = useAuth();
  const [shopName, setShopName] = useState("");
  const [shopDescription, setShopDescription] = useState("");
  const [shopAvatar, setShopAvatar] = useState("");
  const [shopCover, setShopCover] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    setShopName(user?.shopName || user?.name || "");
    setShopDescription(user?.shopDescription || "");
    setShopAvatar(user?.shopAvatar || "");
    setShopCover(user?.shopCover || "");
    setShopAddress(user?.shopAddress || "");
  }, [user]);

  const handleUploadAvatar = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!token) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const res = await productApi.uploadShopAvatar(
        (() => {
          const formData = new FormData();
          formData.append("avatar", file);
          return formData;
        })(),
        token,
      );
      const data = res.data as {
        shopAvatar?: string;
        url?: string;
        location?: string;
      };
      const nextAvatar = data.shopAvatar || data.url || data.location || "";
      if (nextAvatar) {
        setShopAvatar(nextAvatar);
        if (user) {
          login({ ...user, shopAvatar: nextAvatar }, token);
        }
      }
    } catch {
      alert("Không thể tải ảnh shop. Vui lòng thử lại.");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleUploadCover = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!token) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const res = await productApi.uploadShopCover(
        (() => {
          const formData = new FormData();
          formData.append("cover", file);
          return formData;
        })(),
        token,
      );
      const data = res.data as {
        shopCover?: string;
        url?: string;
        location?: string;
      };
      const nextCover = data.shopCover || data.url || data.location || "";
      if (nextCover) {
        setShopCover(nextCover);
        if (user) {
          login({ ...user, shopCover: nextCover }, token);
        }
      }
    } catch {
      alert("Không thể tải ảnh bìa shop. Vui lòng thử lại.");
    } finally {
      setUploadingCover(false);
      e.target.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user) return;
    setSaving(true);
    try {
      const res = await productApi.updateProfile(
        {
          shopName: shopName.trim(),
          shopDescription: shopDescription.trim(),
          shopAvatar: shopAvatar.trim(),
          shopCover: shopCover.trim(),
          shopAddress: shopAddress.trim(),
        },
        token,
      );
      login(res.data.user, res.data.token);
      alert("Cập nhật thông tin shop thành công.");
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      alert(
        err.response?.data?.message ||
          "Không thể cập nhật thông tin shop. Vui lòng thử lại.",
      );
    } finally {
      setSaving(false);
    }
  };

  const shopTitle = shopName || user?.name || "Shop của bạn";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Thông tin kênh người bán</h1>
        <p className="text-sm text-gray-500 mt-1">
          Quản lý tên shop, mô tả, địa chỉ, ảnh đại diện và ảnh bìa hiển thị
          trên trang shop/sản phẩm.
        </p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-3xl p-5 md:p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">
              Tên shop
            </label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Nhập tên hiển thị của shop"
              className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-shopbee-blue/40 focus:border-shopbee-blue"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">
              Mô tả shop
            </label>
            <textarea
              rows={5}
              value={shopDescription}
              onChange={(e) => setShopDescription(e.target.value)}
              placeholder="Mô tả ngắn để khách hiểu về shop của bạn"
              className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-shopbee-blue/40 focus:border-shopbee-blue resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">
              Địa chỉ shop
            </label>
            <input
              type="text"
              value={shopAddress}
              onChange={(e) => setShopAddress(e.target.value)}
              placeholder="Ví dụ: Quận 1, TP. Hồ Chí Minh"
              className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-shopbee-blue/40 focus:border-shopbee-blue"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">
              URL ảnh shop
            </label>
            <input
              type="text"
              value={shopAvatar}
              onChange={(e) => setShopAvatar(e.target.value)}
              placeholder="Hoặc dán URL ảnh (https://...)"
              className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-shopbee-blue/40 focus:border-shopbee-blue"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">
              URL ảnh bìa shop
            </label>
            <input
              type="text"
              value={shopCover}
              onChange={(e) => setShopCover(e.target.value)}
              placeholder="Dán URL ảnh bìa (https://...)"
              className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-shopbee-blue/40 focus:border-shopbee-blue"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl liquid-btn text-white text-sm font-bold disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? "Đang lưu..." : "Lưu thông tin shop"}
          </button>
        </div>

        <div className="glass-card rounded-3xl p-5 md:p-6 space-y-4 h-fit">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">
            Xem trước
          </p>
          <div className="rounded-2xl overflow-hidden border border-gray-100">
            {shopCover ? (
              <img
                src={shopCover}
                alt={`${shopTitle} cover`}
                className="w-full h-28 object-cover"
              />
            ) : (
              <div className="w-full h-28 bg-gradient-to-r from-shopbee-blue to-shopbee-lightBlue/80" />
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-shopbee-blue/10 flex items-center justify-center">
              {shopAvatar ? (
                <img src={shopAvatar} alt={shopTitle} className="w-full h-full object-cover" />
              ) : (
                <Store size={26} className="text-shopbee-blue" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 line-clamp-2">{shopTitle}</p>
              <p className="text-xs text-gray-500">Kênh Người Bán</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            {shopDescription || "Chưa có mô tả shop."}
          </p>
          <div className="text-xs text-gray-600 inline-flex items-center gap-1.5">
            <MapPin size={12} className="text-shopbee-blue" />
            <span>{shopAddress || "Chưa cập nhật địa chỉ shop."}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">
              <Upload size={14} />
              <span>
                {uploadingAvatar ? "Đang tải ảnh shop..." : "Tải ảnh shop"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUploadAvatar}
                disabled={uploadingAvatar}
              />
            </label>
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">
              <Image size={14} />
              <span>
                {uploadingCover ? "Đang tải ảnh bìa..." : "Tải ảnh bìa"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUploadCover}
                disabled={uploadingCover}
              />
            </label>
          </div>
          {!shopAvatar && (
            <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
              <User size={12} />
              Dùng icon mặc định khi chưa có ảnh shop.
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default AdminShopProfile;



