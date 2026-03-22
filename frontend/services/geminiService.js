import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    this.apiKeyError = !apiKey || apiKey === "undefined" || apiKey === "";

    if (!this.apiKeyError) {
      this.ai = new GoogleGenAI({ apiKey });
    }

    this.config = {
      model: "gemini-3.1-flash-lite-preview",
      temperature: 0.1,
      maxRetries: 3, // Increased retries
    };
  }

  async reviewCode(code, staticIssues, language = "javascript", metadata = {}) {
    if (this.apiKeyError || !this.ai) {
      const error = new Error("API key not configured");
      error.userMessage =
        "API key not configured. Set VITE_GEMINI_API_KEY in .env.local";
      throw error;
    }

    if (!code || typeof code !== "string") {
      const error = new Error("Invalid input");
      error.userMessage = "Code is required for analysis";
      throw error;
    }

    try {
      const context = this.buildContext(code, staticIssues, language, metadata);
      const prompt = this.generatePrompt(context);

      const response = await this.callWithRetry(prompt);

      return this.validateAndNormalize(response, code, staticIssues);
    } catch (error) {
      return this.handleError(error);
    }
  }

  buildContext(code, issues, language, metadata = {}) {
    const framework = this.detectFramework(code, language);
    const fileSize = code.length;
    const lineCount = code.split("\n").length;

    // For large files, extract relevant context around issues
    let codeToAnalyze = code;
    if (fileSize > 8000 && issues.length > 0) {
      codeToAnalyze = this.extractRelevantContext(code, issues);
    }

    // Group issues by severity for prioritized fixing
    const groupedIssues = this.groupIssuesBySeverity(issues);

    // Enrich issues with code context
    const enrichedIssues = issues.map((issue) => ({
      ...issue,
      contextLines: this.getIssueContext(code, issue.line),
      nearbyVariables: this.extractNearbyVariables(code, issue.line),
    }));

    return {
      fullCode: codeToAnalyze,
      originalCode: code,
      issues: enrichedIssues,
      groupedIssues,
      language: this.formatLanguageName(language),
      framework,
      metadata: {
        fileSize,
        lineCount,
        issueCount: issues.length,
        criticalCount: issues.filter((i) => i.severity === "CRITICAL").length,
        highCount: issues.filter((i) => i.severity === "HIGH").length,
        ...metadata,
      },
    };
  }

  generatePrompt(context) {
    const rawPrompt = `[SEE PREVIOUS INSTRUCTIONS]`; // Placeholder for my actual logic update

    // Assemble final contents
    return [
      {
        role: "user",
        parts: [
          { text: this.generateInstructions(context) },
          { text: `SOURCE CODE TO REMEDIATE:\n\n${context.fullCode}` },
        ],
      },
    ];
  }

  generateInstructions(context) {
    const hasCritical = context.metadata.criticalCount > 0;
    const hasHigh = context.metadata.highCount > 0;

    const severityIntro = hasCritical
      ? "CRITICAL SECURITY VULNERABILITIES detected. Immediate remediation required."
      : hasHigh
        ? "HIGH severity issues found. Prioritize fixes."
        : `Found ${context.metadata.issueCount} issues to address.`;

    const issuesContext = context.issues
      .map((issue) => {
        return `Line ${issue.line} [${issue.severity}]: ${issue.ruleId} - ${issue.message}`;
      })
      .join("\n");

    const frameworkHint = context.framework
      ? `\nFramework: ${context.framework}`
      : "";

    return `You are the Wassila Security AI. 
Fix ALL vulnerabilities detected by the static scanner.

SCANNER FINDINGS:
${severityIntro}${frameworkHint}
${issuesContext}

OUTPUT FORMAT (JSON):
{
  "summary": "Remediation summary",
  "fixedCode": "Full fixed source code",
  "issueDetails": [{"line": <line>, "why": "...", "howToFix": "..."}]
}`;
  }

  async callWithRetry(prompt, attempt = 1) {
    const timeoutMs = 60000; // 60 seconds for code analysis

    try {
      const response = await Promise.race([
        this.ai.models.generateContent({
          model: this.config.model,
          contents: prompt,
          config: {
            temperature: this.config.temperature,
          },
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), timeoutMs),
        ),
      ]);

      return response;
    } catch (error) {
      console.error("Gemini API error:", error.message || error);

      if (error.message === "Request timeout") {
        const timeoutError = new Error("AI analysis timeout");
        timeoutError.userMessage =
          "AI analysis timed out after 30s. Try again or use a smaller file.";
        timeoutError.status = 408;
        timeoutError.retryable = true;
        throw timeoutError;
      }

      if (attempt < this.config.maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await this.sleep(delay);
        return this.callWithRetry(prompt, attempt + 1);
      }
      throw error;
    }
  }

  validateAndNormalize(response, originalCode, originalIssues) {
    let rawText = response.text || "{}";

    // Clean up markdown wrappers
    rawText = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "");

    let result;
    try {
      result = JSON.parse(rawText);
    } catch (parseError) {
      // Try to extract JSON from non-JSON response
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[0]);
        } catch {
          throw new Error("Invalid response format from AI");
        }
      } else {
        throw new Error("AI returned non-JSON response");
      }
    }

    // Validate required fields
    if (!result.fixedCode) {
      throw new Error("AI response missing fixedCode");
    }
    if (!result.issueDetails || !Array.isArray(result.issueDetails)) {
      result.issueDetails = [];
    }

    // Clean up fixed code
    let fixedCode = result.fixedCode;
    if (fixedCode.startsWith("```")) {
      fixedCode = fixedCode
        .replace(/^```[a-z]*\r?\n?/i, "")
        .replace(/\r?\n?```$/i, "");
    }

    // Match AI issue details with original issues
    const enrichedIssueDetails = result.issueDetails.map((aiDetail) => {
      const originalIssue = originalIssues.find(
        (oi) => oi.line === aiDetail.line || oi.ruleId === aiDetail.ruleId,
      );

      return {
        ...aiDetail,
        originalRuleId: originalIssue?.ruleId,
        originalSeverity: originalIssue?.severity,
        originalMessage: originalIssue?.message,
        // Ensure howToFix is valid
        howToFix:
          aiDetail.howToFix ||
          originalIssue?.suggestion ||
          "// Apply secure coding practices",
      };
    });

    // Add any missing issues from original scan
    const coveredLines = new Set(enrichedIssueDetails.map((d) => d.line));
    originalIssues.forEach((issue) => {
      if (!coveredLines.has(issue.line)) {
        enrichedIssueDetails.push({
          line: issue.line,
          ruleId: issue.ruleId,
          vulnerabilityType: issue.category,
          severity: issue.severity,
          why: issue.message,
          exploitScenario: issue.exploitScenario || "Potential security risk",
          howToFix: issue.suggestion,
          preventionTip: "Apply secure coding best practices",
          originalRuleId: issue.ruleId,
          originalSeverity: issue.severity,
          originalMessage: issue.message,
        });
      }
    });

    return {
      summary: result.summary || "Security issues have been addressed",
      fixedCode: fixedCode.trim(),
      securityImprovements: result.securityImprovements || [],
      issueDetails: enrichedIssueDetails,
      additionalRecommendations: result.additionalRecommendations || [],
      meta: {
        originalLineCount: originalCode.split("\n").length,
        fixedLineCount: fixedCode.split("\n").length,
        issuesFixed: enrichedIssueDetails.length,
      },
    };
  }

  handleError(error) {
    const status = error.status || (error.response && error.response.status);

    if (status === 429) {
      const apiError = new Error("Quota exceeded or rate limited");
      apiError.userMessage =
        "AI Quota Exceeded. Please check your Google AI Studio billing or try again later.";
      apiError.status = 429;
      apiError.retryable = false; // Usually not worth retrying immediately
      throw apiError;
    }

    if (status === 401 || status === 403) {
      const apiError = new Error("Authentication error");
      apiError.userMessage = "API key invalid or expired.";
      apiError.status = status;
      throw apiError;
    }

    if (status === 400) {
      const apiError = new Error("Bad request");
      apiError.userMessage = "Data too large. Try a smaller file.";
      apiError.status = 400;
      throw apiError;
    }

    if (status >= 500) {
      const apiError = new Error("Server error");
      apiError.userMessage = "Service unavailable. Try again shortly.";
      apiError.status = status;
      apiError.retryable = true;
      throw apiError;
    }

    const apiError = new Error("Analysis failed");
    apiError.userMessage = `AI failed: ${error.message || "Unknown error"}`;
    apiError.status = status;
    apiError.originalError = error;
    throw apiError;
  }

  extractRelevantContext(code, issues) {
    const lines = code.split("\n");
    const contextSize = 5;
    const relevantLines = new Set();

    // Always include lines around issues
    issues.forEach((issue) => {
      for (
        let i = issue.line - contextSize;
        i <= issue.line + contextSize;
        i++
      ) {
        if (i >= 1 && i <= lines.length) {
          relevantLines.add(i);
        }
      }
    });

    // Build context with markers
    const sortedLines = Array.from(relevantLines).sort((a, b) => a - b);
    const contextLines = [];
    let lastLine = 0;

    sortedLines.forEach((lineNum) => {
      if (lineNum > lastLine + 1 && lastLine > 0) {
        contextLines.push("// ... [code continues] ...");
      }

      const issueAtLine = issues.find((i) => i.line === lineNum);
      const marker = issueAtLine
        ? ` // ${issueAtLine.severity}: ${issueAtLine.ruleId}`
        : "";

      contextLines.push(`${lines[lineNum - 1]}${marker}`);
      lastLine = lineNum;
    });

    return contextLines.join("\n");
  }

  groupIssuesBySeverity(issues) {
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
    return issues.sort((a, b) => order[a.severity] - order[b.severity]);
  }

  getIssueContext(code, lineNumber, contextSize = 3) {
    const lines = code.split("\n");
    const start = Math.max(0, lineNumber - contextSize - 1);
    const end = Math.min(lines.length, lineNumber + contextSize);

    return lines.slice(start, end).map((line, idx) => ({
      lineNumber: start + idx + 1,
      code: line,
      isErrorLine: start + idx + 1 === lineNumber,
    }));
  }

  extractNearbyVariables(code, lineNumber, range = 5) {
    const lines = code.split("\n");
    const start = Math.max(0, lineNumber - range - 1);
    const end = Math.min(lines.length, lineNumber + range);
    const relevantCode = lines.slice(start, end).join("\n");

    const varPattern = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
    const matches = [];
    let match;

    while ((match = varPattern.exec(relevantCode)) !== null) {
      const varName = match[1];
      if (!this.isReservedWord(varName) && !matches.includes(varName)) {
        matches.push(varName);
      }
    }

    return matches.slice(0, 8);
  }

  isReservedWord(word) {
    const reserved = [
      "if",
      "else",
      "for",
      "while",
      "do",
      "switch",
      "case",
      "break",
      "continue",
      "function",
      "return",
      "var",
      "let",
      "const",
      "class",
      "extends",
      "import",
      "export",
      "default",
      "try",
      "catch",
      "finally",
      "throw",
      "new",
      "this",
      "true",
      "false",
      "null",
      "undefined",
      "async",
      "await",
      "yield",
      "def",
      "class",
      "import",
      "from",
      "as",
      "if",
      "elif",
      "else",
      "for",
      "while",
      "try",
      "except",
      "finally",
      "with",
      "lambda",
      "return",
      "pass",
      "break",
      "public",
      "private",
      "protected",
      "static",
      "function",
      "class",
      "if",
      "else",
      "elseif",
      "foreach",
      "while",
      "do",
      "try",
      "catch",
      "finally",
    ];
    return reserved.includes(word.toLowerCase());
  }

  detectFramework(code, language) {
    if (language === "javascript" || language === "js") {
      if (/\bimport\s+.*\bfrom\s+['"]react['"]/.test(code)) return "React";
      if (/\bimport\s+.*\bfrom\s+['"]vue['"]/.test(code)) return "Vue";
      if (/\bimport\s+.*\bfrom\s+['"]@angular\//.test(code)) return "Angular";
      if (/\bexpress\s*\(|\brequire\s*\(\s*['"]express['"]/.test(code))
        return "Express";
      if (/\bimport\s+.*\bfrom\s+['"]next['"]/.test(code)) return "Next.js";
    }
    if (language === "php") {
      if (/\buse\s+Illuminate\\|\\bnamespace\s+App\\/.test(code))
        return "Laravel";
      if (/\buse\s+Symfony\\/.test(code)) return "Symfony";
    }
    if (language === "python") {
      if (/\bfrom\s+django\.|\bimport\s+django\b/.test(code)) return "Django";
      if (/\bfrom\s+flask\s+import\s+Flask/.test(code)) return "Flask";
      if (/\bfrom\s+fastapi\s+import\s+FastAPI/.test(code)) return "FastAPI";
    }
    return null;
  }

  formatLanguageName(lang) {
    const map = {
      javascript: "JavaScript",
      js: "JavaScript",
      jsx: "JavaScript (JSX)",
      typescript: "TypeScript",
      ts: "TypeScript",
      tsx: "TypeScript (TSX)",
      php: "PHP",
      python: "Python",
      py: "Python",
    };
    return map[lang?.toLowerCase()] || lang || "Unknown";
  }

  escapeBackticks(text) {
    return text.replace(/`/g, "\\`");
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Batch analysis for multiple files
  async batchReview(files, onProgress) {
    const results = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Quick check if we need AI
        if (file.score === 100 || file.issues.length === 0) {
          results.push({
            fileId: file.id,
            summary: "No issues - perfect code",
            fixedCode: file.content,
            issueDetails: [],
            skipped: true,
          });
        } else {
          const result = await this.reviewCode(
            file.content,
            file.issues,
            file.language,
          );
          results.push({
            fileId: file.id,
            ...result,
          });
        }

        if (onProgress) {
          onProgress(i + 1, files.length);
        }
      } catch (error) {
        results.push({
          fileId: file.id,
          error: error.message,
          userMessage: error.userMessage,
        });
      }
    }

    return results;
  }
}

export const geminiService = new GeminiService();
