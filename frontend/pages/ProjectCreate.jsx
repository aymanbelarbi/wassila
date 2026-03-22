import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { storageService } from "../services/storageService";
import {
  FolderPlus,
  Save,
  Folder,
  Trash2,
  ArrowRight,
  FileCode,
  Plus,
  LayoutGrid,
} from "lucide-react";

function ProjectCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [projects, setProjects] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");

  const loadProjects = async () => {
    if (user) {
      try {
        const userProjects = await storageService.projects.getAll();
        setProjects(userProjects);
      } catch (err) {
        console.error("Failed to load projects", err);
      }
    }
  };

  useEffect(() => {
    loadProjects();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setError("");

    const nameRegex = /^[a-zA-Z0-9 _-]+$/;
    if (!nameRegex.test(name)) {
      setError("Invalid name. Use letters, numbers, spaces, _, -");
      return;
    }

    setLoading(true);

    try {
      await storageService.projects.add({
        name: name.trim(),
        description: "",
      });

      setName("");
      setLoading(false);
      setShowSuccess(true);
      loadProjects();
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (e) {
      setError(e.message || "Failed to create project");
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Delete project? All data will be lost.")) {
      try {
        await storageService.projects.delete(id);
        loadProjects();
      } catch (err) {
        alert("Failed to delete project");
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white transition-colors duration-500 ease-in-out">
            Projects
          </h1>
          <p className="text-slate-600 dark:text-slate-500 mt-1 text-sm lg:text-base transition-colors duration-500 ease-in-out">
            Manage your code analysis projects.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-surface p-6 rounded-xl border border-slate-200 dark:border-border sticky top-6 transition-colors duration-500 ease-in-out">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-6">
              <FolderPlus size={20} className="text-primary" />
              New Project
            </h2>

            {showSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-500 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 animate-fade-in">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                Project created successfully!
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-500 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 animate-fade-in">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-background border border-slate-300 dark:border-border rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-600 duration-500 ease-in-out"
                  placeholder="e.g. API Gateway"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="w-full px-6 py-2.5 bg-primary hover:bg-blue-600 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all duration-500 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {loading ? (
                  <>Creating...</>
                ) : (
                  <>
                    <Plus size={18} />
                    Create Project
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4 text-slate-600 dark:text-slate-400 transition-colors duration-500 ease-in-out">
            <LayoutGrid size={18} />
            <span className="text-sm font-medium uppercase tracking-wider">
              Your Projects
            </span>
            <span className="ml-auto text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500 dark:text-slate-500 transition-colors duration-500 ease-in-out">
              {projects.length}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {projects.length === 0 ? (
              <div className="col-span-full p-12 text-center border-2 border-dashed border-slate-300 dark:border-border rounded-xl bg-slate-50/50 dark:bg-surface/30 transition-colors duration-500 ease-in-out">
                <Folder size={48} className="text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-400">
                  No Projects Yet
                </h3>
                <p className="text-slate-500 text-sm mt-2">
                  Create your first project.
                </p>
              </div>
            ) : (
              projects.map((project) => {
                const latestScan = project.scans?.[0];

                return (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="bg-white dark:bg-surface p-5 rounded-xl border border-slate-200 dark:border-border hover:border-primary/50 transition-all group flex flex-col h-full relative duration-500 ease-in-out"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-500 border border-blue-200 dark:border-blue-500/10 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 transition-colors duration-500 ease-in-out">
                        <Folder size={20} />
                      </div>
                      <button
                        onClick={(e) => handleDelete(e, project.id)}
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-all duration-500 ease-in-out z-10"
                        title="Delete Project"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg mb-1 truncate group-hover:text-primary transition-colors duration-500 ease-in-out">
                      {project.name}
                    </h3>
                    <p className="text-slate-500 text-xs mb-4">
                      Created{" "}
                      {new Date(project.created_at).toLocaleDateString("en-US")}
                    </p>

                    <div className="mt-auto pt-4 border-t border-slate-200 dark:border-border flex items-center justify-between text-sm transition-colors duration-500 ease-in-out">
                      <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
                        <div
                          className="flex items-center gap-1.5"
                          title="Files"
                        >
                          <FileCode size={14} />
                          <span>{project.files_count || 0}</span>
                        </div>
                        {latestScan && (
                          <div
                            className={`font-bold ${
                              latestScan.score >= 80
                                ? "text-emerald-500"
                                : latestScan.score >= 50
                                  ? "text-amber-500"
                                  : "text-red-500"
                            }`}
                          >
                            {latestScan.score}%
                          </div>
                        )}
                      </div>
                      <div className="text-primary opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-500">
                        <ArrowRight size={18} />
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectCreate;
