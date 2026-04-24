import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { User } from "lucide-react";
import { productApi } from "../utils/api";
import AnimatedPage from "../components/AnimatedPage";

const AccountPage = () => {
  const { user, token, login } = useAuth();

  const [username, setUsername] = useState(user?.username || "");
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [gender, setGender] = useState(user?.gender || "other");
  const [birthDate, setBirthDate] = useState(
    user?.birthDate ? user.birthDate.slice(0, 10) : ""
  );
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  type UpdateProfilePayload = {
    username: string;
    name: string;
    email: string;
    phone: string;
    gender: string;
    birthDate?: string;
    avatar: string;
  };

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setGender(user.gender || "other");
      setBirthDate(user.birthDate ? user.birthDate.slice(0, 10) : "");
      setAvatar(user.avatar || "");
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const payload: UpdateProfilePayload = {
        username,
        name,
        email,
        phone,
        gender,
        birthDate: birthDate || undefined,
        avatar,
      };

      const res = await productApi.updateProfile(payload, token);
      login(res.data.user, res.data.token);
      alert("Cập nhật hồ sơ thành công");
    } catch (error) {
      console.error("Lỗi cập nhật hồ sơ", error);
      const err = error as { response?: { data?: { message?: string } } };
      alert(
        err.response?.data?.message ||
          "Không thể cập nhật hồ sơ. Vui lòng thử lại."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!token) {
      alert("Vui lòng đăng nhập để cập nhật ảnh đại diện.");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);
    setUploadingAvatar(true);
    try {
      const res = await productApi.uploadAvatar(formData, token);
      const data = res.data as {
        avatar?: string;
        url?: string;
        location?: string;
      };
      const url = data.avatar || data.url || data.location;
      if (url) {
        setAvatar(url);
        if (user) {
          login(
            {
              ...user,
              avatar: url,
            },
            token
          );
        }
      }
    } catch (error) {
      console.error("Lỗi tải ảnh đại diện", error);
      alert("Không thể tải ảnh đại diện. Vui lòng thử lại.");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const curr = currentPassword;
    const next = newPassword;
    const confirm = confirmPassword;

    if (!curr || !next || !confirm) {
      alert("Vui lòng nhập đầy đủ thông tin đổi mật khẩu.");
      return;
    }
    if (next.length < 6) {
      alert("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (next !== confirm) {
      alert("Mật khẩu mới và xác nhận mật khẩu không khớp.");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await productApi.changePassword(
        { currentPassword: curr, newPassword: next },
        token
      );
      login(res.data.user, res.data.token);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      alert("Đổi mật khẩu thành công");
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      alert(
        err.response?.data?.message ||
          "Không thể đổi mật khẩu. Vui lòng thử lại."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user) {
    return (
      <AnimatedPage>
        <div className="py-10 min-h-[60vh]">
          <div className="glass-card rounded-3xl p-8 text-center max-w-md mx-auto">
            <User size={28} className="mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600 mb-4">
              Vui lòng đăng nhập để xem thông tin tài khoản
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center liquid-btn text-white px-6 py-3 rounded-2xl font-bold whitespace-nowrap"
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
      <div className="space-y-6">
        <div className="glass-card rounded-3xl p-6">
          <h1 className="text-lg font-bold mb-1">Hồ sơ của tôi</h1>
          <p className="text-sm text-gray-500 mb-4">
            Quản lý thông tin hồ sơ để bảo mật tài khoản
          </p>

          <form className="space-y-4" onSubmit={handleSaveProfile}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-shopbee-blue/40 focus:border-shopbee-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">
                  Tên
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-shopbee-blue/40 focus:border-shopbee-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-shopbee-blue/40 focus:border-shopbee-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-shopbee-blue/40 focus:border-shopbee-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">
                  Giới tính
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-shopbee-blue/40 focus:border-shopbee-blue"
                >
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">
                  Ngày sinh
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-shopbee-blue/40 focus:border-shopbee-blue"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">
                Ảnh đại diện
              </label>
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-shopbee-blue/10 flex items-center justify-center overflow-hidden">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={20} className="text-shopbee-blue" />
                    )}
                  </div>
                  <label className="inline-flex items-center px-3 py-2 rounded-2xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">
                    <span>
                      {uploadingAvatar ? "Đang tải..." : "Chọn ảnh từ thiết bị"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarFileChange}
                      disabled={uploadingAvatar}
                    />
                  </label>
                </div>
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="w-full md:flex-1 rounded-2xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-shopbee-blue/40 focus:border-shopbee-blue"
                  placeholder="Hoặc dán URL ảnh (https://...)"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-2 px-6 py-3 rounded-2xl liquid-btn text-white font-bold disabled:opacity-60"
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </form>
        </div>

        <div className="glass-card rounded-3xl p-6">
          <h2 className="text-lg font-bold mb-1">Đổi mật khẩu</h2>
          <p className="text-sm text-gray-500 mb-4">
            Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác
          </p>

          <form className="space-y-4" onSubmit={handleChangePassword}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-shopbee-blue/40 focus:border-shopbee-blue"
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-shopbee-blue/40 focus:border-shopbee-blue"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-shopbee-blue/40 focus:border-shopbee-blue"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              className="mt-2 px-6 py-3 rounded-2xl liquid-btn text-white font-bold disabled:opacity-60"
            >
              {changingPassword ? "Đang đổi..." : "Đổi mật khẩu"}
            </button>
          </form>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default AccountPage;



