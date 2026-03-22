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
    const fetchData = async () => {
      if (user) {
        try {
          const allUserProjects = await storageService.projects.getAll();
          allUserProjects.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          );
          setProjects(allUserProjects);

          // Optimization: Fetch all scans for this user in one go
          const allScans = await storageService.scans.getAll();

          allScans.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          );
          setRecentScans(allScans.slice(0, 10));
          setTotalScansCount(allScans.length);

          // Get latest scan for each project to calculate averages and distribution
          const latestScansMap = {};
          allScans.forEach((scan) => {
            if (!latestScansMap[scan.project_id]) {
              latestScansMap[scan.project_id] = scan;
            }
          });
          const latestScans = Object.values(latestScansMap);

          if (latestScans.length > 0) {
            const avg =
              latestScans.reduce((acc, s) => acc + s.score, 0) /
              latestScans.length;
            setAvgSecurity(Math.round(avg));
          } else {
            setAvgSecurity(0);
          }

          const chartData = [...allScans]
            .slice(0, 10)
            .reverse()
            .map((s) => ({
              name: new Date(s.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              }),
              score: s.score,
              project_name:
                allUserProjects.find(
                  (p) => String(p.id) === String(s.project_id),
                )?.name || "Unknown",
            }));
          setTrendData(chartData);

          let critical = 0,
            high = 0,
            medium = 0,
            low = 0;
          latestScans.forEach((scan) => {
            if (scan.issues && Array.isArray(scan.issues)) {
              scan.issues.forEach((issue) => {
                const sev = issue.severity?.toUpperCase();
                if (sev === "CRITICAL") critical++;
                else if (sev === "HIGH") high++;
                else if (sev === "MEDIUM") medium++;
                else if (sev === "LOW") low++;
              });
            }
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
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
        }
      }
    };
    fetchData();
  }, [user]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-lg border-opacity-50 transition-colors duration-500 ease-in-out">
          <p className="text-slate-900 dark:text-slate-200 font-bold mb-1 transition-colors duration-500 ease-in-out">{label}</p>
          <p className="text-primary text-sm">
            Score: <span className="font-bold">{payload[0].value}</span>
          </p>
          {payload[0].payload.project_name && (
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 transition-colors duration-500 ease-in-out">
              {payload[0].payload.project_name}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 lg:p-3 rounded-lg border-opacity-50 transition-colors duration-500 ease-in-out">
          <p className="text-slate-900 dark:text-slate-200 font-bold text-xs lg:text-sm transition-colors duration-500 ease-in-out">
            {payload[0].name}: <span style={{color: payload[0].payload.color}} className="ml-1 transition-colors">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight transition-all duration-500 ease-in-out">
            Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-500 mt-2 transition-colors duration-500 ease-in-out">
            Welcome back, {user?.username}. Here's your system overview.
          </p>
        </div>
        <Link
          to="/projects"
          className="group flex bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold items-center space-x-2 transition-all duration-500 ease-in-out active:scale-95"
        >
          <Plus
            size={18}
            className="group-hover:rotate-90 transition-transform duration-500 ease-in-out"
          />
          <span>New Project</span>
        </Link>
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {[
          {
            label: "Total Projects",
            val: projects.length,
            icon: Layers,
            color: "text-blue-500 dark:text-blue-400",
            bg: "bg-blue-500/10 dark:bg-blue-400/10",
          },
          {
            label: "Scans Performed",
            val: totalScansCount,
            icon: Activity,
            color: "text-violet-500 dark:text-violet-400",
            bg: "bg-violet-500/10 dark:bg-violet-400/10",
          },
          {
            label: "Avg Security Score",
            val: `${avgSecurity}%`,
            icon: ShieldCheck,
            color: "text-emerald-500 dark:text-emerald-400",
            bg: "bg-emerald-500/10 dark:bg-emerald-400/10",
          },
        ].map((item, i) => (
           <div
            key={i}
            className="group relative overflow-hidden bg-white dark:bg-surface p-5 lg:p-6 rounded-2xl border border-slate-200 dark:border-border transition-all duration-500 ease-in-out"
          >
            <div className="flex items-center gap-5 relative z-10">
              <div
                className={`flex-shrink-0 w-11 h-11 lg:w-12 lg:h-12 rounded-xl ${item.bg} ${item.color} flex items-center justify-center border border-white/5 transition-all duration-500 ease-in-out`}
              >
                <item.icon size={20} className="lg:w-6 lg:h-6" />
              </div>
              <div className="min-w-0">
                 <p className="text-[10px] lg:text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1 truncate transition-colors duration-500 ease-in-out">
                  {item.label}
                </p>
                 <h3 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate transition-colors duration-500 ease-in-out">
                  {item.val}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {}
        <div className="bg-white dark:bg-surface rounded-2xl border border-slate-200 dark:border-border p-4 lg:p-6 flex flex-col transition-colors duration-500 ease-in-out">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm lg:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity size={18} className="text-primary" />
              Security Score Trend
            </h3>
             <span className="text-[10px] font-mono text-slate-600 dark:text-slate-500 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded transition-colors duration-500 ease-in-out">
              Last 10 Scans
            </span>
          </div>
          <div className="h-[250px] lg:h-[300px] w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" className="outline-none focus:outline-none">
                <AreaChart data={trendData} style={{ outline: 'none' }} tabIndex={-1}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    strokeOpacity={0.15}
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
                    activeDot={{ r: 5, stroke: "#3b82f6", strokeWidth: 0, fill: "#3b82f6" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <BarChartIcon size={48} className="mb-2 opacity-20" />
                <p className="text-sm text-slate-500 dark:text-slate-400">Not enough data to display trend.</p>
              </div>
            )}
          </div>
        </div>

        {}
        <div className="bg-white dark:bg-surface rounded-2xl border border-slate-200 dark:border-border p-4 lg:p-6 flex flex-col transition-colors duration-500 ease-in-out">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm lg:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieIcon size={18} className="text-primary" />
              Vulnerability Distribution
            </h3>
             <span className="text-[10px] font-mono text-slate-600 dark:text-slate-500 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded transition-colors duration-500 ease-in-out">
              Active Projects
            </span>
          </div>
          <div className="h-[250px] lg:h-[300px] w-full relative">
            {severityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" className="outline-none focus:outline-none">
                <PieChart style={{ outline: 'none' }} tabIndex={-1}>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={window.innerWidth < 1024 ? 60 : 80}
                    outerRadius={window.innerWidth < 1024 ? 90 : 110}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    formatter={(value) => (
                      <span className="text-[10px] lg:text-xs font-semibold text-slate-600 dark:text-slate-400 mr-2 lg:mr-4 ml-1">
                        {value}
                      </span>
                    )}
                    wrapperStyle={{ paddingTop: "20px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-500 w-full h-full">
                <PieIcon size={48} className="mb-2 opacity-20" />
                <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400">
                  No issues detected across your active files.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:gap-8">
        {}
         <div className="w-full bg-white dark:bg-surface rounded-2xl border border-slate-200 dark:border-border flex flex-col overflow-hidden transition-colors duration-500 ease-in-out">
          <div className="p-4 lg:p-6 border-b border-slate-200 dark:border-border flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 transition-colors duration-500 ease-in-out">
            <h3 className="text-sm lg:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock size={18} className="text-primary" />
              History
            </h3>
            <Link
              to="/history"
              className="text-[10px] lg:text-xs font-semibold text-primary hover:text-blue-500 dark:hover:text-blue-400 flex items-center gap-1 transition-colors duration-500 ease-in-out"
            >
              View All <ChevronRight size={14} />
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[400px] lg:max-h-[500px] p-2">
            {recentScans.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 lg:py-20 text-slate-500">
                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-200 dark:border-border">
                  <Search size={24} className="opacity-40" />
                </div>
                <p className="text-xs lg:text-sm font-medium text-slate-600 dark:text-slate-400">No activity recorded yet.</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-600 mt-1">
                  Start a scan to see insights here.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentScans.map((scan) => {
                  const project = projects.find(
                    (p) => String(p.id) === String(scan.project_id),
                  );
                  return (
                    <Link
                      key={scan.id}
                      to={`/projects/${scan.project_id}?fileId=${scan.file_id}&scanId=${scan.id}`}
                       className="group flex items-center justify-between p-3 lg:p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-all duration-500 ease-in-out border border-transparent hover:border-slate-200 dark:hover:border-border"
                    >
                      <div className="flex items-center gap-3 lg:gap-4 min-w-0">
                        <div
                          className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center font-bold text-xs lg:text-sm shrink-0 border ${
                            scan.score >= 80
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20"
                              : scan.score >= 50
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20"
                                : "bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20"
                          }`}
                        >
                          {scan.score}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs lg:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors duration-500 ease-in-out">
                            {project?.name || "Unknown Project"}
                          </p>
                          <div className="flex items-center gap-1.5 lg:gap-2 text-[10px] text-slate-500 mt-0.5">
                            <span>
                              {new Date(scan.created_at).toLocaleDateString(
                                "en-US",
                              )}
                            </span>
                            <span className="w-0.5 h-0.5 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                            <span>
                              {new Date(scan.created_at).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 lg:gap-6">
                        <div className="hidden xs:block sm:block text-right">
                          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            Issues
                          </p>
                          <p className="text-xs lg:text-sm font-bold text-slate-900 dark:text-white">
                            {scan.issues?.length || 0}
                          </p>
                        </div>
                        <ArrowRight
                          size={16}
                          className="text-slate-400 dark:text-slate-600 group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-500 ease-in-out"
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>


      </div>
    </div>
  );
}

export default Dashboard;
