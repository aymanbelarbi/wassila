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
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">History</h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base">
            View the timeline of all performed code reviews.
          </p>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-slate-900/50 flex items-center gap-4">
          <Search size={20} className="text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Search history..."
            className="bg-transparent outline-none text-sm w-full text-white placeholder-slate-600"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-900/80 text-slate-500 uppercase font-semibold text-xs border-b border-border">
              <tr>
                <th className="px-4 md:px-6 py-4">Project</th>
                <th className="px-4 md:px-6 py-4">File</th>
                <th className="px-4 md:px-6 py-4">Scan Date</th>
                <th className="px-4 md:px-6 py-4">Score</th>
                <th className="px-4 md:px-6 py-4">Issues</th>
                <th className="px-4 md:px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {history.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No scan history recorded.
                  </td>
                </tr>
              ) : (
                history.map((scan) => (
                  <tr
                    key={scan.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-4 md:px-6 py-4 font-medium text-slate-200">
                      {scan.project?.name || "Deleted Project"}
                    </td>
                    <td className="px-4 md:px-6 py-4 text-slate-400 font-mono text-xs">
                      <div className="flex items-center gap-1.5">
                        <FileCode size={14} className="text-slate-500" />
                        {scan.file?.name || "Deleted File"}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-slate-500 flex items-center gap-2">
                      <Clock size={14} />
                      {new Date(scan.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <span
                        className={`
                        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold
                        ${
                          scan.score >= 80
                            ? "bg-emerald-500/10 text-emerald-500"
                            : scan.score >= 50
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-red-500/10 text-red-500"
                        }
                      `}
                      >
                        {scan.score} / 100
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-slate-400">
                      {scan.issues.length} Findings
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <Link
                        to={`/projects/${scan.project_id}?fileId=${scan.file_id}&scanId=${scan.id}`}
                        className="text-primary hover:text-blue-400 flex items-center gap-1 text-xs font-bold uppercase tracking-wide transition-colors"
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
