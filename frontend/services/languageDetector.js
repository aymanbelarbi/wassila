const debug = (msg) => {};

export const languageDetector = {
  patterns: {
    javascript: [
      /(?<!(private|public|protected)\s+)(const|let|var)\s+\w+\s*=/,
      /^\s*import\s+.*from/,
      /export\s+default/,
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
      /^\s*import\s+\w+(\s+as\s+\w+)?\s*$/,
      /from\s+\w+\s+import/,
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
      /^[a-z_][a-z0-9_]*\s*=\s*/i,
    ],
    php: [
      /<\?php/i,
      /<\?(?!\?)/,
      /declare\s*\(\s*strict_types\s*=\s*1\s*\)\s*;/,
      /(^|[;\}])\s*\$\w+\s*=/,
      /echo\s+/,
      /->/,
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

    if (content.length > 20 && symbolDensity < 0.02) {
      const strongMatch = languageDetector.matchesLanguage(
        content,
        expectedLanguage
      );
      if (!strongMatch) {
        return {
          isValid: false,
          message: "This looks like plain text. Please write code",
        };
      }
    }

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
    if (targetLang === "unknown") return { isValid: true, message: "" };

    const strongIndicators = {
      php: [/<\?php/i, /declare\s*\(\s*strict_types\s*=\s*1\s*\)\s*;/],
      javascript: [
        /import\s+.*from/,
        /export\s+default/,
        /useEffect|useState/,
        /className=/,
      ],
      python: [/if\s+__name__\s*==\s*['"]__main__['"]:/, /elif\s+/],
    };

    const hasStrongIndicator = (strongIndicators[targetLang] || []).some((p) =>
      content.match(p)
    );

    if (hasStrongIndicator) {
      return { isValid: true, message: "" };
    }

    const isMatch = languageDetector.matchesLanguage(content, targetLang);

    const anyLangMatches = Object.keys(languageDetector.patterns).some(
      (l) => l !== "unknown" && languageDetector.matchesLanguage(content, l)
    );

    if (!isMatch && anyLangMatches) {
      const targetNice =
        { javascript: "JavaScript", python: "Python", php: "PHP" }[
          targetLang
        ] || targetLang;
      return {
        isValid: false,
        message: `This does not look like ${targetNice} code`,
      };
    }

    if (!isMatch && !anyLangMatches) {
      const isMarkup = (code) =>
        code.trim().startsWith("<") && code.trim().endsWith(">");

      const minDensity = targetLang === "python" ? 0.01 : 0.05;

      if (
        symbolDensity > minDensity &&
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
    }

    const indicators = {
      php: [/<\?php/, /\$\w+/, /->/, /::class/],
      javascript: [
        /(?<!(private|public|protected|static)\s+)const\s+\w+\s*=/,
        /(?<!(private|public|protected|static)\s+)let\s+\w+\s*=/,
        /\bvar\s+\w+\s*=/,
        /console\./,
        /typeof\s+/,
        /import\s+.*from/,
        /import\s+['"]/,
        /export\s+default/,
        /=>/,
      ],
      python: [/def\s+.*:/, /import\s+\w+$/, /from\s+.*import/, /elif\s+/],
    };

    const otherLangs = ["javascript", "python", "php"].filter(
      (l) => l !== targetLang
    );
    for (let other of otherLangs) {
      const strongPatterns = indicators[other] || [];
      for (let p of strongPatterns) {
        if (content.match(p)) {
          if (targetLang === "javascript" && other === "php") {
            if (content.includes("<?php")) {
              const targetNice =
                { javascript: "JavaScript", python: "Python", php: "PHP" }[
                  targetLang
                ] || targetLang;
              return {
                isValid: false,
                message: `This does not look like ${targetNice} code`,
              };
            }
            continue;
          }

          const targetNice =
            { javascript: "JavaScript", python: "Python", php: "PHP" }[
              targetLang
            ] || targetLang;
          return {
            isValid: false,
            message: `This does not look like ${targetNice} code`,
          };
        }
      }
    }

    return { isValid: true, message: "" };
  },
};
