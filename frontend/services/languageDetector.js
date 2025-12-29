
// Helper to print debug info
const debug = (msg) => {
    // console.log(`[DEBUG] ${msg}`); 
};

export const languageDetector = {
  // Heuristic patterns for specific languages
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
      /JSON\.(parse|stringify)/
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
      /^[a-z_][a-z0-9_]*\s*=\s*/i // Simple assignment x = 1 (Case insensitive for constants like API_KEY)
    ],
    php: [
      /<\?php/i,  
      /<\?(?!\?)/,  
      /(^|[;\}])\s*\$\w+\s*=/,
      /echo\s+/,
      /->/,
      /namespace\s+/,
      /^\s*use\s+[\\\w]+;$/m,
      /public\s+function/,
      /private\s+function/,
      /protected\s+function/,
      /function\s+\w+\s*\([^)]*\$\w+.*\)\s*\{/, 
      /function\s+\w+\s*\(\s*\)\s*\{/, 
      /\$this->/,
      /array\(.*\)/,
      /var_dump|die\(|exit\(/,
      /require_once|include_once/,
      /PDO::/,
      /\$pdo->/,
      /::class/
    ]
  },

  matchesLanguage: (content, language) => {
    const patterns = languageDetector.patterns[language];
    if (!patterns) return false;

    for (let pattern of patterns) {
      if (content.match(pattern)) {
          // console.log(`[MATCH] ${language} matched pattern: ${pattern}`);
          return true;
      }
    }
    // console.log(`[NO MATCH] ${language} failed all patterns`);
    return false;
  },

  validate: (content, expectedLanguage) => {
    if (content.length < 5) return { isValid: true, message: '' };
    
    // 1. Basic "Is it Code?" check
    const symbols = /[\{\}\(\)\[\];=<>\/\*\+\-\|&!:@\$]/g;
    const symbolCount = (content.match(symbols) || []).length;
    const symbolDensity = symbolCount / content.length;

    if (content.length > 20 && symbolDensity < 0.02) {
       // Allow if it matches strong patterns for the target language
       const strongMatch = languageDetector.matchesLanguage(content, expectedLanguage);
       if (!strongMatch) {
            return { isValid: false, message: 'This looks like plain text. Please write code' };
       }
    }

    const normalize = (lang) => {
        if (['javascript', 'js', 'jsx', 'typescript', 'ts', 'tsx'].includes(lang)) return 'javascript';
        if (['python', 'py'].includes(lang)) return 'python';
        if (['php'].includes(lang)) return 'php';
        return 'unknown';
    };

    const targetLang = normalize(expectedLanguage ? expectedLanguage.toLowerCase() : 'javascript');
    if (targetLang === 'unknown') return { isValid: true, message: '' };

    const isMatch = languageDetector.matchesLanguage(content, targetLang);

    // CRITICAL: If no strong match for target, check if it's "Simple Code"
    const anyLangMatches = Object.keys(languageDetector.patterns).some(l => 
        l !== 'unknown' && languageDetector.matchesLanguage(content, l)
    );

    if (!isMatch && anyLangMatches) {
         // It doesn't match target, BUT it hits another language's pattern
         const targetNice = { 'javascript': 'JavaScript', 'python': 'Python', 'php': 'PHP' }[targetLang] || targetLang;
         return { isValid: false, message: `This does not look like ${targetNice} code` };
    }
    
    if (!isMatch && !anyLangMatches) {
        const isMarkup = code => code.trim().startsWith('<') && code.trim().endsWith('>');
        // Relaxing the symbol density check for Python specifically as it uses fewer symbols
        const minDensity = targetLang === 'python' ? 0.01 : 0.05;
        
        if (symbolDensity > minDensity && content.length < 100 && !content.includes('\n') && !isMarkup(content)) {
             return { isValid: true, message: '' }; 
        } else {
             const targetNice = { 'javascript': 'JavaScript', 'python': 'Python', 'php': 'PHP' }[targetLang] || targetLang;
             return { isValid: false, message: `This does not look like ${targetNice} code` };
        }
    }

    // 3. Contamination Check
    const indicators = {
        php: [/<\?php/, /\$\w+/],
        javascript: [/const\s+/, /let\s+/, /\bvar\s+/, /console\./, /typeof\s+/, /import\s+.*from/, /import\s+['"]/],
        python: [/def\s+.*:/, /import\s+\w+$/, /from\s+.*import/]
    };

    const otherLangs = ['javascript', 'python', 'php'].filter(l => l !== targetLang);
    for (let other of otherLangs) {
        const strongPatterns = indicators[other] || [];
        for (let p of strongPatterns) {
            if (content.match(p)) {
                 // console.log(`[CONTAMINATION] Found ${other} pattern in ${targetLang}: ${p}`);
                 if (targetLang === 'javascript' && other === 'php') {
                     if (content.includes('<?php')) {
                         const targetNice = { 'javascript': 'JavaScript', 'python': 'Python', 'php': 'PHP' }[targetLang] || targetLang;
                         return { isValid: false, message: `This does not look like ${targetNice} code` };
                     }
                     continue; 
                 }
                 
                 const targetNice = { 'javascript': 'JavaScript', 'python': 'Python', 'php': 'PHP' }[targetLang] || targetLang;
                 return { isValid: false, message: `This does not look like ${targetNice} code` };
            }
        }
    }

    return { isValid: true, message: '' };
  }
};
