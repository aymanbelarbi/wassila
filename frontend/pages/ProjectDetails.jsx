import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { storageService } from "../services/storageService";
import { analyzerService } from "../services/analyzerService";
import { geminiService } from "../services/geminiService";
import { languageDetector } from "../services/languageDetector";
import {
  Play,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  Code2,
  Cpu,
  RefreshCw,
  Terminal,
  Activity,
  FilePlus,
  FileCode,
  FolderOpen,
  Save,
  Trash2,
  Copy,
  Check,
  ArrowLeft,
  LayoutTemplate,
  X,
  Edit2,
  Clock,
  History as HistoryIcon,
} from "lucide-react";

function ProjectDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [scan, setScan] = useState(null);

  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState("editor");
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileForm, setNewFileForm] = useState({
    name: "",
    language: "javascript",
  });
  const [unsavedContent, setUnsavedContent] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [fileScans, setFileScans] = useState([]);

  const [editingFile, setEditingFile] = useState(null);
  const [editName, setEditName] = useState("");

  const [validationMsg, setValidationMsg] = useState("");
  const [isValidCode, setIsValidCode] = useState(true);
  const [fileError, setFileError] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef(null);
  const lineNumbersRef = useRef(null);

  // 1. Initial Load: Project & Files
  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        try {
          const p = await storageService.projects.getById(id);
          if (p) {
            setProject(p);
            const projectFiles = await storageService.files.getAll(p.id);
            setFiles(projectFiles);
          }
        } catch (err) {
          console.error("Failed to load project details", err);
        }
      }
    };
    fetchData();
  }, [id]);

  // 2. URL Parameter Handling & Initial selection
  useEffect(() => {
    const syncSelection = async () => {
      if (!project || files.length === 0) return;

      const params = new URLSearchParams(location.search);
      const urlFileId = params.get("fileId");
      const urlScanId = params.get("scanId");

      let targetFile = null;
      let targetScan = null;

      if (urlFileId) {
        targetFile = files.find((f) => String(f.id) === String(urlFileId));
        if (targetFile && urlScanId) {
          try {
            const allScans = await storageService.scans.getAll(project.id);
            targetScan = allScans.find((s) => String(s.id) === String(urlScanId));
          } catch (err) {
            console.error("Failed to fetch historical scans", err);
          }
        }
      }

      // Default to first file if nothing is selected or specified in URL
      if (!targetFile && !selectedFile && files.length > 0) {
        targetFile = files[0];
      }

      if (targetFile && targetFile.id !== selectedFile?.id) {
        setSelectedFile(targetFile);
        setUnsavedContent(targetFile.content || "");
        
        try {
          const lScan = targetScan || await storageService.scans.getLatestForFile(targetFile.id);
          
          // Normalize AI fields for historical scans
          if (lScan) {
            lScan.aiSummary = lScan.ai_summary || lScan.aiSummary;
            lScan.fixedCode = lScan.fixed_code || lScan.fixedCode;
          }

          setScan(lScan);
          if (targetScan) setActiveTab("issues");
          
          const allFileScans = await storageService.scans.getAll(null, targetFile.id);
          setFileScans(allFileScans);
        } catch (err) {
          console.error("Failed to fetch scan data", err);
        }
      } else if (targetScan && targetScan.id !== scan?.id) {
        setScan(targetScan);
        setActiveTab("issues");
      }
    };
    syncSelection();
  }, [project, files, location.search]);

  const handleScroll = () => {
    if (editorRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = editorRef.current.scrollTop;
    }
  };

  const selectFile = async (file) => {
    setSelectedFile(file);
    setUnsavedContent(file.content || "");
    
    // Update URL to match selected file
    navigate(`/projects/${id}?fileId=${file.id}`, { replace: true });

    try {
      const latestScan = await storageService.scans.getLatestForFile(file.id);
      
      if (latestScan) {
        latestScan.aiSummary = latestScan.ai_summary || latestScan.aiSummary;
        latestScan.fixedCode = latestScan.fixed_code || latestScan.fixedCode;
      }

      setScan(latestScan);
      
      const allFileScans = await storageService.scans.getAll(null, file.id);
      setFileScans(allFileScans);
      
      setActiveTab(latestScan ? "issues" : "editor");
    } catch (err) {
      console.error("Failed to fetch file scans", err);
    }
    setIsCopied(false);
  };

  const getFileLanguage = (file) => {
    if (!file) return "javascript";
    return file.language || 
      (file.name.endsWith('.php') ? 'php' : 
       file.name.endsWith('.py') ? 'python' : 'javascript');
  };

  const validateFileName = (name) => {
    // Allows letters, numbers, dots, underscores, hyphens
    // but REQUIRES at least one letter to prevent purely numeric names
    const regex = /^(?=.*[a-zA-Z])[a-zA-Z0-9._-]+$/;
    return regex.test(name);
  };

  const handleCreateFile = async (e) => {
    e.preventDefault();
    if (!project) return;
    setFileError("");

    if (!validateFileName(newFileForm.name)) {
      setFileError("Name must contain at least one letter and can only include letters, numbers, dots, underscores, and hyphens");
      return;
    }

    const extension =
      newFileForm.language === "javascript"
        ? "js"
        : newFileForm.language === "php"
        ? "php"
        : "py";

    const finalName = newFileForm.name.endsWith(`.${extension}`)
      ? newFileForm.name
      : `${newFileForm.name}.${extension}`;

    try {
      const newFile = await storageService.files.add(project.id, {
        name: finalName,
        content: "",
        language: newFileForm.language,
      });
      setFiles([...files, newFile]);
      setShowNewFileModal(false);
      setNewFileForm({ name: "", language: "javascript" });
      selectFile(newFile);
    } catch (e) {
      setFileError(e.message || "Failed to create file");
    }
  };

  const handleViewHistoryScan = (historicalScan) => {
    if (historicalScan) {
      historicalScan.aiSummary = historicalScan.ai_summary || historicalScan.aiSummary;
      historicalScan.fixedCode = historicalScan.fixed_code || historicalScan.fixedCode;
    }
    setScan(historicalScan);
    setActiveTab("issues");
  };

  const handleDeleteFile = async (e, fileId) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this file?")) {
      try {
        await storageService.files.delete(fileId);
        setFiles((prev) => prev.filter((f) => String(f.id) !== String(fileId)));
        
        if (selectedFile && String(selectedFile.id) === String(fileId)) {
          setSelectedFile(null);
          setScan(null);
          setFileScans([]);
          setUnsavedContent("");
          setScanError(null);
          setValidationMsg("");
          
          // Clear URL parameters
          navigate(`/projects/${id}`, { replace: true });
        }
      } catch (err) {
        alert("Failed to delete file");
      }
    }
  };

  const startEdit = (e, file) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingFile(file);
    setFileError("");

    const nameWithoutExt =
      file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
    setEditName(nameWithoutExt);
  };

  const handleUpdateFile = async (e) => {
    e.preventDefault();
    setFileError("");
    if (editingFile && editName.trim()) {
      if (!validateFileName(editName)) {
        setFileError("Name must contain at least one letter and can only include letters, numbers, dots, underscores, and hyphens");
        return;
      }
      try {
        const lang = editingFile.language || "javascript";
        const extension =
          lang === "javascript"
            ? "js"
            : lang === "php"
            ? "php"
            : "py";

        let finalName = editName.trim();

        if (finalName.endsWith(`.${extension}`)) {
          finalName = finalName.slice(0, -(extension.length + 1));
        }
        finalName = `${finalName}.${extension}`;

        const updatedFile = await storageService.files.update({ 
          ...editingFile, 
          name: finalName 
        });

        setFiles((prev) => prev.map((f) => (String(f.id) === String(updatedFile.id) ? updatedFile : f)));
        if (selectedFile && String(selectedFile.id) === String(updatedFile.id)) {
          setSelectedFile(updatedFile);
        }

        setEditingFile(null);
      } catch (e) {
        setFileError(e.message || "Failed to update file");
      }
    }
  };

  const handleSaveContent = async () => {
    if (selectedFile && !isSaving) {
      setIsSaving(true);
      try {
        const updatedFile = await storageService.files.update({ 
          ...selectedFile, 
          content: unsavedContent,
          language: getFileLanguage(selectedFile)
        });
        
        // Update the files list so navigation picks up the new content
        setFiles((prevFiles) =>
          prevFiles.map((f) => (f.id === updatedFile.id ? updatedFile : f))
        );
        
        // Update current selected file
        setSelectedFile(updatedFile);
        setUnsavedContent(updatedFile.content || "");
      } catch (err) {
        console.error("Failed to save file content", err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleCopyFixedCode = () => {
    if (scan?.fixedCode) {
      navigator.clipboard.writeText(scan.fixedCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!selectedFile) return;
      const lang = getFileLanguage(selectedFile);
         
      const result = languageDetector.validate(
        unsavedContent,
        lang
      );
      setIsValidCode(result.isValid);
      setValidationMsg(result.message);
    }, 50);

    return () => clearTimeout(timer);
  }, [unsavedContent, selectedFile]);

  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue =
        unsavedContent.substring(0, start) +
        "  " +
        unsavedContent.substring(end);
      setUnsavedContent(newValue);
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.selectionStart = editorRef.current.selectionEnd =
            start + 2;
        }
      }, 0);
    }
  };

  const handleRunScan = async () => {
    if (!project || !selectedFile) return;
    
    // 1. Start timer and UI state immediately
    const scanStartTime = Date.now();
    setIsScanning(true);
    setScanError(null);
    setScan(null);
    setActiveTab("issues");

    try {
      // 2. Perform save and local analysis
      await handleSaveContent();
      
      const lang = getFileLanguage(selectedFile);

      const { issues, score } = analyzerService.analyze(
        unsavedContent,
        lang
      );

      // 3. Determine if AI is needed
      let aiResult = { summary: "", fixedCode: "" };
      
      if (score < 100) {
        // Slow path: Call Gemini
        aiResult = await geminiService.reviewCode(
          unsavedContent,
          issues,
          lang
        );
      } else {
        // Fast path: Perfect score
        aiResult = {
          summary: "Perfect! Your code meets all security and style standards. No issues were found during this analysis.",
          fixedCode: unsavedContent
        };
      }

      // 4. Constant 3-second wait UX (including save/ai time)
      const elapsed = Date.now() - scanStartTime;
      const minDelay = 3000;
      if (elapsed < minDelay) {
        await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
      }

      // 5. Persist the scan
      const newScan = await storageService.scans.add({
        project_id: parseInt(project.id),
        file_id: parseInt(selectedFile.id),
        issues: issues,
        score: Math.round(score),
        ai_summary: aiResult.summary,
        fixed_code: aiResult.fixedCode,
      });
      
      const augmentedScan = {
        ...newScan,
        aiSummary: newScan.ai_summary || aiResult.summary,
        fixedCode: newScan.fixed_code || aiResult.fixedCode,
      };

      setScan(augmentedScan);
      
      try {
        const allFileScans = await storageService.scans.getAll(null, selectedFile.id);
        setFileScans(allFileScans);
      } catch (err) {
        console.error("Failed to refresh file scans", err);
      }
    } catch (err) {
      console.error("Scan failed", err);
      let errorMsg = "Scanning failed. Please try again.";
      if (err.message && err.errors) {
        const details = Object.entries(err.errors)
          .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
          .join(" | ");
        errorMsg = `Validation Error: ${details}`;
      } else if (err.message) {
        errorMsg = err.message;
      }
      setScanError(errorMsg);
      setActiveTab("editor");
    } finally {
      setIsScanning(false);
    }
  };

  const lineCount = (unsavedContent || "").split("\n").length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1).join(
    "\n"
  );

  if (!project) return null; // Silent return instead of "Loading project..." for better UX

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-4 animate-fade-in overflow-hidden relative pb-4">
      {}
      <div className="w-full md:w-64 bg-surface rounded-xl border border-border flex flex-col h-48 md:h-full shrink-0 shadow-lg overflow-hidden">
        <div className="p-3 border-b border-border flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
            <FolderOpen size={16} className="text-primary" />
            <span className="truncate max-w-[120px]" title={project.name}>
              {project.name}
            </span>
          </div>
          <button
            onClick={() => {
              setFileError("");
              setShowNewFileModal(true);
            }}
            className="p-1.5 hover:bg-white/10 text-primary rounded-lg transition-colors"
            title="New File"
          >
            <FilePlus size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {files.length === 0 ? (
            <div className="text-center py-8 px-2 flex flex-col items-center">
              <LayoutTemplate size={32} className="text-slate-700 mb-2" />
              <p className="text-xs text-slate-500 mb-2">No files yet.</p>
              <button
                onClick={() => {
                  setFileError("");
                  setShowNewFileModal(true);
                }}
                className="text-[10px] bg-primary/10 text-primary px-3 py-1.5 rounded-md font-bold hover:bg-primary/20 transition-colors"
              >
                Create File
              </button>
            </div>
          ) : (
            files.map((file) => (
              <div
                key={file.id}
                className={`group w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between gap-2 transition-all cursor-pointer ${
                  selectedFile?.id === file.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                }`}
                onClick={() => selectFile(file)}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileCode
                    size={14}
                    className={
                      selectedFile?.id === file.id
                        ? "text-primary"
                        : "text-slate-600"
                    }
                  />
                  <span className="truncate text-xs md:text-sm">
                    {file.name}
                  </span>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={(e) => startEdit(e, file)}
                    className="relative z-20 p-1 rounded opacity-0 group-hover:opacity-100 transition-all bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500 hover:text-white mr-2"
                    title="Edit Name"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteFile(e, file.id)}
                    className="relative z-20 p-1 rounded opacity-0 group-hover:opacity-100 transition-all bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white"
                    title="Delete File"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-border bg-slate-900/30">
          <Link
            to="/projects"
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} /> Back to Projects
          </Link>
        </div>
      </div>

      {}
      <div className="flex-1 bg-surface rounded-xl border border-border flex flex-col h-[500px] md:h-full overflow-hidden relative shadow-lg">
        {selectedFile ? (
          <>
            {}
            <div className="h-auto md:h-14 border-b border-border px-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 bg-surface">
              <div className={`flex items-center gap-3 pt-3 md:pt-0`}>
                <FileCode size={18} className="text-slate-500" />
                <span className="text-sm font-bold text-slate-200 truncate">
                  {selectedFile.name}
                </span>

                {}
                {scanError && (
                  <span
                    className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 animate-fade-in truncate max-w-[300px]"
                    title={scanError}
                  >
                    <AlertTriangle size={12} />
                    {scanError}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setScanError(null);
                      }}
                      className="hover:text-red-300 ml-1"
                    >
                      <X size={10} />
                    </button>
                  </span>
                )}

                {}
                {!isValidCode && !scanError && (
                  <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 animate-fade-in">
                    <AlertTriangle size={12} />
                    {validationMsg}
                  </span>
                )}

                {(selectedFile.content || "") !== unsavedContent && isValidCode && (
                  <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    Unsaved
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 pb-3 md:pb-0">
                <button
                  onClick={handleSaveContent}
                  disabled={
                    isSaving || (selectedFile.content || "") === unsavedContent || !isValidCode
                  }
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                    isSaving
                      ? "bg-emerald-500/20 text-emerald-500 cursor-wait"
                      : (selectedFile.content || "") !== unsavedContent && isValidCode
                      ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                      : "text-slate-600 bg-transparent cursor-not-allowed opacity-50"
                  }`}
                >
                  {isSaving ? (
                    <RefreshCw className="animate-spin" size={14} />
                  ) : (
                    <Save size={14} />
                  )}
                  <span>{isSaving ? "Saving..." : "Save"}</span>
                </button>
                <div className="h-4 w-px bg-border mx-1"></div>
                <button
                  onClick={handleRunScan}
                  disabled={
                    isScanning ||
                    !isValidCode ||
                    unsavedContent.trim().length === 0
                  }
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider text-white shadow-lg transition-all ${
                    isScanning ||
                    !isValidCode ||
                    unsavedContent.trim().length === 0
                      ? "bg-slate-700 cursor-not-allowed text-slate-400"
                      : "bg-primary hover:bg-blue-600 shadow-blue-900/20 active:scale-95"
                  }`}
                >
                  {isScanning ? (
                    <RefreshCw className="animate-spin" size={14} />
                  ) : (
                    <Play size={14} />
                  )}
                  <span>{isScanning ? "Analyzing..." : "Run Scan"}</span>
                </button>
              </div>
            </div>

            {}
            <div className="flex items-center justify-between border-b border-border bg-slate-950/30 shrink-0 pr-2">
              <div className="flex">
                <button
                  onClick={() => setActiveTab("editor")}
                  className={`px-5 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all relative ${
                    activeTab === "editor"
                      ? "text-primary bg-surface border-t-2 border-primary"
                      : "text-slate-500 hover:text-slate-300 hover:bg-white/5 border-t-2 border-transparent"
                  }`}
                >
                  <Code2 size={14} /> Editor
                </button>
                <button
                  onClick={() => setActiveTab("issues")}
                  disabled={!scan}
                  className={`px-5 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all relative ${
                    activeTab === "issues"
                      ? "text-primary bg-surface border-t-2 border-primary"
                      : "text-slate-500 hover:text-slate-300 hover:bg-white/5 border-t-2 border-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  }`}
                >
                  <AlertTriangle size={14} /> Findings
                </button>
                <button
                  onClick={() => setActiveTab("fixed")}
                  disabled={!scan || scan.score === 100}
                  className={`px-5 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all relative ${
                    activeTab === "fixed"
                      ? "text-primary bg-surface border-t-2 border-primary"
                      : "text-slate-500 hover:text-slate-300 hover:bg-white/5 border-t-2 border-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  }`}
                >
                  <Terminal size={14} /> Fixed Code
                  {scan && scan.score === 100 && (
                    <span className="ml-1 text-[10px] text-emerald-500">
                      ✓ Perfect
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  disabled={fileScans.length === 0}
                  className={`px-5 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all relative ${
                    activeTab === "history"
                      ? "text-primary bg-surface border-t-2 border-primary"
                      : "text-slate-500 hover:text-slate-300 hover:bg-white/5 border-t-2 border-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  }`}
                >
                  <Clock size={14} /> History
                </button>
              </div>
              {activeTab === "fixed" && (
                <button
                  onClick={handleCopyFixedCode}
                  className={`flex items-center gap-1.5 mr-2 transition-colors font-bold text-xs uppercase tracking-wider px-3 py-1.5 rounded hover:bg-white/5 ${
                    isCopied
                      ? "text-emerald-500"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {isCopied ? <Check size={14} /> : <Copy size={14} />}
                  <span className="hidden md:inline">
                    {isCopied ? "Copied!" : "Copy"}
                  </span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-hidden bg-[#0d1117] relative flex">
              {activeTab === "editor" && (
                <div className="flex-1 flex relative h-full">
                  <div
                    ref={lineNumbersRef}
                    className="w-12 bg-[#0d1117] border-r border-border/50 text-slate-600 font-mono text-xs md:text-sm leading-relaxed text-right pr-3 pt-4 select-none overflow-hidden"
                  >
                    <pre>{lineNumbers}</pre>
                  </div>
                  <textarea
                    ref={editorRef}
                    className="flex-1 w-full h-full p-4 font-mono text-xs md:text-sm leading-relaxed bg-[#0d1117] text-slate-300 resize-none outline-none focus:ring-0 whitespace-pre scrollbar-thin scrollbar-thumb-slate-700 overflow-auto"
                    spellCheck={false}
                    value={unsavedContent}
                    onChange={(e) => setUnsavedContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onScroll={handleScroll}
                    placeholder="// Paste your code here to analyze..."
                  />
                </div>
              )}

              {activeTab === "issues" && scan && (
                <div className="absolute inset-0 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-950">
                  <div className="max-w-5xl mx-auto space-y-6">
                    {}
                    <div className="flex flex-col md:flex-row items-center gap-6 bg-surface p-6 rounded-xl border border-border">
                      <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                        {}
                        <svg
                          className="w-full h-full transform -rotate-90"
                          viewBox="0 0 80 80"
                        >
                          <circle
                            cx="40"
                            cy="40"
                            r="36"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className="text-slate-800"
                          />
                          <circle
                            cx="40"
                            cy="40"
                            r="36"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={227}
                            strokeDashoffset={227 - (227 * scan.score) / 100}
                            className={`${
                              scan.score >= 80
                                ? "text-emerald-500"
                                : scan.score >= 50
                                ? "text-amber-500"
                                : "text-red-500"
                            } transition-all duration-1000 ease-out`}
                          />
                        </svg>
                        <span className="absolute text-xl font-bold text-white">
                          {scan.score}
                        </span>
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h3 className="font-bold text-xl text-white">
                          Quality Assessment
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">
                          Scan completed on{" "}
                          {new Date(scan.created_at).toLocaleString("en-US")}
                        </p>
                      </div>
                      <div className="flex gap-8 px-6 py-2 bg-slate-900 rounded-lg border border-border">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-white">
                            {scan.issues.length}
                          </p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            Total
                          </p>
                        </div>
                        <div className="w-px bg-border"></div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-500">
                            {
                              scan.issues.filter(
                                (i) => i.severity === "CRITICAL"
                              ).length
                            }
                          </p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            Critical
                          </p>
                        </div>
                      </div>
                    </div>

                    {}
                    <div className="bg-gradient-to-br from-primary/10 to-transparent p-6 rounded-xl border border-primary/20 relative overflow-hidden">
                      <div className="flex items-start gap-4 relative z-10">
                        <div className="p-2 bg-primary/20 rounded-lg shrink-0 text-primary">
                          <Cpu size={24} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-white mb-2 text-sm uppercase tracking-wider">
                            AI Code Review Summary
                          </h4>
                          <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                            {scan.aiSummary}
                          </div>
                        </div>
                      </div>
                    </div>

                    {}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-300 pb-2 border-b border-border text-xs uppercase tracking-widest flex items-center gap-2">
                          <AlertTriangle size={14} /> Detailed Findings (
                          {scan.issues.length})
                        </h3>
                        {scan.issues.length > 0 && (
                          <div className="flex gap-2 text-xs font-bold">
                            <span className="text-red-500">
                              Critical:{" "}
                              {
                                scan.issues.filter(
                                  (i) => i.severity === "CRITICAL"
                                ).length
                              }
                            </span>
                            <span className="text-orange-500">
                              High:{" "}
                              {
                                scan.issues.filter((i) => i.severity === "HIGH")
                                  .length
                              }
                            </span>
                            <span className="text-blue-500">
                              Other:{" "}
                              {
                                scan.issues.filter(
                                  (i) =>
                                    !["CRITICAL", "HIGH"].includes(i.severity)
                                ).length
                              }
                            </span>
                          </div>
                        )}
                      </div>
                      {scan.issues.length === 0 ? (
                        <div className="text-center py-16 text-slate-500 border border-dashed border-border rounded-xl">
                          <CheckCircle
                            size={48}
                            className="text-emerald-500/20 mx-auto mb-4"
                          />
                          <p className="text-lg font-bold text-slate-400">
                            Clean Code Detected
                          </p>
                          <p className="text-sm">
                            No issues found in this scan.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {scan.issues
                            .sort((a, b) => {
                              const severityOrder = {
                                CRITICAL: 0,
                                HIGH: 1,
                                MEDIUM: 2,
                                LOW: 3,
                                INFO: 4,
                              };
                              return (
                                (severityOrder[a.severity] || 5) -
                                (severityOrder[b.severity] || 5)
                              );
                            })
                            .map((issue) => (
                              <div
                                key={issue.id}
                                className="bg-surface border border-border rounded-lg p-5 hover:border-slate-600 transition-colors group"
                              >
                                <div className="flex items-start gap-4">
                                  <div
                                    className={`mt-0.5 p-1.5 rounded-md bg-opacity-10 flex-shrink-0 ${
                                      issue.severity === "CRITICAL"
                                        ? "bg-red-500 text-red-500"
                                        : issue.severity === "HIGH"
                                        ? "bg-orange-500 text-orange-500"
                                        : issue.severity === "MEDIUM"
                                        ? "bg-yellow-500 text-yellow-500"
                                        : "bg-blue-500 text-blue-500"
                                    }`}
                                  >
                                    <ShieldAlert size={18} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-4">
                                      <div className="flex-1">
                                        <h4 className="text-sm font-semibold text-slate-200">
                                          {issue.message}
                                        </h4>
                                        <p className="text-xs text-slate-500 mt-1">
                                          {issue.ruleId}
                                        </p>
                                      </div>
                                      <span className="text-xs font-mono font-bold text-slate-500 shrink-0 bg-slate-900 px-2 py-1 rounded">
                                        Line {issue.line}
                                      </span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 mt-3 mb-3">
                                      <span
                                        className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${
                                          issue.severity === "CRITICAL"
                                            ? "bg-red-500/10 text-red-500 border-red-500/20"
                                            : issue.severity === "HIGH"
                                            ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
                                            : issue.severity === "MEDIUM"
                                            ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                                            : "bg-slate-800 text-slate-400 border-slate-700"
                                        }`}
                                      >
                                        {issue.severity}
                                      </span>
                                      <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                        {issue.category}
                                      </span>
                                    </div>

                                    {issue.suggestion && (
                                      <div className="space-y-3 mt-3">
                                        {unsavedContent && (
                                          <div className="bg-slate-950 p-3 rounded border border-red-500/30">
                                            <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">
                                              Problematic Code:
                                            </p>
                                            <div className="bg-[#0d1117] p-2 rounded overflow-x-auto">
                                              <pre className="text-xs text-slate-300 font-mono">
                                                {unsavedContent
                                                  .split("\n")
                                                  .slice(
                                                    Math.max(0, issue.line - 3),
                                                    issue.line + 2
                                                  )
                                                  .map((line, idx) => {
                                                    const actualLineNum =
                                                      issue.line - 3 + idx + 1;
                                                    const isProblematic =
                                                      actualLineNum ===
                                                      issue.line;
                                                    return (
                                                      <div
                                                        key={idx}
                                                        className={`${
                                                          isProblematic
                                                            ? "bg-red-900/30 text-red-300"
                                                            : "text-slate-400"
                                                        }`}
                                                      >
                                                        <span className="text-slate-600 mr-3">
                                                          {actualLineNum}
                                                        </span>
                                                        {line}
                                                      </div>
                                                    );
                                                  })}
                                              </pre>
                                            </div>
                                          </div>
                                        )}

                                        {(() => {
                                          const parts =
                                            issue.suggestion.split(
                                              "---CODE---"
                                            );
                                          const description =
                                            parts.length > 1
                                              ? parts[0]
                                              : issue.suggestion.split("\n")[0];
                                          const fixCode =
                                            parts.length > 1
                                              ? parts[1].trim()
                                              : issue.suggestion
                                                  .split("\n")
                                                  .slice(1)
                                                  .join("\n")
                                                  .trim();

                                          return (
                                            <>
                                              <div className="bg-slate-900 p-3 rounded border border-slate-800">
                                                <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2">
                                                  Why This is a Problem:
                                                </p>
                                                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                                                  {description.trim()}
                                                </p>
                                              </div>

                                              <div className="bg-[#0d1117] p-3 rounded border border-emerald-500/30">
                                                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                                                  How to Fix It:
                                                </p>
                                                <div className="bg-[#0d1117] p-2 rounded overflow-x-auto">
                                                  <pre className="text-xs text-emerald-300 font-mono leading-relaxed">
                                                    {fixCode ? (
                                                      fixCode
                                                        .split("\n")
                                                        .map((line, idx) => (
                                                          <div
                                                            key={idx}
                                                            className="flex"
                                                          >
                                                            <span className="text-slate-600 mr-3 select-none w-4 text-right shrink-0">
                                                              {idx + 1}
                                                            </span>
                                                            <span className="whitespace-pre">
                                                              {line}
                                                            </span>
                                                          </div>
                                                        ))
                                                    ) : (
                                                      <span className="text-slate-500 italic">
                                                        No code example
                                                        available.
                                                      </span>
                                                    )}
                                                  </pre>
                                                </div>
                                              </div>
                                            </>
                                          );
                                        })()}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "history" && (
                <div className="absolute inset-0 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-950">
                  <div className="max-w-4xl mx-auto space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <HistoryIcon size={16} className="text-primary" />
                        Scan History for {selectedFile.name}
                      </h3>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">
                        {fileScans.length} reports found
                      </span>
                    </div>

                    {fileScans.length === 0 ? (
                      <div className="bg-surface border border-border rounded-xl p-12 text-center">
                        <Clock size={48} className="text-slate-700 mx-auto mb-4 opacity-20" />
                        <p className="text-slate-400 font-medium">No scan history available for this file</p>
                        <p className="text-xs text-slate-600 mt-1 uppercase tracking-wider">Run your first scan to see history here</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {fileScans.map((hScan) => (
                          <div
                            key={hScan.id}
                            className={`group bg-surface border border-border p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-primary/30 ${
                              scan?.id === hScan.id ? "ring-1 ring-primary/50 border-primary/50" : ""
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center border font-bold text-sm ${
                                  hScan.score >= 80
                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                    : hScan.score >= 50
                                    ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                    : "bg-red-500/10 text-red-500 border-red-500/20"
                                }`}
                              >
                                {hScan.score}
                              </div>
                              <div>
                                <div className="text-white font-bold text-sm flex items-center gap-2">
                                  {hScan.score === 100 ? "Perfect Report" : "Security Analysis"}
                                  {scan?.id === hScan.id && (
                                    <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase tracking-tighter">Current</span>
                                  )}
                                </div>
                                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                                  {new Date(hScan.created_at).toLocaleString("en-US", {
                                    dateStyle: 'medium',
                                    timeStyle: 'short'
                                  })}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="hidden md:flex flex-col items-end mr-2">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Issues Found</span>
                                <span className="text-xs text-white font-mono">{hScan.issues.length}</span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewHistoryScan(hScan);
                                }}
                                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                                  scan?.id === hScan.id
                                    ? "bg-primary/20 text-primary border-primary/30 cursor-default"
                                    : "bg-surface border-border text-slate-400 hover:text-white hover:border-slate-600 active:scale-95"
                                }`}
                              >
                                {scan?.id === hScan.id ? "Viewing" : "View Report"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "fixed" && scan && (
                <div className="flex-1 flex relative h-full">
                  <div className="w-12 bg-[#0d1117] border-r border-border text-slate-600 font-mono text-xs md:text-sm leading-relaxed text-right pr-3 pt-4 select-none overflow-hidden">
                    <pre>
                      {scan.fixedCode
                        ? Array.from(
                            { length: scan.fixedCode.split("\n").length },
                            (_, i) => i + 1
                          ).join("\n")
                        : 1}
                    </pre>
                  </div>
                  {}
                  <textarea
                    readOnly
                    className="flex-1 w-full h-full p-4 font-mono text-xs md:text-sm leading-relaxed text-emerald-400 bg-transparent resize-none outline-none selection:bg-emerald-900/30 whitespace-pre overflow-auto scrollbar-thin scrollbar-thumb-slate-700"
                    spellCheck={false}
                    value={scan.fixedCode || "// No fix available"}
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-background text-slate-400 p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
            <div className="z-10 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-surface rounded-2xl flex items-center justify-center mb-6 border border-border shadow-2xl">
                <Code2 size={40} className="text-primary opacity-80" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Select a File
              </h2>
              <p className="text-slate-500 mt-2 max-w-sm text-sm">
                Choose a file from the explorer or create a new one to begin
                static analysis and AI review.
              </p>
              <button
                onClick={() => {
                  setFileError("");
                  setShowNewFileModal(true);
                }}
                className="mt-8 flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-95"
              >
                <FilePlus size={18} /> Create New File
              </button>
            </div>
          </div>
        )}
      </div>

      {}
      {showNewFileModal && (
        <div className="fixed inset-0 md:left-72 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface rounded-2xl border border-border w-full max-w-md p-6 shadow-2xl relative z-[80]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Create New File</h3>
              <button
                onClick={() => {
                  setShowNewFileModal(false);
                  setFileError("");
                }}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {fileError && (
              <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full text-xs font-bold uppercase tracking-wider animate-fade-in">
                <AlertTriangle size={14} />
                {fileError}
              </div>
            )}

            <form onSubmit={handleCreateFile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Filename
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-slate-600"
                  placeholder="e.g. data_processor"
                  value={newFileForm.name}
                  onChange={(e) =>
                    setNewFileForm({ ...newFileForm, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Language
                </label>
                <select
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all appearance-none"
                  value={newFileForm.language}
                  onChange={(e) =>
                    setNewFileForm({ ...newFileForm, language: e.target.value })
                  }
                >
                  <option value="javascript">JavaScript (.js)</option>
                  <option value="php">PHP (.php)</option>
                  <option value="python">Python (.py)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-6 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewFileModal(false);
                    setFileError("");
                  }}
                  className="flex-1 px-4 py-3 border border-border text-slate-400 rounded-xl font-bold hover:bg-white/5 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-900/20"
                >
                  Create File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {editingFile && (
        <div
          className="fixed inset-0 md:left-72 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-surface rounded-2xl border border-border w-full max-w-md p-6 shadow-2xl relative z-[80]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Edit File</h3>
              <button
                onClick={() => {
                  setEditingFile(null);
                  setFileError("");
                }}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {fileError && (
              <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full text-xs font-bold uppercase tracking-wider animate-fade-in">
                <AlertTriangle size={14} />
                {fileError}
              </div>
            )}
            <form onSubmit={handleUpdateFile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  File Name
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
                    setEditingFile(null);
                    setFileError("");
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

export default ProjectDetails;
