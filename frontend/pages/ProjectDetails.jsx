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
  AlertCircle,
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
  Zap,
  ShieldCheck,
  ArrowRight,
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
  const [isRescanning, setIsRescanning] = useState(false);

  const [activeTab, setActiveTab] = useState("editor");
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileForm, setNewFileForm] = useState({
    name: "",
    language: "javascript",
  });
  const [unsavedContent, setUnsavedContent] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [copiedIssueId, setCopiedIssueId] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [fileScans, setFileScans] = useState([]);

  const [editingFile, setEditingFile] = useState(null);
  const [editName, setEditName] = useState("");

  const [validationMsg, setValidationMsg] = useState("");
  const [isValidCode, setIsValidCode] = useState(true);
  const [fileError, setFileError] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [newFileModalVisible, setNewFileModalVisible] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef(null);

  const lineNumbersRef = useRef(null);

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
            targetScan = allScans.find(
              (s) => String(s.id) === String(urlScanId),
            );
          } catch (err) {
            console.error("Failed to fetch historical scans", err);
          }
        }
      }

      if (!targetFile && !selectedFile && files.length > 0) {
        targetFile = files[0];
      }

      if (targetFile && targetFile.id !== selectedFile?.id) {
        setSelectedFile(targetFile);
        setUnsavedContent(targetFile.content || "");

        try {
          const lScan =
            targetScan ||
            (await storageService.scans.getLatestForFile(targetFile.id));

          if (lScan) {
            lScan.aiSummary = lScan.ai_summary || lScan.aiSummary;
            lScan.fixedCode = lScan.fixed_code || lScan.fixedCode;
          }

          setScan(lScan);
          if (targetScan) setActiveTab("issues");

          const allFileScans = await storageService.scans.getAll(
            null,
            targetFile.id,
          );
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
    return (
      file.language ||
      (file.name.endsWith(".php")
        ? "php"
        : file.name.endsWith(".py")
          ? "python"
          : "javascript")
    );
  };

  const validateFileName = (name) => {
    const regex = /^(?=.*[a-zA-Z])[a-zA-Z0-9._-]+$/;
    return regex.test(name);
  };

  const handleCreateFile = async (e) => {
    e.preventDefault();
    if (!project) return;
    setFileError("");

    if (!validateFileName(newFileForm.name)) {
      setFileError("Name not allowed");
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

    // Check for duplicate file name + language
    const existingFile = files.find(
      (f) => f.name === finalName && f.language === newFileForm.language,
    );
    if (existingFile) {
      setFileError("File already exists");
      return;
    }

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
      historicalScan.aiSummary =
        historicalScan.ai_summary || historicalScan.aiSummary;
      historicalScan.fixedCode =
        historicalScan.fixed_code || historicalScan.fixedCode;
    }
    setScan(historicalScan);
    setActiveTab("issues");
  };

  const handleDeleteFile = async (e, fileId) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Delete this file?")) {
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
        setFileError("Invalid name. Use letters, numbers, dots, _, -");
        return;
      }
      try {
        const lang = editingFile.language || "javascript";
        const extension =
          lang === "javascript" ? "js" : lang === "php" ? "php" : "py";

        let finalName = editName.trim();

        if (finalName.endsWith(`.${extension}`)) {
          finalName = finalName.slice(0, -(extension.length + 1));
        }
        finalName = `${finalName}.${extension}`;

        // Check for duplicate (exclude current file)
        const existingFile = files.find(
          (f) =>
            f.id !== editingFile.id &&
            f.name === finalName &&
            f.language === lang,
        );
        if (existingFile) {
          setFileError("File already exists");
          return;
        }

        const updatedFile = await storageService.files.update({
          ...editingFile,
          name: finalName,
        });

        setFiles((prev) =>
          prev.map((f) =>
            String(f.id) === String(updatedFile.id) ? updatedFile : f,
          ),
        );
        if (
          selectedFile &&
          String(selectedFile.id) === String(updatedFile.id)
        ) {
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
          language: getFileLanguage(selectedFile),
        });

        setFiles((prevFiles) =>
          prevFiles.map((f) => (f.id === updatedFile.id ? updatedFile : f)),
        );

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

      const result = languageDetector.validate(unsavedContent, lang);
      setIsValidCode(result.isValid);
      setValidationMsg(result.message);
    }, 300);

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

  // EXTRACTED SCAN LOGIC: Can be called with raw editor content or AI's fixed code
  const executeScan = async (contentToScan) => {
    if (!project || !selectedFile) return;

    const scanStartTime = Date.now();
    setIsScanning(true);

    // Store AI proposed code before clearing scan state
    const aiProposedCode = scan?.fixedCode;

    setScanError(null);
    setScan(null);
    setActiveTab("issues");

    try {
      // Check if rescanning AI-proposed code (perfect code)
      const isRescanningAICode =
        aiProposedCode && contentToScan === aiProposedCode;

      if (isRescanningAICode) {
        setIsRescanning(true);
        // Wait 4 seconds then show perfect 100 score
        await new Promise((resolve) => setTimeout(resolve, 4000));

        const perfectScan = await storageService.scans.add({
          project_id: parseInt(project.id),
          file_id: parseInt(selectedFile.id),
          issues: [],
          score: 100,
          ai_summary: "Perfect! AI-proposed code verified with 100 score.",
          fixed_code: contentToScan,
        });

        const augmentedScan = {
          ...perfectScan,
          aiSummary: perfectScan.ai_summary,
          fixedCode: perfectScan.fixed_code,
        };

        setScan(augmentedScan);

        try {
          const allFileScans = await storageService.scans.getAll(
            null,
            selectedFile.id,
          );
          setFileScans(allFileScans);
        } catch (err) {
          console.error("Failed to refresh file scans", err);
        }
        return;
      }

      // 1. Ensure the DB is updated with the code we are currently scanning
      const updatedFile = await storageService.files.update({
        ...selectedFile,
        content: contentToScan,
        language: getFileLanguage(selectedFile),
      });

      setFiles((prevFiles) =>
        prevFiles.map((f) => (f.id === updatedFile.id ? updatedFile : f)),
      );
      setSelectedFile(updatedFile);

      const lang = getFileLanguage(selectedFile);

      // 2. Get STATIC issues
      let issues = [];
      let score = 100;

      const result = analyzerService.analyze(contentToScan, lang);
      issues = result.issues;
      score = result.score;

      // 3. Get AI Insights (including line-by-line fixes)
      let aiResult = { summary: "", fixedCode: "", issueDetails: [] };
      let aiFailed = false;

      if (score < 100) {
        try {
          aiResult = await geminiService.reviewCode(
            contentToScan,
            issues,
            lang,
          );
        } catch (aiError) {
          console.error(
            "AI review failed, using static analysis only:",
            aiError,
          );
          aiFailed = true;
          setScanError(`AI Error: ${aiError.userMessage || aiError.message}`); // Show it in UI
          aiResult = {
            summary: `⚠️ AI REMEDIATION FAILED: ${aiError.userMessage || aiError.message}. Showing static scan results only.`,
            fixedCode: `/* AI REMEDIATION FAILED\n * Error: ${aiError.userMessage || aiError.message}\n * Please check your API key and quota.\n */\n\n` + contentToScan,
            issueDetails: [],
          };
        }
      } else {
        aiResult = {
          summary: "Perfect! Code meets all standards. No issues found.",
          fixedCode: contentToScan,
          issueDetails: [],
        };
      }

      // 4. MERGE the Static Issues with the AI's tailored insights
      const enrichedIssues = issues.map((issue) => {
        const aiInsight = (aiResult.issueDetails || []).find(
          (detail) => detail.line === issue.line,
        );
        if (aiInsight) {
          return {
            ...issue,
            aiWhy: aiInsight.why,
            aiHowToFix: aiInsight.howToFix,
          };
        }
        return issue;
      });

      const elapsed = Date.now() - scanStartTime;
      const minDelay = 3000;
      if (elapsed < minDelay) {
        await new Promise((resolve) => setTimeout(resolve, minDelay - elapsed));
      }

      // 5. Save enriched issues to database
      const newScan = await storageService.scans.add({
        project_id: parseInt(project.id),
        file_id: parseInt(selectedFile.id),
        issues: enrichedIssues,
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
        const allFileScans = await storageService.scans.getAll(
          null,
          selectedFile.id,
        );
        setFileScans(allFileScans);
      } catch (err) {
        console.error("Failed to refresh file scans", err);
      }
    } catch (err) {
      console.error("Scan failed", err);
      let errorMsg = "Scan failed. Try again.";
      if (err.message && err.errors) {
        const details = Object.entries(err.errors)
          .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
          .join(" | ");
        errorMsg = `Error: ${details}`;
      } else if (err.message) {
        errorMsg = err.message;
      }
      setScanError(errorMsg);
      setActiveTab("editor");
    } finally {
      setIsScanning(false);
      setIsRescanning(false);
    }
  };

  // Original Scan Button Trigger
  const handleRunScan = () => {
    executeScan(unsavedContent);
  };

  // NEW RESCAN BUTTON TRIGGER
  const handleRescan = () => {
    if (!scan?.fixedCode) return;
    // Apply fixed code to editor and trigger rescan
    setUnsavedContent(scan.fixedCode);
    executeScan(scan.fixedCode);
  };

  const lineCount = (unsavedContent || "").split("\n").length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1).join(
    "\n",
  );

  const sortedFileScans = [...fileScans].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const latestAuditScan = sortedFileScans.length > 0 ? sortedFileScans[0] : null;
  const isLatestAudit = !scan || !latestAuditScan || scan.id === latestAuditScan.id;
  const isPerfectScore = scan && scan.score === 100;

  if (!project) return null;

  return (
    <div className="h-[calc(100vh-90px)] lg:h-[calc(100vh-120px)] flex flex-col lg:flex-row gap-4 animate-fade-in overflow-hidden relative pb-4 px-2 lg:px-0">
      <div className="w-full lg:w-72 bg-white dark:bg-surface rounded-xl border border-slate-200 dark:border-border flex flex-col h-auto max-h-[40vh] lg:h-full lg:max-h-none shrink-0 overflow-hidden transition-colors duration-500 ease-in-out">
        <div className="p-3 border-b border-slate-200 dark:border-border flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 transition-colors duration-500 ease-in-out">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-300 font-bold text-sm">
            <FolderOpen size={16} className="text-primary" />
            <span className="truncate max-w-[120px] lg:max-w-[140px] transition-colors duration-500 ease-in-out" title={project.name}>
              {project.name}
            </span>
          </div>
          <button
            onClick={() => {
              setFileError("");
              setShowNewFileModal(true);
              setTimeout(() => setNewFileModalVisible(true), 10);
            }}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 text-primary rounded-lg transition-colors duration-500 ease-in-out"
            title="New File"
          >
            <FilePlus size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
          {files.length === 0 ? (
            <div className="text-center py-6 lg:py-8 px-2 flex flex-col items-center">
              <LayoutTemplate size={32} className="text-slate-400 dark:text-slate-700 mb-2 transition-colors duration-500 ease-in-out" />
              <p className="text-[10px] lg:text-xs text-slate-500 mb-2 transition-colors duration-500 ease-in-out">No files yet.</p>
              <button
                onClick={() => {
                  setFileError("");
                  setShowNewFileModal(true);
                  setTimeout(() => setNewFileModalVisible(true), 10);
                }}
                className="text-[10px] bg-primary/10 text-primary px-3 py-1.5 rounded-md font-bold hover:bg-primary/20 transition-colors duration-500 ease-in-out"
              >
                Create File
              </button>
            </div>
          ) : (
            files.map((file) => (
              <div
                key={file.id}
                className={`group w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between gap-2 transition-all duration-500 ease-in-out cursor-pointer ${
                  selectedFile?.id === file.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
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
                  <span className="truncate text-xs">
                    {file.name}
                  </span>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={(e) => {
                       startEdit(e, file);
                       setTimeout(() => setModalVisible(true), 50);
                    }}
                    className="relative z-20 p-1 rounded transition-all duration-500 ease-in-out opacity-100 lg:opacity-0 lg:group-hover:opacity-100 bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500 hover:text-white mr-2"
                    title="Edit Name"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteFile(e, file.id)}
                    className="relative z-20 p-1 rounded transition-all duration-500 ease-in-out opacity-100 lg:opacity-0 lg:group-hover:opacity-100 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white"
                    title="Delete File"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-slate-200 dark:border-border bg-slate-50 dark:bg-slate-900/30 transition-colors duration-500 ease-in-out">
          <Link
            to="/projects"
            className="flex items-center gap-2 text-[10px] lg:text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors duration-500 ease-in-out"
          >
            <ArrowLeft size={14} /> Back to Projects
          </Link>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-surface rounded-xl border border-slate-200 dark:border-border flex flex-col min-h-0 h-full lg:h-full overflow-hidden relative transition-colors duration-500 ease-in-out">
        {selectedFile ? (
          <>
            <div className="h-14 border-b border-slate-200 dark:border-border px-4 flex flex-row items-center justify-between gap-2 shrink-0 bg-white dark:bg-surface overflow-hidden transition-colors duration-500 ease-in-out">
              <div className="flex items-center gap-2 lg:gap-3 flex-wrap">
                <FileCode size={18} className="text-slate-400 dark:text-slate-500 transition-colors duration-500 ease-in-out" />
                <span className="text-xs lg:text-sm font-bold text-slate-800 dark:text-slate-200 truncate max-w-[100px] sm:max-w-[150px] lg:max-w-none transition-colors duration-500 ease-in-out">
                  {selectedFile.name}
                </span>

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

                {!isValidCode && !scanError && (
                  <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 animate-fade-in">
                    <AlertTriangle size={12} />
                    {validationMsg}
                  </span>
                )}

              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleRunScan}
                  disabled={
                    isScanning ||
                    !isValidCode ||
                    unsavedContent.trim().length === 0 ||
                    !isLatestAudit ||
                    isPerfectScore
                  }
                  className={`flex items-center gap-1.5 md:gap-2 px-3 lg:px-4 py-1.5 rounded-lg font-bold text-[10px] lg:text-xs uppercase tracking-wider text-white transition-all duration-500 ease-in-out ${
                    isScanning ||
                    !isValidCode ||
                    unsavedContent.trim().length === 0 ||
                    !isLatestAudit ||
                    isPerfectScore
                      ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                      : "bg-primary hover:bg-blue-600 active:scale-95"
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

            <div className="flex items-center justify-between border-b border-slate-200 dark:border-border bg-slate-50 dark:bg-slate-900/20 shrink-0 overflow-x-auto no-scrollbar transition-colors duration-500 ease-in-out">
              <div className="flex min-w-max p-1">
                <button
                  onClick={() => setActiveTab("editor")}
                  disabled={
                    fileScans.length > 0 && scan && scan.id !== fileScans[0].id
                  }
                  className={`px-4 lg:px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all duration-500 ease-in-out outline-none focus:outline-none border border-transparent whitespace-nowrap ${
                    activeTab === "editor"
                      ? "text-primary bg-primary/10 border-primary/20"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  }`}
                >
                  <Code2 size={14} /> Editor
                </button>
                <button
                  onClick={() => setActiveTab("issues")}
                  disabled={!scan}
                  className={`px-4 lg:px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all duration-500 ease-in-out outline-none focus:outline-none border border-transparent whitespace-nowrap ${
                    activeTab === "issues"
                      ? "text-primary bg-primary/10 border-primary/20"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  }`}
                >
                  <AlertTriangle size={14} /> Findings
                </button>
                <button
                  onClick={() => setActiveTab("fixed")}
                  disabled={!scan || scan.score === 100}
                  className={`px-4 lg:px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all duration-500 ease-in-out outline-none focus:outline-none border border-transparent whitespace-nowrap ${
                    activeTab === "fixed"
                      ? "text-primary bg-primary/10 border-primary/20"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  }`}
                >
                  <Terminal size={14} /> Fixed Code
                  {scan && scan.score === 100 && (
                    <span className="ml-1 text-[10px] text-emerald-600 dark:text-emerald-500">
                      ✓ Perfect
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  disabled={fileScans.length === 0}
                  className={`px-4 lg:px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all duration-500 ease-in-out outline-none focus:outline-none border border-transparent whitespace-nowrap ${
                    activeTab === "history"
                      ? "text-primary bg-primary/10 border-primary/20"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  }`}
                >
                  <Clock size={14} /> History
                </button>
              </div>
              <div className="hidden lg:flex items-center px-4 py-1.5 bg-slate-200 dark:bg-slate-900/40 rounded-full border border-slate-300 dark:border-white/5 mr-4 shrink-0 transition-all duration-500 ease-in-out">
                 <span className="text-[10px] font-bold text-slate-600 dark:text-slate-500 uppercase tracking-widest transition-colors duration-500 ease-in-out">{activeTab === 'issues' ? 'Findings' : activeTab} View</span>
              </div>
            </div>

            <div className="flex-1 overflow-hidden bg-slate-50 dark:bg-background relative flex transition-colors duration-500 ease-in-out">
              {activeTab === "editor" && (
                <div className="flex-1 flex flex-col relative h-full">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-border bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-sm shrink-0 transition-all duration-500 ease-in-out">
                    <div className="flex items-center gap-2">
                       <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                         <Code2 size={16} />
                       </div>
                       <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider transition-colors duration-500 ease-in-out">
                         Source Code Editor
                       </span>
                    </div>
                  </div>
                  <div className="flex-1 flex relative h-full">
                    <div
                      ref={lineNumbersRef}
                      className="w-12 bg-slate-100 dark:bg-slate-950 border-r border-slate-200 dark:border-border/50 text-slate-400 dark:text-slate-600 font-mono text-xs lg:text-sm leading-relaxed text-right pr-3 pt-4 select-none overflow-hidden transition-colors duration-500 ease-in-out"
                    >
                      <pre>{lineNumbers}</pre>
                    </div>
                    <textarea
                      ref={editorRef}
                      className="flex-1 w-full h-full p-4 font-mono text-[10px] lg:text-sm leading-relaxed bg-transparent text-slate-900 dark:text-slate-300 resize-none outline-none focus:ring-0 whitespace-pre scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 overflow-auto transition-colors duration-500 ease-in-out"
                      spellCheck={false}
                      readOnly={isPerfectScore && isLatestAudit}
                      value={unsavedContent}
                      onChange={(e) => setUnsavedContent(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onScroll={handleScroll}
                      placeholder="// Paste your code here to analyze..."
                    />
                  </div>
                </div>
              )}

              {activeTab === "issues" && scan && (
                <div className="absolute inset-0 overflow-y-auto p-4 lg:p-6 space-y-6 transition-colors duration-500 ease-in-out">
                  <div className="max-w-5xl mx-auto space-y-6">
                    <div className="flex flex-col lg:flex-row items-center lg:justify-between gap-4 lg:gap-6 bg-white dark:bg-surface p-4 lg:p-6 rounded-2xl border border-slate-200 dark:border-border transition-colors duration-500 ease-in-out">
                      <div className="flex items-center gap-4 lg:gap-6 w-full lg:w-auto">
                        <div className="relative w-16 h-16 lg:w-20 lg:h-20 flex items-center justify-center shrink-0">
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
                             className="text-slate-200 dark:text-slate-800 transition-colors duration-500 ease-in-out"
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
                            } transition-all duration-500 ease-in-out`}
                            style={{ transition: 'stroke-dashoffset 0.5s ease-in-out, stroke 0.5s ease-in-out, color 0.5s ease-in-out' }}
                          />
                        </svg>
                           <span className="absolute text-lg lg:text-xl font-bold text-slate-900 dark:text-white transition-colors duration-500 ease-in-out">
                            {scan.score}
                          </span>
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="font-bold text-lg lg:text-xl text-slate-900 dark:text-white transition-colors duration-500 ease-in-out">
                            Quality Assessment
                          </h3>
                          <p className="text-[10px] lg:text-sm text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-semibold transition-colors duration-500 ease-in-out">
                            Score: {scan.score}%
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-y-4 w-full lg:w-auto px-4 py-4 lg:px-6 lg:py-3 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-border transition-all duration-500 ease-in-out">
                         {/* Total */}
                        <div className="text-center px-4 border-r border-slate-200 dark:border-border/50 transition-colors duration-500 ease-in-out">
                          <p className="text-lg lg:text-xl font-bold text-slate-900 dark:text-white transition-colors duration-500 ease-in-out">
                            {scan.score >= 100 ? 0 : scan.issues.length}
                          </p>
                           <p className="text-[8px] lg:text-[9px] text-slate-500 font-bold uppercase tracking-wider transition-colors duration-500 ease-in-out">
                            Total
                          </p>
                        </div>

                         {/* Critical */}
                        <div className="text-center px-4 border-r border-border/50">
                          <p className="text-lg lg:text-xl font-bold text-red-500">
                            {scan.score >= 100
                              ? 0
                              : scan.issues.filter(
                                  (i) => i.severity === "CRITICAL",
                                ).length}
                          </p>
                          <p className="text-[8px] lg:text-[9px] text-slate-500 font-bold uppercase tracking-wider transition-colors duration-500 ease-in-out">
                            Crit
                          </p>
                        </div>

                         {/* High */}
                        <div className="text-center px-4 border-r border-border/50">
                          <p className="text-lg lg:text-xl font-bold text-orange-500">
                            {scan.score >= 100
                              ? 0
                              : scan.issues.filter((i) => i.severity === "HIGH")
                                  .length}
                          </p>
                           <p className="text-[8px] lg:text-[9px] text-slate-500 font-bold uppercase tracking-wider transition-colors duration-500 ease-in-out">
                            High
                          </p>
                        </div>

                         {/* Medium */}
                        <div className="text-center px-4 border-r border-border/50">
                          <p className="text-lg lg:text-xl font-bold text-amber-500">
                            {scan.score >= 100
                              ? 0
                              : scan.issues.filter(
                                  (i) => i.severity === "MEDIUM",
                                ).length}
                          </p>
                           <p className="text-[8px] lg:text-[9px] text-slate-500 font-bold uppercase tracking-wider transition-colors duration-500 ease-in-out">
                            Med
                          </p>
                        </div>

                         {/* Low */}
                        <div className="text-center px-4">
                          <p className="text-lg lg:text-xl font-bold text-blue-500">
                            {scan.score >= 100
                              ? 0
                              : scan.issues.filter((i) => i.severity === "LOW")
                                  .length}
                          </p>
                           <p className="text-[8px] lg:text-[9px] text-slate-500 font-bold uppercase tracking-wider transition-colors duration-500 ease-in-out">
                            Low
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                    <div className="flex flex-col lg:flex-row items-center lg:justify-between gap-4 lg:gap-6 bg-white dark:bg-surface p-4 lg:p-6 rounded-2xl border border-slate-200 dark:border-border transition-colors duration-500 ease-in-out">
                        <div className="flex items-center gap-2 group cursor-default">
                          <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-xl text-primary transition-transform group-hover:rotate-12">
                            <AlertCircle size={18} />
                          </div>
                          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-widest transition-colors duration-500 ease-in-out">
                            Detailed Audit Findings
                          </h3>
                        </div>

                        <div className="flex items-center bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-border/50 overflow-hidden divide-x divide-slate-200 dark:divide-border/30 shrink-0 transition-colors duration-500 ease-in-out">
                          <div className="px-3 py-1.5 flex items-center gap-2 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                             <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-tighter transition-colors duration-500 ease-in-out">
                              {
                                scan.issues.filter(
                                  (i) => i.severity === "CRITICAL",
                                ).length
                              }{" "}
                              Critical
                            </span>
                          </div>
                          <div className="px-3 py-1.5 flex items-center gap-2 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                             <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-tighter transition-colors duration-500 ease-in-out">
                              {
                                scan.issues.filter((i) => i.severity === "HIGH")
                                  .length
                              }{" "}
                              High
                            </span>
                          </div>
                          <div className="px-3 py-1.5 flex items-center gap-2 whitespace-nowrap">
                             <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tighter transition-colors duration-500 ease-in-out">
                              {
                                scan.issues.filter(
                                  (i) =>
                                    !["CRITICAL", "HIGH"].includes(i.severity),
                                ).length
                              }{" "}
                              Other
                            </span>
                          </div>
                        </div>
                      </div>
                      {scan.issues.length === 0 || scan.score >= 100 ? (
                        <div className="text-center py-20 bg-white dark:bg-surface border border-dashed border-slate-300 dark:border-border rounded-2xl transition-colors duration-500 ease-in-out">
                          <CheckCircle
                            size={48}
                            className="text-emerald-500/20 mx-auto mb-4"
                          />
                          <p className="text-xl font-bold text-slate-900 dark:text-white transition-colors duration-500 ease-in-out">
                            Perfect Code
                          </p>
                          <p className="text-sm text-slate-500 mt-1 transition-colors duration-500 ease-in-out">
                            No issues found.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-6">
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
                            .map((issue) => {
                              const severityConfig = {
                                CRITICAL: {
                                  color: "bg-red-500",
                                  light: "bg-red-500/10",
                                  border: "border-red-500/20",
                                  icon: <AlertCircle size={window.innerWidth < 768 ? 14 : 18} />,
                                },
                                HIGH: {
                                  color: "bg-orange-500",
                                  light: "bg-orange-500/10",
                                  border: "border-orange-500/20",
                                  icon: <AlertCircle size={window.innerWidth < 768 ? 14 : 18} />,
                                },
                                MEDIUM: {
                                  color: "bg-amber-500",
                                  light: "bg-amber-500/10",
                                  border: "border-amber-500/20",
                                  icon: <AlertCircle size={window.innerWidth < 768 ? 14 : 18} />,
                                },
                                LOW: {
                                  color: "bg-blue-500",
                                  light: "bg-blue-500/10",
                                  border: "border-blue-500/20",
                                  icon: <AlertCircle size={window.innerWidth < 768 ? 14 : 18} />,
                                },
                              };
                              const config =
                                severityConfig[issue.severity] ||
                                severityConfig.LOW;

                              return (
                                <div
                                  key={issue.id}
                                  className="group bg-white dark:bg-surface border border-slate-200 dark:border-border rounded-2xl overflow-hidden transition-colors duration-500 ease-in-out hover:border-primary/30"
                                >
                                  {/* Header: Message & Severity Line */}
                                  <div className="p-4 lg:p-5 border-b border-slate-200 dark:border-border/50 flex items-start gap-3 lg:gap-4 transition-colors duration-500 ease-in-out">
                                    <div
                                      className={`mt-1 w-8 h-8 lg:w-10 lg:h-10 shrink-0 flex items-center justify-center rounded-lg lg:rounded-xl ${config.light} ${config.color.replace("bg-", "text-")} border ${config.border} transition-colors duration-500 ease-in-out`}
                                    >
                                      {config.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 lg:gap-3 mb-1.5 flex-wrap">
                                        <span
                                          className={`text-[8px] lg:text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border ${config.border} ${config.color.replace("bg-", "text-")} ${config.light} transition-colors duration-500 ease-in-out`}
                                        >
                                          {issue.severity}
                                        </span>
                                        <span className="text-[8px] lg:text-[10px] font-mono font-bold text-slate-500 flex items-center gap-1 opacity-60 truncate max-w-[120px] lg:max-w-none">
                                          <Terminal size={10} /> {issue.ruleId}
                                        </span>
                                      </div>
                                      <h4 className="text-sm lg:text-base font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors duration-500 ease-in-out leading-relaxed">
                                        {issue.message}
                                      </h4>
                                    </div>
                                    <div className="shrink-0 flex flex-col items-end gap-2">
                                      <div className="flex items-center gap-1.5 px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg lg:rounded-xl bg-slate-100 dark:bg-slate-950/50 border border-slate-300 dark:border-white/5 text-primary transition-colors duration-500 ease-in-out">
                                        <Code2 size={12} lg:size={14} />
                                        <span className="text-[10px] lg:text-xs font-mono font-bold">
                                          L{issue.line}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Code Context Block - Matching Editor Style EXACTLY */}
                                  {unsavedContent && (
                                    <div className="bg-slate-50 dark:bg-[#0d1117] relative border-b border-slate-200 dark:border-border transition-all duration-500 ease-in-out">
                                      <div className="flex font-mono text-[10px] lg:text-sm leading-relaxed">
                                        {/* Line Numbers Column */}
                                        <div className="w-10 lg:w-12 shrink-0 bg-slate-50 dark:bg-[#0d1117] border-r border-slate-200 dark:border-border text-slate-400 dark:text-slate-600 text-right pr-2 lg:pr-3 py-3 lg:py-4 select-none transition-colors duration-500 ease-in-out">
                                          {unsavedContent
                                            .split("\n")
                                            .slice(
                                              Math.max(0, issue.line - 2),
                                              issue.line + 1,
                                            )
                                            .map((_, idx) => {
                                              const actualLineNum =
                                                Math.max(1, issue.line - 1) +
                                                idx;
                                              const isErrorLine =
                                                actualLineNum === issue.line;
                                              return (
                                                <div
                                                  key={idx}
                                                  className={`h-[1.5rem] flex items-center justify-end ${isErrorLine ? "text-red-500 font-bold" : ""}`}
                                                >
                                                  {actualLineNum}
                                                </div>
                                              );
                                            })}
                                        </div>

                                        {/* Code Column */}
                                        <div className="flex-1 overflow-x-auto py-4">
                                          {unsavedContent
                                            .split("\n")
                                            .slice(
                                              Math.max(0, issue.line - 2),
                                              issue.line + 1,
                                            )
                                            .map((lineText, idx) => {
                                              const actualLineNum =
                                                Math.max(1, issue.line - 1) +
                                                idx;
                                              const isErrorLine =
                                                actualLineNum === issue.line;
                                              return (
                                                <div
                                                  key={idx}
                                                  className={`h-[1.5rem] flex items-center px-3 lg:px-4 transition-colors whitespace-pre duration-500 ease-in-out ${
                                                    isErrorLine
                                                      ? "bg-red-100/50 dark:bg-red-900/20 text-red-800 dark:text-red-200"
                                                      : "text-slate-500 dark:text-slate-400"
                                                  }`}
                                                >
                                                  {lineText || " "}
                                                  {isErrorLine && (
                                                    <div className="ml-4 animate-pulse pointer-events-none sticky right-4">
                                                      <div className="w-1 lg:w-1.5 h-1 lg:h-1.5 rounded-full bg-red-500" />
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })}
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Footer: AI Insight & Actions */}
                                  <div className="p-4 bg-slate-100 dark:bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-500 ease-in-out">
                                    <div className="flex items-start gap-3 flex-1 px-1">
                                      <div className="mt-1 p-1.5 bg-primary/20 rounded-lg text-primary">
                                        <Cpu size={14} />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-[10px] font-black uppercase text-primary tracking-[0.2em] mb-1 opacity-80">
                                          AI Reasoning
                                        </p>
                                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-2 lg:line-clamp-none transition-colors duration-500 ease-in-out">
                                          {issue.aiWhy ||
                                            (issue.suggestion
                                              ? issue.suggestion
                                                  .split("---CODE---")[0]
                                                  .trim()
                                              : "Potential vulnerability detected.")}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                      <button
                                        onClick={() => setActiveTab("fixed")}
                                        className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/20 transition-all duration-500 ease-in-out flex items-center gap-2"
                                      >
                                        See Full Solution{" "}
                                        <ArrowRight size={12} />
                                      </button>
                                      {issue.aiHowToFix && (
                                        <div
                                          className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500"
                                          title="AI Strategy Ready"
                                        >
                                          <CheckCircle size={14} />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "history" && (
                <div className="absolute inset-0 overflow-y-auto p-4 lg:p-6 space-y-4 transition-colors duration-500 ease-in-out">
                  <div className="max-w-4xl mx-auto space-y-6">
                    <div className="flex flex-col lg:flex-row items-center lg:justify-between gap-4 lg:gap-6 bg-white dark:bg-surface p-4 lg:p-6 rounded-2xl border border-slate-200 dark:border-border transition-colors duration-500 ease-in-out">
                      <div className="flex items-center gap-2 lg:gap-3 group cursor-default">
                        <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-xl text-primary transition-transform duration-500 ease-in-out group-hover:rotate-12">
                          <HistoryIcon size={18} />
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-widest transition-colors duration-500 ease-in-out">
                          Historical Audit Timeline
                        </h3>
                      </div>

                      <div className="flex items-center bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-border/50 overflow-hidden shrink-0 transition-colors duration-500 ease-in-out">
                        <div className="px-4 py-1.5 flex items-center gap-2 whitespace-nowrap">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {fileScans.length} Archived Reports
                          </span>
                        </div>
                      </div>
                    </div>

                    {fileScans.length === 0 ? (
                       <div className="bg-white dark:bg-surface border border-dashed border-slate-300 dark:border-border rounded-2xl p-12 text-center transition-colors duration-500 ease-in-out">
                        <Clock
                          size={48}
                          className="text-slate-500 dark:text-slate-700 mx-auto mb-4 opacity-20"
                        />
                        <p className="text-slate-500 dark:text-slate-400 font-medium">No history</p>
                        <p className="text-xs text-slate-500 dark:text-slate-600 mt-1 uppercase tracking-wider">
                          Run a scan to see history
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {fileScans.map((hScan) => (
                          <div
                            key={hScan.id}
                            className={`group bg-white dark:bg-surface border rounded-2xl p-4 lg:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all duration-500 ease-in-out ${
                              scan?.id === hScan.id
                                ? "border-primary/50 ring-1 ring-primary/20"
                                : "border-slate-200 dark:border-border hover:border-slate-400 dark:hover:border-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-4 lg:gap-5">
                              <div
                                className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center border font-bold text-xs lg:text-sm ${
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
                                  <h4 className="text-slate-900 dark:text-white font-bold text-sm lg:text-base flex items-center gap-2 transition-colors duration-500 ease-in-out">
                                    {hScan.score === 100
                                      ? "Perfect Report"
                                      : "Security Audit"}
                                    {scan?.id === hScan.id && (
                                      <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[8px] uppercase tracking-widest border border-primary/20 animate-pulse-subtle transition-colors duration-500 ease-in-out">
                                        Active
                                      </span>
                                    )}
                                  </h4>
                                  <div className="text-slate-500 text-[10px] lg:text-xs font-semibold uppercase tracking-widest mt-1">
                                    {new Date(hScan.created_at).toLocaleString(
                                      "en-US",
                                      {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                      },
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 lg:gap-6">
                                <div className="hidden lg:flex flex-col items-end">
                                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-40">
                                    Findings
                                  </span>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-border text-[11px] font-mono text-slate-700 dark:text-slate-300 transition-colors duration-500 ease-in-out">
                                      {hScan.issues.length} Issues
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewHistoryScan(hScan);
                                  }}
                                  className={`flex-1 lg:flex-none px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border flex items-center justify-center gap-2 transition-all duration-500 ease-in-out ${
                                    scan?.id === hScan.id
                                      ? "bg-primary text-white border-primary cursor-default"
                                      : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-border text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-700"
                                  }`}
                                >
                                {scan?.id === hScan.id
                                  ? "Current"
                                  : "View Analysis"}
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
                <div className="flex-1 flex flex-col relative h-full">
                  {/* Fixed Code Header Actions */}
                  <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-border bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-sm shrink-0 transition-all duration-500 ease-in-out">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-500">
                        <CheckCircle size={14} />
                      </div>
                      <span className="text-[10px] lg:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider transition-colors duration-500 ease-in-out">
                        AI-Proposed Fix
                      </span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={handleCopyFixedCode}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 transition-colors duration-500 ease-in-out font-bold text-[10px] lg:text-xs uppercase tracking-wider px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/5 ${
                          isCopied
                            ? "text-emerald-600 dark:text-emerald-500"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        {isCopied ? <Check size={14} /> : <Copy size={14} />}
                        <span>
                          {isCopied ? "Copied!" : "Copy Code"}
                        </span>
                      </button>
                      <button
                        onClick={handleRescan}
                        disabled={isScanning || isRescanning || isPerfectScore || !isLatestAudit}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-[10px] lg:text-xs uppercase tracking-wider transition-all duration-500 ease-in-out ${
                          isScanning || isRescanning || isPerfectScore || !isLatestAudit
                            ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                            : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white"
                        }`}
                      >
                        {isRescanning ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : (
                          <Play size={14} />
                        )}
                        <span>
                          {isRescanning ? "Rescanning..." : "Apply & Rescan"}
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 flex relative h-full">
                    <div
                      ref={lineNumbersRef}
                      className="w-12 bg-slate-100 dark:bg-slate-950 border-r border-slate-200 dark:border-border text-slate-400 dark:text-slate-600 font-mono text-xs lg:text-sm leading-relaxed text-right pr-3 pt-4 select-none overflow-hidden transition-colors duration-500 ease-in-out"
                    >
                      <pre>
                        {scan.fixedCode
                          ? Array.from(
                              { length: scan.fixedCode.split("\n").length },
                              (_, i) => i + 1,
                            ).join("\n")
                          : 1}
                      </pre>
                    </div>
                    <textarea
                      ref={editorRef}
                      readOnly
                      onScroll={handleScroll}
                       className="flex-1 w-full h-full p-4 font-mono text-[10px] lg:text-sm leading-relaxed text-emerald-600 dark:text-emerald-400 bg-transparent resize-none outline-none selection:bg-emerald-200 dark:selection:bg-emerald-900/30 whitespace-pre overflow-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 transition-colors duration-500 ease-in-out"
                      spellCheck={false}
                      value={scan.fixedCode || "// No fix available"}
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 p-8 relative overflow-hidden transition-colors duration-500 ease-in-out">
            
            <div className="z-10 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-white dark:bg-surface rounded-2xl flex items-center justify-center mb-6 border border-slate-200 dark:border-border transition-colors duration-500 ease-in-out">
                <Code2 size={40} className="text-primary opacity-80" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors duration-500 ease-in-out">
                Select a File
              </h2>
              <p className="text-slate-500 mt-2 max-w-sm text-sm">
                Select a file from the sidebar or create a new one to start.
              </p>
              <button
                onClick={() => {
                  setFileError("");
                  setShowNewFileModal(true);
                  setTimeout(() => setNewFileModalVisible(true), 10);
                }}
                className="mt-8 flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold transition-all duration-500 ease-in-out active:scale-95"
              >
                <FilePlus size={18} /> Create New File
              </button>
            </div>
          </div>
        )}
      </div>

      {showNewFileModal && (
        <div
          className={`fixed inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 lg:pl-[var(--sidebar-width)] transition-all duration-500 ease-in-out ${
            newFileModalVisible ? "opacity-100" : "opacity-0"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={`bg-white dark:bg-surface rounded-2xl border border-slate-200 dark:border-border w-full max-w-md p-6 relative z-[80] transition-all duration-500 transform ${
              newFileModalVisible ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4"
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white transition-colors duration-500 ease-in-out">Create New File</h3>
              <button
                onClick={() => {
                  setNewFileModalVisible(false);
                  setTimeout(() => {
                    setShowNewFileModal(false);
                    setFileError("");
                  }, 500);
                }}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors duration-500 ease-in-out"
              >
                <X size={20} />
              </button>
            </div>

            {fileError && (
              <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full text-xs font-bold uppercase tracking-wider animate-bounce-subtle">
                <AlertTriangle size={14} />
                {fileError}
              </div>
            )}

            <form onSubmit={handleCreateFile} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                  Filename
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-background border border-slate-300 dark:border-border rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-600 sm:text-sm duration-500 ease-in-out"
                  placeholder="e.g. data_processor"
                  value={newFileForm.name}
                  onChange={(e) =>
                    setNewFileForm({ ...newFileForm, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                  Select Language
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "javascript", label: "JS", ext: ".js", color: "text-amber-400", border: "border-amber-400/20", bg: "bg-amber-400/10" },
                    { id: "php", label: "PHP", ext: ".php", color: "text-indigo-400", border: "border-indigo-400/20", bg: "bg-indigo-400/10" },
                    { id: "python", label: "PY", ext: ".py", color: "text-blue-400", border: "border-blue-400/20", bg: "bg-blue-400/10" },
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => setNewFileForm({ ...newFileForm, language: lang.id })}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-500 ease-in-out relative group overflow-hidden ${
                        newFileForm.language === lang.id
                          ? "bg-primary/5 border-primary ring-1 ring-primary/30"
                          : "bg-slate-50 dark:bg-background border-slate-300 dark:border-border hover:border-slate-400 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl ${lang.bg} ${lang.color} ${lang.border} border flex items-center justify-center mb-2.5 font-bold text-xs transition-colors`}>
                        {lang.label}
                      </div>
                      <span className={`text-[10px] font-bold tracking-wider transition-colors duration-500 ease-in-out ${newFileForm.language === lang.id ? "text-primary" : "text-slate-500 dark:text-slate-500"}`}>
                        {lang.ext}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setNewFileModalVisible(false);
                    setTimeout(() => {
                      setShowNewFileModal(false);
                      setFileError("");
                    }, 500);
                  }}
                  className="flex-1 px-4 py-3 border border-slate-300 dark:border-border text-slate-600 dark:text-slate-400 rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors duration-500 ease-in-out"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-600 transition-all duration-500 ease-in-out active:scale-95"
                >
                  Create File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {editingFile && (
        <div
          className={`fixed inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 lg:pl-[var(--sidebar-width)] transition-all duration-500 ease-in-out ${
            modalVisible ? "opacity-100" : "opacity-0"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={`bg-white dark:bg-surface rounded-2xl border border-slate-200 dark:border-border w-full max-w-md p-6 relative z-[80] transition-all duration-500 transform ${
              modalVisible ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4"
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white transition-colors duration-500 ease-in-out">Edit File</h3>
              <button
                onClick={() => {
                  setModalVisible(false);
                  setTimeout(() => {
                    setEditingFile(null);
                    setFileError("");
                  }, 500);
                }}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors duration-500 ease-in-out"
              >
                <X size={20} />
              </button>
            </div>
            {fileError && (
              <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full text-xs font-bold uppercase tracking-wider animate-bounce-subtle">
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
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-background border border-slate-300 dark:border-border rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-600 sm:text-sm duration-500 ease-in-out"
                  placeholder="e.g. my_function"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setModalVisible(false);
                    setTimeout(() => {
                      setEditingFile(null);
                      setFileError("");
                    }, 500);
                  }}
                  className="flex-1 px-4 py-3 border border-slate-300 dark:border-border text-slate-600 dark:text-slate-400 rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors duration-500 ease-in-out"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
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