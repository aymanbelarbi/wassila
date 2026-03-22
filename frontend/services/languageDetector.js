export const languageDetector = {
  patterns: {
    javascript: [
      /(?<!(private|public|protected)\s+)(const|let|var)\s+\w+\s*=/,
      /^\s*import\s+.*from/m,
      /^\s*export\s+default/m,
      /(\)|[a-zA-Z0-9_])\s*=>/,
      /console\.\w+/,
      /<[A-Z]\w+/,
      /document\.get/,
      /window\./,
      /React\./,
      /\b(useEffect|useState)\b/,
      /className=/,
      /function\s+\w+\s*\(/,
      /\basync\s+function\b/,
      /===|!==/,
      /\btypeof\s+/,
      /\.(forEach|map|filter|reduce)\b/,
      /\bnew\s+(Promise|Map|Set|Date|Error|Object|Array)\b/,
      /\bawait\s+/,
      /JSON\.(parse|stringify)/,
    ],
    python: [
      /def\s+\w+\s*\(.*:/,
      /^\s*(import\s+\w+|from\s+\w+\s+import)/m,
      /print\s*\(.*\)/,
      /if\s+__name__\s*==\s*['"]__main__['"]:/,
      /class\s+\w+(\(.*\))?:/,
      /self\./,
      /\belif\b/,
      /\b(None|True|False)\b/,
      /\b(range|len|enumerate|zip|sum|min|max)\(/,
      /\blambda\s+\w+:/,
      /\byield\b/,
      /\bwith\s+\w+\s+as\s+\w+:/,
      /f'[^']*'|f"[^"]*"/,
      /\[[^\]]*\bfor\b[^\]]*\bin\b[^\]]*\]/,
      /^\s*#\s+/m,
      /^[a-z_][a-z0-9_]*\s*=\s*[^>]/im,
      /"""[\s\S]*?"""|'''[\s\S]*?'''/,
      /except\s+\w+(\s+as\s+\w+)?\s*:/,
    ],
    php: [
      /<\?php/i,
      /<\?(?!\?)/,
      /\$[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/,
      /declare\s*\(\s*strict_types\s*=\s*1\s*\)\s*;/,
      /(^|[;{}])\s*\$\w+\s*=/m,
      /\becho\s+/,
      /\$\w+->/,
      /\bnamespace\s+/,
      /^\s*use\s+[\\\w]+;$/m,
      /(public|private|protected)\s+(static\s+)?(function|array|string|int|float|bool|object|iterable|callable|void|\?\w+|\\)/,
      /function\s+\w+\s*\([^)]*\$\w+.*\)\s*\{/,
      /function\s+\w+\s*\(\s*\)\s*(:\s*\w+)?\s*\{/,
      /\$this->/,
      /\barray\s*\(.*\)/,
      /\[\s*['"]\w+['"]\s*=>/,
      /\b(var_dump|die|exit)\s*\(/,
      /\b(require_once|include_once)\b/,
      /PDO::/,
      /\$pdo->/,
      /::class\b/,
      /\b(password_verify|password_hash)\b/,
    ],
  },

  matchesLanguage: (content, language) => {
    const patterns = languageDetector.patterns[language];
    if (!patterns) return false;

    for (let pattern of patterns) {
      if (pattern.test(content)) {
        return true;
      }
    }

    return false;
  },

  validate: (content, expectedLanguage) => {
    if (content.length < 5) return { isValid: true, message: "" };

    const symbols = /[\{\}\(\)\[\];=<>\/\*\+\-\|&!:@\$]/g;
    const symbolCount = (content.match(symbols) || []).length;
    const symbolDensity = symbolCount / content.length;

    const normalize = (lang) => {
      if (["javascript", "js", "jsx", "typescript", "ts", "tsx"].includes(lang))
        return "javascript";
      if (["python", "py"].includes(lang)) return "python";
      if (["php"].includes(lang)) return "php";
      return "unknown";
    };

    const targetLang = normalize(
      expectedLanguage ? expectedLanguage.toLowerCase() : "javascript",
    );

    if (targetLang === "unknown") return { isValid: true, message: "" };

    // Strong indicators that are UNIQUE to each language (no shared syntax)
    const strongIndicators = {
      php: [/<\?php/i, /declare\s*\(\s*strict_types\s*=\s*1\s*\)\s*;/],
      javascript: [
        /import\s+.*from/m,
        /export\s+default/m,
        /\b(useEffect|useState)\b/,
        /className=/,
        /console\.(log|error|warn|info)/,
        /\bdocument\.(getElementById|querySelector)/,
        /\bwindow\./,
      ],
      python: [
        /if\s+__name__\s*==\s*['"]__main__['"]:/,
        /\belif\b/,
        /def\s+\w+\s*\(.*->\s*\w+\s*\)\s*:/,
        /\bself\./,
      ],
    };

    const otherLangs = ["javascript", "python", "php"].filter(
      (l) => l !== targetLang,
    );

    // Check if the TARGET language has its own strong indicators
    const hasTargetStrong = (strongIndicators[targetLang] || []).some((p) =>
      p.test(content),
    );

    for (const other of otherLangs) {
      const hasOtherStrong = (strongIndicators[other] || []).some((p) =>
        p.test(content),
      );
      // Only flag if 'other' matches AND the target does NOT
      if (hasOtherStrong && !hasTargetStrong) {
        const targetNice = {
          javascript: "JavaScript",
          python: "Python",
          php: "PHP",
        }[targetLang];
        return {
          isValid: false,
          message: `That is not ${targetNice} code`,
        };
      }
    }

    if (content.length > 20 && symbolDensity < 0.02) {
      const isTargetMatch = languageDetector.matchesLanguage(
        content,
        targetLang,
      );
      if (!isTargetMatch) {
        return {
          isValid: false,
          message: "This looks like plain text. Please write code",
        };
      }
    }

    const hasStrongIndicator = (strongIndicators[targetLang] || []).some((p) =>
      p.test(content),
    );

    if (hasStrongIndicator) {
      return { isValid: true, message: "" };
    }

    const isMatch = languageDetector.matchesLanguage(content, targetLang);

    if (isMatch) {
      return { isValid: true, message: "" };
    }

    const anyLangMatches = Object.keys(languageDetector.patterns).some(
      (l) => l !== "unknown" && languageDetector.matchesLanguage(content, l),
    );

    const targetNice =
      { javascript: "JavaScript", python: "Python", php: "PHP" }[targetLang] ||
      targetLang;

    if (anyLangMatches) {
      return {
        isValid: false,
        message: `That is not ${targetNice} code`,
      };
    }

    const isMarkup = (code) =>
      code.trim().startsWith("<") && code.trim().endsWith(">");

    const isVeryShort = content.trim().length < 15;
    const isNumeric = /^[0-9\s.]+$/.test(content.trim());

    const minDensity = targetLang === "python" ? 0.01 : 0.05;

    if (
      (symbolDensity > minDensity * 2.5 || isVeryShort || isNumeric) &&
      content.length < 100 &&
      !content.includes("\n") &&
      !isMarkup(content)
    ) {
      return { isValid: true, message: "" };
    }

    return {
      isValid: false,
      message: `That is not ${targetNice} code`,
    };
  },
};
