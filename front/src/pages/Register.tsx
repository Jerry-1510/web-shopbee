import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", {
        name,
        email,
        password,
      });
      login(res.data.user, res.data.token);
      navigate("/");
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="glass-card rounded-[32px] p-10 w-full max-w-md border-white/50">
        <h2 className="text-3xl font-black text-center mb-8 text-shopbee-blue tracking-tighter italic uppercase">
          Đăng Ký
        </h2>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-300 p-4 rounded-2xl text-sm mb-6 border border-red-100 dark:border-red-800 animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest mb-2 ml-1">
              Họ tên
            </label>
            <input
              type="text"
              className="w-full bg-gray-100/70 dark:bg-slate-800/70 border border-transparent dark:border-slate-700 focus:border-shopbee-blue focus:bg-white dark:focus:bg-slate-800 rounded-2xl px-5 py-3.5 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
              placeholder="Nguyễn Văn A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest mb-2 ml-1">
              Email
            </label>
            <input
              type="email"
              className="w-full bg-gray-100/70 dark:bg-slate-800/70 border border-transparent dark:border-slate-700 focus:border-shopbee-blue focus:bg-white dark:focus:bg-slate-800 rounded-2xl px-5 py-3.5 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest mb-2 ml-1">
              Mật khẩu
            </label>
            <input
              type="password"
              className="w-full bg-gray-100/70 dark:bg-slate-800/70 border border-transparent dark:border-slate-700 focus:border-shopbee-blue focus:bg-white dark:focus:bg-slate-800 rounded-2xl px-5 py-3.5 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full liquid-btn text-white font-bold py-4 rounded-2xl shadow-xl shadow-shopbee-blue/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : "ĐĂNG KÝ"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          Đã có tài khoản?{" "}
          <Link
            to="/login"
            className="text-shopbee-blue font-bold hover:underline"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;



