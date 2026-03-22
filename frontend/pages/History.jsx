import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { storageService } from "../services/storageService";
import { Link } from "react-router-dom";
import { Clock, Search, ExternalLink, FileCode } from "lucide-react";

function History() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          const allScans = await storageService.scans.getAll();
          setHistory(allScans);
        } catch (err) {
          console.error("Failed to load history", err);
        }
      }
    };
    fetchData();
  }, [user]);

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white transition-colors duration-500 ease-in-out">History</h1>
          <p className="text-slate-600 dark:text-slate-500 mt-1 text-sm lg:text-base transition-colors duration-500 ease-in-out">
            View the timeline of all performed code reviews.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-surface rounded-xl border border-slate-200 dark:border-border overflow-hidden transition-colors duration-500 ease-in-out">
        <div className="p-4 border-b border-slate-200 dark:border-border bg-slate-50/80 dark:bg-slate-900/50 flex items-center gap-4 transition-colors duration-500 ease-in-out">
          <Search size={20} className="text-slate-400 dark:text-slate-500 shrink-0 transition-colors duration-500 ease-in-out" />
          <input
            type="text"
            placeholder="Search history..."
            className="bg-transparent outline-none text-sm w-full text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 transition-colors duration-500 ease-in-out"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 uppercase font-semibold text-xs border-b border-slate-200 dark:border-border transition-colors duration-500 ease-in-out">
              <tr>
                <th className="px-4 lg:px-6 py-4">Project</th>
                <th className="px-4 lg:px-6 py-4">File</th>
                <th className="px-4 lg:px-6 py-4">Scan Date</th>
                <th className="px-4 lg:px-6 py-4">Score</th>
                <th className="px-4 lg:px-6 py-4">Issues</th>
                <th className="px-4 lg:px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-border transition-colors duration-500 ease-in-out">
              {history.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 transition-colors duration-500 ease-in-out"
                  >
                    No scan history recorded.
                  </td>
                </tr>
              ) : (
                history.map((scan) => (
                  <tr
                    key={scan.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors duration-500 ease-in-out"
                  >
                    <td className="px-4 lg:px-6 py-4 font-medium text-slate-800 dark:text-slate-200 transition-colors duration-500 ease-in-out">
                      {scan.project?.name || "Deleted Project"}
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs transition-colors duration-500 ease-in-out">
                      <div className="flex items-center gap-1.5">
                        <FileCode size={14} className="text-slate-400 dark:text-slate-500 transition-colors duration-500 ease-in-out" />
                        {scan.file?.name || "Deleted File"}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-slate-500 dark:text-slate-500 flex items-center gap-2 transition-colors duration-500 ease-in-out">
                      <Clock size={14} />
                      {new Date(scan.created_at).toLocaleString("en-US")}
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <span
                        className={`
                        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold
                        ${
                          scan.score >= 80
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500"
                            : scan.score >= 50
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-500"
                              : "bg-red-500/10 text-red-600 dark:text-red-500"
                        }
                      `}
                      >
                        {scan.score} / 100
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-slate-600 dark:text-slate-400 transition-colors duration-500 ease-in-out">
                      {scan.issues.length} Findings
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <Link
                        to={`/projects/${scan.project_id}?fileId=${scan.file_id}&scanId=${scan.id}`}
                        className="text-primary hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 text-xs font-bold uppercase tracking-wide transition-colors duration-500 ease-in-out"
                      >
                        Report <ExternalLink size={12} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default History;
