import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Home,
  Clock,
  Settings,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  LayoutDashboard,
  Folder,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard size={20} />,
    },
    { label: "Projects", path: "/projects", icon: <Folder size={20} /> },
    { label: "History", path: "/history", icon: <Clock size={20} /> },
    { label: "Settings", path: "/settings", icon: <Settings size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col font-sans overflow-hidden">
      {}
      <div className="md:hidden bg-surface/80 backdrop-blur-md border-b border-border p-4 flex justify-between items-center z-50 sticky top-0">
        <div className="flex items-center gap-3 text-white font-bold text-xl tracking-tight">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/5">
            <ShieldCheck className="text-primary w-6 h-6" />
          </div>
          <span>Wassila</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-slate-300 hover:text-white transition-colors p-1"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {}
      <aside
        className={`
        fixed inset-y-0 left-0 z-[60] bg-surface border-r border-border flex flex-col h-screen transition-all duration-500 ease-in-out shadow-2xl md:shadow-none
        ${
          isMobileMenuOpen
            ? "translate-x-0 w-72"
            : "-translate-x-full md:translate-x-0"
        }
        ${isCollapsed ? "md:w-20" : "md:w-72"}
      `}
      >
        {}
        <div
          className={`p-6 flex items-center gap-3 transition-all duration-500 ${
            isCollapsed ? "justify-center" : "justify-start"
          }`}
        >
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/5 shrink-0">
            <ShieldCheck className="text-primary w-6 h-6" />
          </div>
          <span
            className={`font-bold text-2xl tracking-tight text-white whitespace-nowrap overflow-hidden transition-all duration-700 ease-in-out ${
              isCollapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[200px]"
            }`}
          >
            Wassila
          </span>
        </div>

        {}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
          <p
            className={`px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono whitespace-nowrap transition-all duration-700 ease-in-out overflow-hidden ${
              isCollapsed
                ? "opacity-0 max-h-0 mb-0 pointer-events-none"
                : "opacity-100 max-h-10 mb-2"
            }`}
          >
            Main Menu
          </p>
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);

            const activeClass = isActive
              ? isCollapsed
                ? "text-primary"
                : "bg-primary/10 text-white font-medium"
              : "text-slate-400 hover:bg-white/5 hover:text-slate-200";

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                title={isCollapsed ? item.label : ""}
                className={`flex items-center transition-all duration-500 group relative ${
                  isCollapsed
                    ? "justify-center px-0 gap-0"
                    : "justify-start px-4 gap-3"
                } py-3.5 rounded-xl ${activeClass}`}
              >
                <span
                  className={`transition-colors duration-200 ${
                    isActive
                      ? "text-primary"
                      : "text-slate-500 group-hover:text-slate-300"
                  }`}
                >
                  {item.icon}
                </span>
                <span
                  className={`text-sm whitespace-nowrap transition-all duration-700 ease-in-out overflow-hidden ${
                    isCollapsed
                      ? "opacity-0 max-w-0"
                      : "opacity-100 max-w-[200px]"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {}
        <div className="p-4 border-t border-border bg-slate-950/30">
          {}
          <div
            className={`flex items-center transition-all duration-500 ${
              isCollapsed
                ? "justify-center bg-transparent border-none p-0 gap-0"
                : "justify-start p-3 bg-white/5 border border-white/5 rounded-xl gap-3"
            } mb-3`}
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-inner shrink-0">
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <div
              className={`flex-1 min-w-0 transition-all duration-700 ease-in-out overflow-hidden ${
                isCollapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[200px]"
              }`}
            >
              <p className="text-sm font-semibold text-white truncate">
                {user?.username}
              </p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title={isCollapsed ? "Sign Out" : ""}
            className={`w-full flex items-center transition-all duration-500 justify-center ${
              isCollapsed ? "gap-0" : "gap-2"
            } px-4 py-2.5 text-xs font-bold rounded-lg
                bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white
            `}
          >
            <LogOut size={14} className="shrink-0" />
            <span
              className={`transition-all duration-700 ease-in-out overflow-hidden ${
                isCollapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[200px]"
              }`}
            >
              Sign Out
            </span>
          </button>
        </div>

        {}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-surface border border-border rounded-full items-center justify-center text-slate-400 hover:text-white shadow-lg z-50 hover:bg-slate-800 transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>

      {}
      <main
        className={`
        flex-1 overflow-y-auto min-h-screen bg-background relative transition-all duration-500 ease-in-out
        ${isCollapsed ? "md:ml-20" : "md:ml-72"}
      `}
      >
        {}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none"></div>

        <div className="max-w-[1600px] mx-auto p-4 md:pt-6 md:pb-8 md:px-8 lg:pt-6 lg:pb-10 lg:px-10 relative z-10">
          {children}
        </div>
      </main>

      {}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}

export default Layout;
