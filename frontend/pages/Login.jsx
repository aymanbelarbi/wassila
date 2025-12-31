import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { storageService } from "../services/storageService";
import {
  ShieldCheck,
  Lock,
  User as UserIcon,
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      const users = storageService.users.getAll();
      const user = users.find(
        (u) => u.email === email && u.passwordHash === password
      );

      if (user) {
        login(user);
        navigate("/dashboard");
      } else {
        setError("Invalid email or password");
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="bg-surface border border-border p-8 rounded-2xl shadow-2xl w-full max-w-md z-10 relative">
        <Link
          to="/"
          className="inline-flex items-center text-slate-400 hover:text-white text-sm mb-6 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" /> Back to Home
        </Link>

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary/20 text-primary rounded-xl mx-auto flex items-center justify-center mb-4 border border-primary/20">
            <ShieldCheck size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-slate-400 mt-2 text-sm">
            Sign in to your dashboard
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-6 text-[10px] font-bold uppercase tracking-wider text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
              Email Address
            </label>
            <div className="relative">
              <UserIcon
                className="absolute left-3 top-3 text-slate-500"
                size={18}
              />
              <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-white placeholder-slate-600 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
              Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-3 text-slate-500"
                size={18}
              />
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full pl-10 pr-10 py-2.5 bg-background border border-border rounded-lg text-white placeholder-slate-600 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-500 hover:text-white transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-blue-600 text-white py-2.5 rounded-lg font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500 border-t border-border pt-6">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-primary font-semibold hover:text-blue-400 transition-colors"
          >
            Create one now
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
