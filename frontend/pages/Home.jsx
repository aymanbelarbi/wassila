import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Code2, Zap, Lock, Cpu, ArrowRight } from "lucide-react";

function Home() {
  return (
    <div className="min-h-screen bg-background text-white selection:bg-primary selection:text-white overflow-x-hidden">
      {}
      <nav className="border-b border-border/40 backdrop-blur-md fixed w-full z-50 bg-background/80">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 font-bold text-lg md:text-xl tracking-tight">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/5">
              <ShieldCheck className="text-primary w-6 h-6" />
            </div>
            <span>Wassila</span>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-xs md:text-sm font-bold bg-white text-black px-3 py-2 md:px-4 md:py-2 rounded-full hover:bg-slate-200 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {}
      <div className="pt-28 pb-16 md:pt-32 md:pb-20 px-4 md:px-6 max-w-7xl mx-auto text-center relative z-10">
        {}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/20 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-border/50 text-[10px] md:text-xs font-mono text-primary mb-6 animate-fade-in border border-primary/10">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          v1.0.0 Release
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6 md:mb-8 bg-gradient-to-b from-white to-slate-500 bg-clip-text text-transparent animate-slide-up leading-tight md:leading-tight">
          Intelligent Code Review <br className="hidden md:block" /> for Modern
          Teams
        </h1>
        <p
          className="text-base md:text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed animate-slide-up px-2"
          style={{ animationDelay: "0.1s" }}
        >
          Automate your code audits with static analysis and AI-powered
          suggestions. Detect bugs, security flaws, and technical debt in
          milliseconds.
        </p>
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 animate-slide-up px-4"
          style={{ animationDelay: "0.2s" }}
        >
          <Link
            to="/register"
            className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-3.5 bg-primary hover:bg-blue-600 text-white rounded-lg font-semibold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95"
          >
            Start Analyzing <ArrowRight size={18} />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-3.5 bg-surface border border-border hover:bg-border text-slate-200 rounded-lg font-semibold transition-all active:scale-95"
          >
            I have an account
          </Link>
        </div>
      </div>

      {}
      <div className="py-16 md:py-20 bg-surface/30 border-y border-border/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="p-6 rounded-2xl bg-surface border border-border hover:border-primary/30 transition-colors shadow-sm hover:shadow-md">
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4 border border-blue-500/20">
                <Code2 className="text-primary" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2 text-white">
                Static Analysis
              </h3>
              <p className="text-sm md:text-base text-slate-400 leading-relaxed">
                Instant feedback on code style, complexity, and potential
                runtime errors using our custom rule engine.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-surface border border-border hover:border-primary/30 transition-colors shadow-sm hover:shadow-md">
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4 border border-purple-500/20">
                <Cpu className="text-purple-500" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2 text-white">
                AI Reviews
              </h3>
              <p className="text-sm md:text-base text-slate-400 leading-relaxed">
                Powered by Gemini models to understand context, explain issues,
                and auto-generate safe fixes.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-surface border border-border hover:border-primary/30 transition-colors shadow-sm hover:shadow-md">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4 border border-emerald-500/20">
                <Lock className="text-emerald-500" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2 text-white">
                Security First
              </h3>
              <p className="text-sm md:text-base text-slate-400 leading-relaxed">
                Detect hardcoded secrets, injection vulnerabilities, and unsafe
                patterns before deployment.
              </p>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="py-8 text-center text-slate-600 text-xs md:text-sm border-t border-border/20">
        <p>&copy; 2026 Wassila. Built for excellence.</p>
      </div>
    </div>
  );
}

export default Home;
