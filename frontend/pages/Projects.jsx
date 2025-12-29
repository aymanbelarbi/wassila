import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { storageService } from "../services/storageService";
import {
  FolderPlus,
  Folder,
  Trash2,
  ArrowRight,
  FileCode,
  Plus,
  LayoutGrid,
  Clock,
  Shield,
  Edit2,
  X,
  Save,
} from "lucide-react";

function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [projects, setProjects] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");

  const [editingProject, setEditingProject] = useState(null);
  const [editName, setEditName] = useState("");

  const loadProjects = () => {
    if (user) {
      const userProjects = storageService.projects.getAll(user.id);
      setProjects(
        userProjects.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    }
  };

  useEffect(() => {
    loadProjects();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setError("");
    setLoading(true);

    try {
      const newProject = {
        id: crypto.randomUUID(),
        ownerId: user.id,
        name: name.trim(),
        description: "",
        createdAt: new Date().toISOString(),
      };

      storageService.projects.add(newProject);
      setShowSuccess(true);

      setTimeout(() => {
        setName("");
        setLoading(false);
        setShowSuccess(false);

        navigate(`/projects/${newProject.id}`);
      }, 1000);
    } catch (e) {
      setError(e.message || "Failed to create project");
      setLoading(false);
    }
  };

  const handleDelete = (e, id) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      window.confirm(
        "Are you sure you want to delete this project? All files and scans will be lost."
      )
    ) {
      storageService.projects.delete(id);

      setProjects(projects.filter((p) => p.id !== id));
    }
  };

  const startEdit = (e, project) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingProject(project);
    setEditName(project.name);
  };

  const handleUpdateProject = (e) => {
    e.preventDefault();
    setError("");
    if (editingProject && editName.trim()) {
      try {
        const updatedProject = { ...editingProject, name: editName.trim() };
        storageService.projects.update(updatedProject);
        setEditingProject(null);
        loadProjects();
      } catch (e) {
        setError(e.message || "Failed to update project");
      }
    }
  };

  const isFormValid = name.trim().length > 0;

  return (
    <div className="space-y-8 animate-fade-in pb-12 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Projects
          </h1>
          <p className="text-slate-500 mt-2">
            Manage and organize your code analysis projects.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {}
        <div className="w-full">
          <div className="bg-surface p-6 rounded-2xl border border-border shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                <FolderPlus size={22} />
              </div>
              <h2 className="text-lg font-bold text-white">
                Create New Project
              </h2>
            </div>

            {showSuccess && (
              <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg text-xs font-semibold flex items-center gap-2 animate-fade-in">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                Project created successfully!
              </div>
            )}

            {error && !editingProject && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs font-semibold flex items-center gap-2 animate-fade-in">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="flex flex-col md:flex-row gap-4 items-end relative z-10"
            >
              <div className="w-full md:flex-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-slate-600 shadow-inner"
                  placeholder="e.g. Authentication API"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="w-full md:w-auto">
                <button
                  type="submit"
                  disabled={loading || !isFormValid}
                  className={`w-full md:w-auto px-8 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${
                    isFormValid
                      ? "bg-primary hover:bg-blue-600 text-white shadow-lg shadow-blue-900/20 active:scale-[0.98]"
                      : "bg-slate-800 text-slate-500 cursor-not-allowed shadow-none"
                  }`}
                >
                  {loading ? (
                    "Creating..."
                  ) : (
                    <>
                      <Plus size={18} /> Create Project
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-4 pt-4 border-t border-border relative z-10">
              <p className="text-xs text-slate-500 leading-relaxed">
                Projects are isolated environments where you can create files
                and run static analysis scans independently.
              </p>
            </div>
          </div>
        </div>

        {}
        <div className="w-full">
          <div className="flex items-center gap-2 mb-6 text-slate-400 px-1 border-b border-border pb-2">
            <LayoutGrid size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">
              Active Environments
            </span>
            <span className="ml-auto text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md font-mono font-semibold">
              {projects.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.length === 0 ? (
              <div className="col-span-full py-20 px-8 text-center border-2 border-dashed border-border rounded-2xl bg-surface/30 flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-border">
                  <Folder size={32} className="text-slate-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-300">
                  No Projects Yet
                </h3>
                <p className="text-slate-500 text-sm mt-2 max-w-xs">
                  Initialize a project above to begin your first audit.
                </p>
              </div>
            ) : (
              projects.map((project) => {
                const files = storageService.files.getAll(project.id);
                const latestScan = storageService.scans.getLatest(project.id);

                return (
                  <div
                    key={project.id}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="cursor-pointer bg-surface p-5 rounded-2xl border border-border hover:border-primary/50 transition-all hover:shadow-xl group flex flex-col h-full relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors pointer-events-none"></div>

                    <div className="flex justify-between items-start mb-5 relative z-30">
                      <div className="p-3 bg-slate-900 rounded-xl text-slate-400 border border-border group-hover:text-primary group-hover:border-primary/20 transition-all">
                        <Folder size={24} />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => startEdit(e, project)}
                          className="p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 z-40 bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500 hover:text-white"
                          title="Edit Name"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, project.id)}
                          className="p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 z-40 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white"
                          title="Delete Project"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="relative z-10">
                      <h3 className="font-bold text-slate-200 text-lg mb-1 truncate group-hover:text-primary transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-slate-500 text-[10px] mb-5 flex items-center gap-1.5 font-mono">
                        <Clock size={12} />{" "}
                        {new Date(project.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="mt-auto pt-4 border-t border-border flex items-center justify-between text-sm relative z-10">
                      <div className="flex items-center gap-4">
                        <div
                          className="flex items-center gap-1.5 text-slate-400"
                          title="Files"
                        >
                          <FileCode size={14} />
                          <span className="font-mono text-xs font-semibold">
                            {files.length}
                          </span>
                        </div>
                        {latestScan ? (
                          <div
                            className={`flex items-center gap-1.5 font-bold ${
                              latestScan.score >= 80
                                ? "text-emerald-500"
                                : latestScan.score >= 50
                                ? "text-amber-500"
                                : "text-red-500"
                            }`}
                          >
                            <Shield size={14} />
                            <span className="text-xs">{latestScan.score}%</span>
                          </div>
                        ) : (
                          <div className="text-slate-600 text-xs flex items-center gap-1">
                            <Shield size={14} /> -
                          </div>
                        )}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 group-hover:bg-primary group-hover:text-white transition-all transform group-hover:rotate-[-45deg]">
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {}
      {editingProject && (
        <div
          className="fixed inset-0 md:left-72 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-surface rounded-2xl border border-border w-full max-w-md p-6 shadow-2xl relative z-[80]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Edit Project</h3>
              <button
                onClick={() => {
                  setEditingProject(null);
                  setError("");
                }}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {error && editingProject && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs font-semibold flex items-center gap-2 animate-fade-in">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                {error}
              </div>
            )}
            <form onSubmit={handleUpdateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-slate-600"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingProject(null);
                    setError("");
                  }}
                  className="flex-1 px-4 py-3 border border-border text-slate-400 rounded-xl font-bold hover:bg-white/5 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                >
                  <Save size={18} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Projects;
