const debug = (msg) => {};

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
      /useEffect|useState/,
      /className=/,
      /function\s+\w+\s*\(/,
      /async\s+function/,
      /===|!==/,
      /typeof\s+/,
      /\.forEach|\.map|\.filter|\.reduce/,
      /new\s+(Promise|Map|Set|Date|Error|Object|Array)/,
      /await\s+/,
      /JSON\.(parse|stringify)/,
    ],
    python: [
      /def\s+.*:/,
      /^\s*(import\s+\w+|from\s+\w+\s+import)/m,
      /print\s*\(.*\)/,
      /if\s+__name__\s*==\s*['"]__main__['"]:/,
      /class\s+\w+(\(.*\))?:/,
      /:\s*$/m,
      /self\./,
      /elif\s+/,
      /None|True|False/,
      /range|len|enumerate|zip|sum|min|max/,
      /lambda\s+\w+:/,
      /yield\s+/,
      /with\s+\w+\s+as\s+\w+:/,
      /f'[^']*'|f"[^"]*"/,
      /\[.*for.*in.*\]/,
      /^\s*#\s+/m,
      /^[a-z_][a-z0-9_]*\s*=\s*/im,
      /->\s*\w+/, // Python type hint return
      /:\s*\w+/, // Python type hint arg
      /"""[\s\S]*?"""|'''[\s\S]*?'''/, // Docstrings
      /except\s+\w+(\s+as\s+\w+)?\s*:/,
    ],
    php: [
      /<\?php/i,
      /<\?(?!\?)/,
      /declare\s*\(\s*strict_types\s*=\s*1\s*\)\s*;/,
      /(^|[;\}])\s*\$\w+\s*=/m,
      /echo\s+/,
      /\$\w+->/, // Specific to PHP member access
      /namespace\s+/,
      /^\s*use\s+[\\\w]+;$/m,
      /(public|private|protected)\s+(static\s+)?(function|array|string|int|float|bool|object|iterable|callable|void|\?\w+|\\)/,
      /function\s+\w+\s*\([^)]*\$\w+.*\)\s*\{/,
      /function\s+\w+\s*\(\s*\)\s*(:\s*\w+)?\s*\{/,
      /\$this->/,
      /array\(.*\)/,
      /\[\s*['"]\w+['"]\s*=>/,
      /var_dump|die\(|exit\(/,
      /require_once|include_once/,
      /PDO::/,
      /\$pdo->/,
      /::class/,
      /password_verify|password_hash/,
    ],
  },

  matchesLanguage: (content, language) => {
    const patterns = languageDetector.patterns[language];
    if (!patterns) return false;

    for (let pattern of patterns) {
      if (content.match(pattern)) {
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
      expectedLanguage ? expectedLanguage.toLowerCase() : "javascript"
    );

    if (content.length > 20 && symbolDensity < 0.02) {
      const strongMatch = languageDetector.matchesLanguage(
        content,
        targetLang
      );
      if (!strongMatch) {
        return {
          isValid: false,
          message: "This looks like plain text. Please write code",
        };
      }
    }

    if (targetLang === "unknown") return { isValid: true, message: "" };

    const strongIndicators = {
      php: [/<\?php/i, /declare\s*\(\s*strict_types\s*=\s*1\s*\)\s*;/],
      javascript: [
        /import\s+.*from/m,
        /export\s+default/m,
        /useEffect|useState/,
        /className=/,
      ],
      python: [
        /if\s+__name__\s*==\s*['"]__main__['"]:/, 
        /elif\s+/,
        /->\s*\w+/, // Python type hint return is very unique in our set
        /def\s+\w+\s*\(.*->\s*\w+\s*\)\s*:/, // Python function with return hint
      ],
    };

    const hasStrongIndicator = (strongIndicators[targetLang] || []).some((p) =>
      content.match(p)
    );

    // If we have a very strong indicator of the target language, we trust it
    if (hasStrongIndicator) {
      return { isValid: true, message: "" };
    }

    const isMatch = languageDetector.matchesLanguage(content, targetLang);

    // If it's a match for our target, we give it a high chance
    if (isMatch) {
      // Cross-check for other strong indicators that might override
      const otherLangs = ["javascript", "python", "php"].filter(l => l !== targetLang);
      for (const other of otherLangs) {
        const otherStrong = (strongIndicators[other] || []).some(p => content.match(p));
        if (otherStrong) {
          const targetNice = { javascript: "JavaScript", python: "Python", php: "PHP" }[targetLang];
          return {
            isValid: false,
            message: `This looks more like ${other.toUpperCase()} than ${targetNice}`,
          };
        }
      }
      return { isValid: true, message: "" };
    }

    const anyLangMatches = Object.keys(languageDetector.patterns).some(
      (l) => l !== "unknown" && languageDetector.matchesLanguage(content, l)
    );

    if (anyLangMatches) {
      const targetNice =
        { javascript: "JavaScript", python: "Python", php: "PHP" }[
          targetLang
        ] || targetLang;
      return {
        isValid: false,
        message: `This does not look like ${targetNice} code`,
      };
    }

    const isMarkup = (code) =>
      code.trim().startsWith("<") && code.trim().endsWith(">");

    // Allow even lower density for extremely short content (one-liners/numbers)
    const isVeryShort = content.trim().length < 15;
    const isNumeric = /^[0-9\s.]+$/.test(content.trim());
    
    const minDensity = targetLang === "python" ? 0.01 : 0.05;

    if (
      (symbolDensity > (minDensity * 2.5) || isVeryShort || isNumeric) && 
      content.length < 100 &&
      !content.includes("\n") &&
      !isMarkup(content)
    ) {
      return { isValid: true, message: "" };
    } else {
      const targetNice =
        { javascript: "JavaScript", python: "Python", php: "PHP" }[
          targetLang
        ] || targetLang;
      return {
        isValid: false,
        message: `This does not look like ${targetNice} code`,
      };
    }
  },
};
