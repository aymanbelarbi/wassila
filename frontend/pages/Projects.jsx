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
  const [modalVisible, setModalVisible] = useState(false);

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

  const validateName = (name) => {
    const regex = /^(?=.*[a-zA-Z])[a-zA-Z0-9 ._-]+$/;
    return regex.test(name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setError("");

    if (!validateName(name)) {
      setError("Invalid name. Use letters, numbers, spaces, dots, _, -");
      return;
    }

    setLoading(true);

    try {
      const newProject = await storageService.projects.add({
        name: name.trim(),
        description: "",
      });

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

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();

    if (window.confirm("Delete project? All data will be lost.")) {
      try {
        await storageService.projects.delete(id);
        setProjects(projects.filter((p) => p.id !== id));
      } catch (err) {
        alert("Failed to delete project");
      }
    }
  };

  const startEdit = (e, project) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingProject(project);
    setEditName(project.name);
    setTimeout(() => setModalVisible(true), 50);
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    setError("");
    if (editingProject && editName.trim()) {
      if (!validateName(editName)) {
        setError("Invalid name. Use letters, numbers, spaces, dots, _, -");
        return;
      }
      try {
        await storageService.projects.update({
          ...editingProject,
          name: editName.trim(),
        });
        setEditingProject(null);
        loadProjects();
      } catch (e) {
        setError(e.message || "Failed to update project");
      }
    }
  };

  const isFormValid = name.trim().length > 0;

  return (
    <>
      <div className="space-y-8 animate-fade-in pb-12 relative">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors duration-500 ease-in-out">
              Projects
            </h1>
            <p className="text-slate-600 dark:text-slate-500 mt-2 transition-colors duration-500 ease-in-out">
              Manage and organize your code analysis projects.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {}
          <div className="w-full">
            <div className="bg-white dark:bg-surface p-6 rounded-2xl border border-slate-200 dark:border-border relative overflow-hidden transition-colors duration-500 ease-in-out">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                  <FolderPlus size={22} />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white transition-colors duration-500 ease-in-out">
                  Create New Project
                </h2>
              </div>

              {showSuccess && (
                <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-500 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 animate-fade-in transition-colors duration-500 ease-in-out">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  Project created successfully!
                </div>
              )}

              {error && !editingProject && (
                <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-500 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 animate-fade-in transition-colors duration-500 ease-in-out">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                  {error}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-end relative z-10"
              >
                <div className="w-full lg:flex-1">
                   <label className="block text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 transition-colors duration-500 ease-in-out">
                    Project Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 lg:py-3 bg-slate-50 dark:bg-background border border-slate-300 dark:border-border rounded-xl text-sm lg:text-base text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-600 duration-500 ease-in-out"
                    placeholder="e.g. Authentication API"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="w-full lg:w-auto">
                  <button
                    type="submit"
                    disabled={loading || !isFormValid}
                    className={`w-full px-8 py-2.5 lg:py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs lg:text-sm transition-all duration-500 ease-in-out ${
                      isFormValid
                        ? "bg-primary text-white active:scale-[0.98] hover:bg-blue-600"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
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

               <div className="mt-4 pt-4 border-t border-slate-200 dark:border-border relative z-10 transition-colors duration-500 ease-in-out">
                <p className="text-xs text-slate-500 leading-relaxed transition-colors duration-500 ease-in-out">
                  Create files and run analysis scans in isolated environments.
                </p>
              </div>
            </div>
          </div>

          {}
          <div className="w-full">
            <div className="flex items-center gap-2 mb-6 text-slate-500 dark:text-slate-400 px-1 border-b border-slate-200 dark:border-border pb-2 transition-colors duration-500 ease-in-out">
              <LayoutGrid size={18} />
               <span className="text-xs font-bold uppercase tracking-widest transition-colors duration-500 ease-in-out">
                Active Environments
              </span>
              <span className="ml-auto text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 px-2.5 py-1 rounded-md font-mono font-semibold transition-colors duration-500 ease-in-out">
                {projects.length}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
              {projects.length === 0 ? (
                <div className="col-span-full py-12 lg:py-20 px-6 lg:px-8 text-center border-2 border-dashed border-slate-300 dark:border-border rounded-2xl bg-slate-50/50 dark:bg-surface/30 flex flex-col items-center transition-colors duration-500 ease-in-out">
                  <div className="w-12 h-12 lg:w-16 lg:h-16 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-200 dark:border-border transition-colors duration-500 ease-in-out">
                    <Folder size={24} className="text-slate-400 dark:text-slate-600 lg:w-8 lg:h-8" />
                  </div>
                   <h3 className="text-base lg:text-lg font-bold text-slate-700 dark:text-slate-300 transition-colors duration-500 ease-in-out">
                    No Projects Yet
                  </h3>
                  <p className="text-slate-500 text-xs lg:text-sm mt-2 max-w-xs transition-colors duration-500 ease-in-out">
                    Initialize a project above to begin your first audit.
                  </p>
                </div>
              ) : (
                projects.map((project) => {
                  const latestScan =
                    project.scans && project.scans.length > 0
                      ? project.scans[0]
                      : null;

                  return (
                    <div
                      key={project.id}
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="cursor-pointer bg-white dark:bg-surface p-4 lg:p-5 rounded-2xl border border-slate-200 dark:border-border hover:border-primary/50 transition-all group flex flex-col h-full relative overflow-hidden duration-500 ease-in-out"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500 ease-in-out pointer-events-none"></div>

                      <div className="flex justify-between items-start mb-4 lg:mb-5 relative z-30">
                        <div className="p-2.5 lg:p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-border group-hover:text-primary group-hover:border-primary/20 transition-all duration-500 ease-in-out">
                          <Folder size={20} className="lg:w-6 lg:h-6" />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => startEdit(e, project)}
                            className="p-1.5 lg:p-2 rounded-lg transition-all duration-500 ease-in-out opacity-0 lg:opacity-0 group-hover:opacity-100 z-40 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 border border-blue-200 dark:border-blue-500/20 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white"
                            style={{ opacity: window.innerWidth < 1024 ? 1 : undefined }}
                            title="Edit Name"
                          >
                            <Edit2 size={14} className="lg:w-4 lg:h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, project.id)}
                            className="p-1.5 lg:p-2 rounded-lg transition-all duration-500 ease-in-out opacity-0 lg:opacity-0 group-hover:opacity-100 z-40 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 border border-red-200 dark:border-red-500/20 hover:bg-red-600 hover:text-white dark:hover:bg-red-500 dark:hover:text-white"
                            style={{ opacity: window.innerWidth < 1024 ? 1 : undefined }}
                            title="Delete Project"
                          >
                            <Trash2 size={14} className="lg:w-4 lg:h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="relative z-10">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base lg:text-lg mb-1 truncate group-hover:text-primary transition-colors duration-500 ease-in-out">
                          {project.name}
                        </h3>
                         <p className="text-slate-500 text-[9px] lg:text-[10px] mb-4 lg:mb-5 flex items-center gap-1.5 font-mono transition-colors duration-500 ease-in-out">
                          <Clock size={10} className="lg:w-3 lg:h-3" />{" "}
                          {new Date(project.created_at).toLocaleDateString(
                            "en-US",
                          )}
                        </p>
                      </div>

                      <div className="mt-auto pt-4 border-t border-slate-100 dark:border-border flex items-center justify-between text-xs lg:text-sm relative z-10 transition-colors duration-500 ease-in-out">
                        <div className="flex items-center gap-3 lg:gap-4">
                          <div
                            className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400"
                            title="Files"
                          >
                            <FileCode size={12} className="lg:w-3.5 lg:h-3.5" />
                             <span className="font-mono text-[10px] lg:text-xs font-semibold transition-colors duration-500 ease-in-out">
                              {project.files_count || 0}
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
                              <Shield size={12} className="lg:w-3.5 lg:h-3.5" />
                                <span className="text-[10px] lg:text-xs transition-colors duration-500 ease-in-out">
                                  {latestScan.score}%
                                </span>
                              </div>
                            ) : (
                              <div className="text-slate-400 dark:text-slate-600 text-[10px] lg:text-xs flex items-center gap-1 transition-colors duration-500 ease-in-out">
                                <Shield size={12} className="lg:w-3.5 lg:h-3.5" /> -
                              </div>
                            )}
                        </div>
                        <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-primary group-hover:text-white transition-all transform group-hover:rotate-[-45deg] duration-500 ease-in-out">
                          <ArrowRight size={14} className="lg:w-4 lg:h-4" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
      {editingProject && (
        <div
          className={`fixed inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 lg:pl-[var(--sidebar-width)] transition-all duration-500 ease-in-out ${
            modalVisible ? "opacity-100" : "opacity-0"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={`bg-white dark:bg-surface rounded-2xl border border-slate-200 dark:border-border w-full max-w-sm lg:max-w-md p-5 lg:p-6 relative z-[80] transition-all duration-500 transform ${
              modalVisible ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4"
            }`}
          >
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-lg font-bold text-slate-900 dark:text-white transition-colors duration-500 ease-in-out">Edit Project</h3>
              <button
                onClick={() => {
                  setModalVisible(false);
                  setTimeout(() => {
                    setEditingProject(null);
                    setError("");
                  }, 500);
                }}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors duration-500 ease-in-out"
              >
                <X size={20} />
              </button>
            </div>
 
             {error && editingProject && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 animate-bounce-subtle transition-colors duration-500 ease-in-out">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                {error}
              </div>
            )}
            <form onSubmit={handleUpdateProject} className="space-y-4">
              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 transition-colors duration-500 ease-in-out">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-background border border-slate-300 dark:border-border rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-600 duration-500 ease-in-out"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setModalVisible(false);
                    setTimeout(() => {
                      setEditingProject(null);
                      setError("");
                    }, 500);
                  }}
                  className="flex-1 px-4 py-3 border border-slate-300 dark:border-border text-slate-600 dark:text-slate-400 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors duration-500 ease-in-out"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-600 transition-colors duration-500 ease-in-out flex items-center justify-center gap-2"
                >
                  <Save size={18} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Projects;
