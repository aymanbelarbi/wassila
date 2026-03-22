import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Code2, Zap, Lock, Cpu, ArrowRight, Sun, Moon } from "lucide-react";

function Home() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background text-slate-900 dark:text-white selection:bg-primary selection:text-white overflow-x-hidden transition-colors duration-500 ease-in-out">
      {}
      <nav className="border-b border-slate-200 dark:border-border/40 backdrop-blur-md fixed w-full z-50 bg-white/80 dark:bg-background/80 transition-colors duration-500 ease-in-out">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 font-bold text-lg lg:text-xl tracking-tight text-slate-900 dark:text-white">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 transition-colors duration-500 ease-in-out">
              <ShieldCheck className="text-primary w-6 h-6" />
            </div>
            <span>Wassila</span>
          </div>
          <div className="flex items-center gap-3 lg:gap-4">
            <button
              onClick={toggleTheme}
              className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors duration-500 ease-in-out p-2 outline-none focus:outline-none"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <Link
              to="/login"
              className="text-sm font-medium text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors duration-500 ease-in-out"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-xs lg:text-sm font-bold bg-primary dark:bg-white text-white dark:text-black px-3 py-2 lg:px-4 lg:py-2 rounded-full hover:bg-blue-600 dark:hover:bg-slate-200 transition-colors duration-500 ease-in-out"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {}
      <div className="pt-28 pb-16 lg:pt-32 lg:pb-20 px-4 lg:px-6 max-w-7xl mx-auto text-center relative z-10">
        {}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/20 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 dark:bg-primary/10 text-[10px] lg:text-xs font-mono text-primary mb-6 animate-fade-in border border-primary/10 transition-colors duration-500 ease-in-out">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          v1.0.0 Release
        </div>
        <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6 lg:mb-8 bg-gradient-to-b from-slate-900 to-slate-500 dark:from-white dark:to-slate-500 bg-clip-text text-transparent animate-slide-up leading-tight lg:leading-tight transition-all duration-500 ease-in-out">
          Intelligent Code Review <br className="hidden lg:block" /> for Modern
          Teams
        </h1>
        <p
          className="text-sm sm:text-lg lg:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8 lg:mb-10 leading-relaxed animate-slide-up px-2 transition-colors duration-500 ease-in-out"
          style={{ animationDelay: "0.1s" }}
        >
          Automate your code audits with static analysis and AI-powered
          suggestions. Detect bugs, security flaws, and technical debt in
          milliseconds.
        </p>
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-3 lg:gap-4 animate-slide-up px-4"
          style={{ animationDelay: "0.2s" }}
        >
          <Link
            to="/register"
            className="w-full sm:w-auto px-6 lg:px-8 py-3 lg:py-3.5 bg-primary hover:bg-blue-600 text-white rounded-xl font-semibold transition-all duration-500 ease-in-out flex items-center justify-center gap-2 active:scale-95 text-sm lg:text-base"
          >
            Start Analyzing <ArrowRight size={18} />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-6 lg:px-8 py-3 lg:py-3.5 bg-white dark:bg-surface border border-slate-200 dark:border-border hover:bg-slate-50 dark:hover:bg-border text-slate-800 dark:text-slate-200 rounded-xl font-semibold transition-all active:scale-95 text-sm lg:text-base duration-500 ease-in-out"
          >
            I have an account
          </Link>
        </div>
      </div>

      {}
      <div className="py-12 lg:py-20 bg-slate-100 dark:bg-surface/30 border-y border-slate-200 dark:border-border/30 transition-colors duration-500 ease-in-out">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="p-6 rounded-2xl bg-white dark:bg-surface border border-slate-200 dark:border-border hover:border-primary/30 transition-all duration-500 ease-in-out">
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4 border border-blue-500/20">
                <Code2 className="text-primary" />
              </div>
              <h3 className="text-lg lg:text-xl font-bold mb-2 text-slate-900 dark:text-white transition-colors duration-500 ease-in-out">
                Static Analysis
              </h3>
              <p className="text-xs lg:text-sm lg:text-base text-slate-600 dark:text-slate-400 leading-relaxed transition-colors duration-500 ease-in-out">
                Instant feedback on code style, complexity, and potential
                runtime errors using our custom rule engine.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-surface border border-slate-200 dark:border-border hover:border-primary/30 transition-all duration-500 ease-in-out">
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4 border border-purple-500/20">
                <Cpu className="text-purple-500" />
              </div>
              <h3 className="text-lg lg:text-xl font-bold mb-2 text-slate-900 dark:text-white transition-colors duration-500 ease-in-out">
                AI Reviews
              </h3>
              <p className="text-xs lg:text-sm lg:text-base text-slate-600 dark:text-slate-400 leading-relaxed transition-colors duration-500 ease-in-out">
                Powered by Gemini models to understand context, explain issues,
                and auto-generate safe fixes.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-surface border border-slate-200 dark:border-border hover:border-primary/30 transition-all duration-500 ease-in-out sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4 border border-emerald-500/20">
                <Lock className="text-emerald-500" />
              </div>
              <h3 className="text-lg lg:text-xl font-bold mb-2 text-slate-900 dark:text-white transition-colors duration-500 ease-in-out">
                Security First
              </h3>
              <p className="text-xs lg:text-sm lg:text-base text-slate-600 dark:text-slate-400 leading-relaxed transition-colors duration-500 ease-in-out">
                Detect hardcoded secrets, injection vulnerabilities, and unsafe
                patterns before deployment.
              </p>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="py-8 text-center text-slate-500 dark:text-slate-600 text-xs lg:text-sm border-t border-slate-200 dark:border-border/20 transition-colors duration-500 ease-in-out">
        <p>&copy; 2026 Wassila. Built for excellence.</p>
      </div>
    </div>
  );
}

export default Home;
