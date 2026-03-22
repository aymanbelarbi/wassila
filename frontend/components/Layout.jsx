import React, { useState, useEffect } from "react";
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
  Sun,
  Moon,
} from "lucide-react";

function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
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
    <div 
      className="flex flex-col h-screen text-slate-900 dark:text-slate-100 font-sans overflow-hidden"
      style={{ "--sidebar-width": isCollapsed ? "80px" : "288px" }}
    >
      {/* Mobile Top Header (Visible until LG) */}
      <div className="lg:hidden bg-white/80 dark:bg-surface/80 backdrop-blur-md border-b border-slate-200 dark:border-border p-4 flex justify-between items-center z-50 shrink-0 transition-colors duration-500 ease-in-out">
        <div className="flex items-center gap-3 text-slate-900 dark:text-white font-bold text-xl tracking-tight">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 transition-colors duration-500 ease-in-out">
            <ShieldCheck className="text-primary w-6 h-6" />
          </div>
          <span>Wassila</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors duration-500 ease-in-out p-2 outline-none focus:outline-none"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors duration-500 ease-in-out p-1"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar (and Mobile Overlay) */}
        <aside
          className={`
          flex flex-col bg-white dark:bg-surface border-r border-slate-200 dark:border-border h-full transition-all duration-500 ease-in-out
          ${
            isMobileMenuOpen
              ? "fixed inset-y-0 left-0 z-[60] translate-x-0 w-72"
              : "fixed lg:static inset-y-0 left-0 z-[60] -translate-x-full lg:translate-x-0"
          }
          ${isCollapsed ? "lg:w-20" : "lg:w-72"}
        `}
        >
          <div
            className={`flex items-center gap-0 transition-all duration-500 py-6 ${
              isCollapsed ? "justify-center px-1" : "justify-between px-3 lg:px-5"
            }`}
          >
            <div className="flex items-center min-w-0">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 transition-all duration-500 ease-in-out shrink-0">
                <ShieldCheck className="text-primary w-6 h-6" />
              </div>
              <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
                isCollapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100 ml-3"
              }`}>
                <span className="font-bold text-2xl tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                  Wassila
                </span>
              </div>
            </div>
            
            {!isCollapsed && (
              <button
                onClick={toggleTheme}
                className="hidden lg:flex text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors duration-500 ease-in-out p-2 outline-none focus:outline-none shrink-0"
              >
                {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            )}
          </div>

          <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
            <p
              className={`px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono whitespace-nowrap transition-all duration-500 ease-in-out overflow-hidden ${
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
                ? "bg-primary/10 text-primary dark:text-white font-medium"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200";

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
                    className={`transition-colors duration-500 ease-in-out ${
                      isActive
                        ? "text-primary"
                        : "text-slate-400 dark:text-slate-500 group-hover:text-primary dark:group-hover:text-slate-300"
                    }`}
                  >
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <span className="text-sm whitespace-nowrap animate-fade-in">
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-200 dark:border-border transition-colors duration-500 ease-in-out">
            {isCollapsed && (
              <button
                onClick={toggleTheme}
                className="w-full flex justify-center mb-3 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors duration-500 ease-in-out p-2 outline-none focus:outline-none"
              >
                {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            )}
            
            <div
              className={`flex items-center transition-all duration-500 ease-in-out ${
                isCollapsed
                  ? "justify-center bg-transparent border-none p-0 gap-0"
                  : "justify-start p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl gap-3"
              } mb-3`}
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shrink-0 transition-all duration-500 ease-in-out">
                {user?.username?.charAt(0).toUpperCase() || "U"}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0 animate-fade-in">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {user?.username || "User"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {user?.email || "user@example.com"}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              title={isCollapsed ? "Sign Out" : ""}
              className={`w-full flex items-center transition-all duration-500 justify-center ${
                isCollapsed ? "gap-0 px-0" : "gap-2 px-4"
              } py-2.5 text-xs font-bold rounded-lg
                  bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 border border-red-200 dark:border-red-500/20 hover:bg-red-600 hover:text-white dark:hover:bg-red-500 dark:hover:text-white
              `}
            >
              <LogOut size={14} className="shrink-0" />
              {!isCollapsed && <span className="animate-fade-in">Sign Out</span>}
            </button>
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-surface border border-slate-200 dark:border-border rounded-full items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all z-[70] hover:scale-110 active:scale-95 duration-500 ease-in-out outline-none focus:outline-none"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronLeft size={14} />
            )}
          </button>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto h-full relative transition-colors duration-500 ease-in-out scroll-smooth pt-0">
          <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 relative z-10 mt-0">
            {children}
          </div>
        </main>
      </div>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 dark:bg-black/50 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}

export default Layout;
