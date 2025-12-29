import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { storageService } from "../services/storageService";
import {
  Plus,
  Activity,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  Clock,
  Search,
  ChevronRight,
  TrendingUp,
  PieChart as PieIcon,
  BarChart as BarChartIcon,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [recentScans, setRecentScans] = useState([]);
  const [totalScansCount, setTotalScansCount] = useState(0);
  const [avgSecurity, setAvgSecurity] = useState(0);
  const [trendData, setTrendData] = useState([]);
  const [severityData, setSeverityData] = useState([]);

  useEffect(() => {
    if (user) {
      const allUserProjects = storageService.projects.getAll(user.id);
      allUserProjects.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setProjects(allUserProjects);

      const allScans = [];
      allUserProjects.forEach((p) => {
        const scans = storageService.scans.getAll(p.id);
        allScans.push(...scans);
      });

      allScans.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setRecentScans(allScans.slice(0, 10));
      setTotalScansCount(allScans.length);

      const latestScans = allUserProjects
        .map((p) => storageService.scans.getLatest(p.id))
        .filter((s) => s !== null);

      if (latestScans.length > 0) {
        const avg =
          latestScans.reduce((acc, s) => acc + s.score, 0) / latestScans.length;
        setAvgSecurity(Math.round(avg));
      }

      const chartData = [...allScans]
        .slice(0, 10)
        .reverse()
        .map((s) => ({
          name: new Date(s.timestamp).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          }),
          score: s.score,
          project:
            allUserProjects.find((p) => p.id === s.projectId)?.name ||
            "Unknown",
        }));
      setTrendData(chartData);

      let critical = 0,
        high = 0,
        medium = 0,
        low = 0;
      latestScans.forEach((scan) => {
        scan.issues.forEach((issue) => {
          if (issue.severity === "CRITICAL") critical++;
          else if (issue.severity === "HIGH") high++;
          else if (issue.severity === "MEDIUM") medium++;
          else low++;
        });
      });

      const distData = [
        { name: "Critical", value: critical, color: "#ef4444" },
        { name: "High", value: high, color: "#f97316" },
        { name: "Medium", value: medium, color: "#eab308" },
        { name: "Low", value: low, color: "#3b82f6" },
      ].filter((d) => d.value > 0);

      if (distData.length === 0 && latestScans.length > 0) {
        distData.push({ name: "Safe", value: 1, color: "#10b981" });
      }
      setSeverityData(distData);
    }
  }, [user]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl">
          <p className="text-slate-200 font-bold mb-1">{label}</p>
          <p className="text-primary text-sm">
            Score: <span className="font-bold">{payload[0].value}</span>
          </p>
          {payload[0].payload.project && (
            <p className="text-slate-400 text-xs mt-1">
              {payload[0].payload.project}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-500 mt-2">
            Welcome back, {user?.username}. Here's your system overview.
          </p>
        </div>
        <Link
          to="/projects"
          className="group flex bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold items-center space-x-2 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95"
        >
          <Plus
            size={18}
            className="group-hover:rotate-90 transition-transform duration-300"
          />
          <span>New Project</span>
        </Link>
      </div>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            label: "Total Projects",
            val: projects.length,
            icon: Layers,
            color: "text-blue-400",
            from: "from-blue-500/20",
            to: "to-blue-600/5",
            border: "border-blue-500/20",
          },
          {
            label: "Scans Performed",
            val: totalScansCount,
            icon: Activity,
            color: "text-violet-400",
            from: "from-violet-500/20",
            to: "to-violet-600/5",
            border: "border-violet-500/20",
          },
          {
            label: "Avg Security Score",
            val: `${avgSecurity}%`,
            icon: ShieldCheck,
            color: "text-emerald-400",
            from: "from-emerald-500/20",
            to: "to-emerald-600/5",
            border: "border-emerald-500/20",
          },
          {
            label: "Logic Health",
            val: `${avgSecurity > 0 ? Math.min(100, avgSecurity + 2) : "-"}%`,
            icon: Zap,
            color: "text-amber-400",
            from: "from-amber-500/20",
            to: "to-amber-600/5",
            border: "border-amber-500/20",
          },
        ].map((item, i) => (
          <div
            key={i}
            className={`relative overflow-hidden bg-surface p-6 rounded-2xl border ${item.border} shadow-sm group transition-transform duration-300`}
          >
            <div
              className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.from} ${item.to} rounded-bl-full opacity-50 transition-opacity group-hover:opacity-100`}
            ></div>
            <div className="relative z-10">
              <div
                className={`p-3 w-fit rounded-xl bg-slate-900/50 backdrop-blur-sm border border-white/5 ${item.color} mb-4`}
              >
                <item.icon size={24} />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-white tracking-tight">
                  {item.val}
                </h3>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">
                  {item.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {}
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity size={18} className="text-primary" />
              Security Score Trend
            </h3>
            <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded">
              Last 10 Scans
            </span>
          </div>
          <div className="h-[300px] w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e293b"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    dx={-10}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorScore)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <BarChartIcon size={48} className="mb-2 opacity-20" />
                <p className="text-sm">Not enough data to display trend.</p>
              </div>
            )}
          </div>
        </div>

        {}
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PieIcon size={18} className="text-primary" />
              Vulnerability Distribution
            </h3>
            <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded">
              Active Projects
            </span>
          </div>
          <div className="h-[300px] w-full flex items-center justify-center">
            {severityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "8px",
                      color: "#f8fafc",
                    }}
                    itemStyle={{ color: "#f8fafc" }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ paddingTop: "20px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-500">
                <PieIcon size={48} className="mb-2 opacity-20" />
                <p className="text-sm">No issues detected across projects.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {}
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-border shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-border flex justify-between items-center bg-slate-900/30">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock size={18} className="text-primary" />
              History
            </h3>
            <Link
              to="/history"
              className="text-xs font-semibold text-primary hover:text-blue-400 flex items-center gap-1 transition-colors"
            >
              View All <ChevronRight size={14} />
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[500px] p-2">
            {recentScans.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-border">
                  <Search size={24} className="opacity-40" />
                </div>
                <p className="text-sm font-medium">No activity recorded yet.</p>
                <p className="text-xs text-slate-600 mt-1">
                  Start a scan to see insights here.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentScans.map((scan) => {
                  const project = storageService.projects.getById(
                    scan.projectId
                  );
                  return (
                    <Link
                      key={scan.id}
                      to={`/projects/${scan.projectId}`}
                      className="group flex items-center justify-between p-4 hover:bg-white/[0.03] rounded-xl transition-all border border-transparent hover:border-white/5"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 border ${
                            scan.score >= 80
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : scan.score >= 50
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                              : "bg-red-500/10 text-red-500 border-red-500/20"
                          }`}
                        >
                          {scan.score}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">
                            {project?.name || "Unknown Project"}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span>
                              {new Date(scan.timestamp).toLocaleDateString()}
                            </span>
                            <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                            <span>
                              {new Date(scan.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="hidden sm:block text-right">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Issues
                          </p>
                          <p className="text-sm font-bold text-white">
                            {scan.issues.length}
                          </p>
                        </div>
                        <ArrowRight
                          size={18}
                          className="text-slate-600 group-hover:text-white transition-colors"
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {}
        <div className="bg-gradient-to-b from-primary/10 to-transparent rounded-2xl border border-primary/20 p-6 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[80px] rounded-full pointer-events-none -z-10"></div>

          <div className="mb-8">
            <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 mb-4">
              <TrendingUp size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Pro Tip</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Regularly auditing your codebase decreases technical debt by an
              average of 40%. Keep your security score above 85% for optimal
              performance.
            </p>
          </div>

          <div className="mt-auto pt-6 border-t border-white/10">
            <h4 className="text-sm font-bold text-white mb-4">Quick Actions</h4>
            <div className="space-y-3">
              <Link
                to="/projects"
                className="block w-full py-2.5 px-4 bg-surface hover:bg-white/10 border border-white/10 rounded-lg text-sm text-center font-medium transition-colors"
              >
                View All Projects
              </Link>
              <Link
                to="/settings"
                className="block w-full py-2.5 px-4 bg-transparent hover:bg-white/5 border border-transparent hover:border-white/10 rounded-lg text-sm text-center text-slate-400 hover:text-white transition-colors"
              >
                Account Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
