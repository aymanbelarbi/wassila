import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ShieldCheck,
  Lock,
  User as UserIcon,
  Mail,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      setError("Invalid username. Use letters, numbers, _, -");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      await registerUser(username, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500 ease-in-out">
      {}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute bottom-1/4 left-1/4 w-72 md:w-96 h-72 md:h-96 bg-emerald-500/10 rounded-full blur-3xl opacity-50 md:opacity-100"></div>
        <div className="absolute top-1/4 right-1/4 w-72 md:w-96 h-72 md:h-96 bg-emerald-500/10 rounded-full blur-3xl opacity-50 md:opacity-100"></div>
      </div>

      <div className="bg-white dark:bg-surface border border-slate-200 dark:border-border p-8 rounded-2xl w-full max-w-md z-10 relative transition-all duration-500 ease-in-out">
        <Link
          to="/"
          className="inline-flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm mb-6 transition-colors duration-500 ease-in-out"
        >
          <ArrowLeft size={16} className="mr-1" /> Back to Home
        </Link>

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-xl mx-auto flex items-center justify-center mb-4 border border-emerald-500/20 transition-all duration-500 ease-in-out">
            <ShieldCheck size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors duration-500 ease-in-out">Create Account</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm transition-colors duration-500 ease-in-out">
            Join Wassila and start analyzing
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-lg mb-6 text-[10px] font-bold uppercase tracking-wider text-center transition-colors duration-500 ease-in-out">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide transition-colors duration-500 ease-in-out">
              Username
            </label>
            <div className="relative">
              <UserIcon
                className="absolute left-3 top-3 text-slate-400 dark:text-slate-500 transition-colors duration-500 ease-in-out"
                size={18}
              />
              <input
                type="text"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-background border border-slate-300 dark:border-border rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all duration-500 ease-in-out"
                placeholder="your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide transition-colors duration-500 ease-in-out">
              Email Address
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-3 text-slate-400 dark:text-slate-500 transition-colors duration-500 ease-in-out"
                size={18}
              />
              <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-background border border-slate-300 dark:border-border rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all duration-500 ease-in-out"
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
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-background border border-slate-300 dark:border-border rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all duration-500 ease-in-out"
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

          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide transition-colors duration-500 ease-in-out">
              Confirm Password
            </label>
            <div className="relative">
              <CheckCircle2
                className="absolute left-3 top-3 text-slate-400 dark:text-slate-500 transition-colors duration-500 ease-in-out"
                size={18}
              />
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-background border rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:ring-2 focus:border-transparent outline-none transition-all duration-500 ease-in-out ${
                  confirmPassword && password !== confirmPassword
                    ? "border-red-500/50 focus:ring-red-500"
                    : "border-slate-300 dark:border-border focus:ring-emerald-500"
                }`}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white transition-colors duration-500 ease-in-out focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-red-500 text-[10px] mt-1 ml-1">
                Passwords do not match
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-bold transition-all duration-500 ease-in-out active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-500 border-t border-slate-200 dark:border-border pt-6 transition-colors duration-500 ease-in-out">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-emerald-600 font-semibold hover:text-emerald-500 dark:text-emerald-500 dark:hover:text-emerald-400 transition-colors duration-500 ease-in-out"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
