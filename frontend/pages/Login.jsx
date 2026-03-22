import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500 ease-in-out">
      {}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 md:w-96 h-72 md:h-96 bg-primary/10 rounded-full blur-3xl opacity-50 md:opacity-100"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 md:w-96 h-72 md:h-96 bg-purple-500/10 rounded-full blur-3xl opacity-50 md:opacity-100"></div>
      </div>

      <div className="bg-white dark:bg-surface border border-slate-200 dark:border-border p-8 rounded-2xl w-full max-w-md z-10 relative transition-all duration-500 ease-in-out">
        <Link
          to="/"
          className="inline-flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm mb-6 transition-colors duration-500 ease-in-out"
        >
          <ArrowLeft size={16} className="mr-1" /> Back to Home
        </Link>

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary/20 text-primary rounded-xl mx-auto flex items-center justify-center mb-4 border border-primary/20 transition-all duration-500 ease-in-out">
            <ShieldCheck size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors duration-500 ease-in-out">Welcome Back</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm transition-colors duration-500 ease-in-out">
            Sign in to your dashboard
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-lg mb-6 text-[10px] font-bold uppercase tracking-wider text-center transition-colors duration-500 ease-in-out">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide transition-colors duration-500 ease-in-out">
              Email Address
            </label>
            <div className="relative">
              <UserIcon
                className="absolute left-3 top-3 text-slate-400 dark:text-slate-500 transition-colors duration-500 ease-in-out"
                size={18}
              />
              <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-background border border-slate-300 dark:border-border rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-500 ease-in-out"
                placeholder="your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide transition-colors duration-500 ease-in-out">
              Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-3 text-slate-400 dark:text-slate-500 transition-colors duration-500 ease-in-out"
                size={18}
              />
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-background border border-slate-300 dark:border-border rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-500 ease-in-out"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white transition-colors duration-500 ease-in-out focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-blue-600 text-white py-2.5 rounded-lg font-bold transition-all duration-500 ease-in-out active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-500 border-t border-slate-200 dark:border-border pt-6 transition-colors duration-500 ease-in-out">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-primary font-semibold hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-500 ease-in-out"
          >
            Create one now
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
