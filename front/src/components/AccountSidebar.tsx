import { Link, useNavigate } from "react-router-dom";
import { User, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { productApi } from "../utils/api";

type AccountSidebarProps = {
  active?: "profile" | "addresses" | "orders" | "vouchers";
};

const AccountSidebar = ({ active = "profile" }: AccountSidebarProps) => {
  const { user, logout, isSeller, token, login } = useAuth();
  const navigate = useNavigate();

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

  if (!user) return null;

  return (
    <motion.div
      layoutId="account-sidebar"
      className="glass-card rounded-3xl p-4 md:p-5 h-fit"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-shopbee-blue/10 rounded-full flex items-center justify-center overflow-hidden">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={20} className="text-shopbee-blue" />
          )}
        </div>
        <div>
          <p className="font-bold text-sm text-gray-900 dark:text-slate-100">
            {user.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {user.email}
          </p>
        </div>
      </div>

      {!isSeller && (
        <button
          onClick={handleBecomeSeller}
          className="w-full mb-6 p-3 rounded-2xl bg-shopbee-blue/10 text-shopbee-blue font-bold text-xs flex items-center justify-center gap-2 hover:bg-shopbee-blue/20 transition-all border border-shopbee-blue/20"
        >
          <ShieldCheck size={14} />
          Trở thành Người Bán
        </button>
      )}

      <div className="space-y-2 text-sm">
        <p className="font-bold text-gray-700 dark:text-slate-200 mb-2">
          Tài khoản của tôi
        </p>
        <Link
          to="/account"
          className={`block text-sm font-medium transition-colors ${
            active === "profile"
              ? "text-shopbee-blue"
              : "text-gray-600 dark:text-slate-400 hover:text-shopbee-blue"
          }`}
        >
          Hồ sơ
        </Link>
        <Link
          to="/addresses"
          className={`block text-sm font-medium transition-colors ${
            active === "addresses"
              ? "text-shopbee-blue"
              : "text-gray-600 dark:text-slate-400 hover:text-shopbee-blue"
          }`}
        >
          Địa chỉ
        </Link>
        <Link
          to="/orders"
          className={`block text-sm font-medium transition-colors ${
            active === "orders"
              ? "text-shopbee-blue"
              : "text-gray-600 dark:text-slate-400 hover:text-shopbee-blue"
          }`}
        >
          Đơn mua
        </Link>
      </div>
      <div className="mt-2 text-sm">
        <Link
          to="/vouchers"
          className={`block text-sm font-medium transition-colors ${
            active === "vouchers"
              ? "text-shopbee-blue"
              : "text-gray-600 dark:text-slate-400 hover:text-shopbee-blue"
          }`}
        >
          Kho voucher
        </Link>
      </div>
      <button
        onClick={() => {
          logout();
          window.location.href = "/";
        }}
        className="mt-6 flex items-center gap-2 text-red-500 font-bold hover:opacity-80 text-sm"
      >
        <LogOut size={16} /> Đăng xuất
      </button>
    </motion.div>
  );
};

export default AccountSidebar;



