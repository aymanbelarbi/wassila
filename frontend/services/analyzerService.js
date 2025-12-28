// Simple static code analyzer written in plain JavaScript.
// It returns an array of "issue" objects describing problems in the code.

export class AnalyzerService {
  constructor() {
    this.lines = [];
  }

  analyze(code, language = 'javascript') {
    this.lines = code.split("\n").map((text, i) => ({ text, number: i + 1 }));
    const issues = [];
    this.lastCondition = null;
    const lang = (language || 'javascript').toLowerCase();

    issues.push(...this.checkStyle(lang));
    issues.push(...this.checkSecurity(lang));
    issues.push(...this.checkComplexity(lang));
    issues.push(...this.checkTechDebt(lang));

    return issues;
  }

  // Style related checks
  checkStyle(lang) {
    const issues = [];
    this.lines.forEach((line) => {
      // Common: Line too long (Relaxed for JSX/TSX)
      const maxLen = (lang === 'typescript' || lang === 'javascript') ? 160 : 120;
      if (line.text.length > maxLen) {
        issues.push({
          id: crypto.randomUUID(),
          ruleId: "max-len",
          message: "Line exceeds 120 characters.",
          line: line.number,
          column: 120,
          severity: "LOW",
          category: "STYLE",
          suggestion: `Lines should be no longer than 120 characters for readability.\n\nCurrent length: ${line.text.length} characters\n\nBreak into multiple lines.`,
          problematicCode: line.text.trim(),
        });
      }

      // JS/TS Specific
      if (lang === 'javascript' || lang === 'typescript') {
        const isCommented = line.text.trim().startsWith('//') || line.text.trim().startsWith('/*');
        if (!isCommented && line.text.includes("console.log")) {
          issues.push({
            id: crypto.randomUUID(),
            ruleId: "no-console",
            message: "Avoid using console.log in production code.",
            line: line.number,
            column: line.text.indexOf("console.log"),
            severity: "LOW",
            category: "STYLE",
            suggestion: `console.log should not be used in production code.

Replace with:
const logger = { info: (msg) => {}, error: (msg) => {} };
logger.info("your message");`,
            problematicCode: line.text.trim(),
          });
        }
        if (line.text.match(/\bvar\s+\w+/)) {
          issues.push({
            id: crypto.randomUUID(),
            ruleId: "no-var",
            message: "Avoid using 'var'. Use 'const' or 'let' instead.",
            line: line.number,
            column: line.text.indexOf("var"),
            severity: "MEDIUM",
            category: "STYLE",
            suggestion: `'var' is function-scoped and can lead to bugs. 'const' and 'let' are block-scoped and preferred in modern JS.

Replace 'var' with 'const' (if value doesn't change) or 'let' (if it does):
const myValue = 42;  // or
let counter = 0;`,
            problematicCode: line.text.trim(),
          });
        }
        if (line.text.match(/\b[a-z]+_[a-z]+/)) {
          issues.push({
            id: crypto.randomUUID(),
            ruleId: "naming-convention",
            message: "Variable naming convention violation (snake_case detected).",
            line: line.number,
            column: 0,
            severity: "INFO",
            category: "STYLE",
            suggestion: `JavaScript usually prefers camelCase or PascalCase for variables and functions.`,
            problematicCode: line.text.trim(),
          });
        }
      }

      // Python Specific
      if (lang === 'python') {
        if (line.text.match(/\bprint\s*\(/)) {
          issues.push({
            id: crypto.randomUUID(),
            ruleId: "no-print",
            message: "Avoid using print() in professional code.",
            line: line.number,
            column: line.text.indexOf("print"),
            severity: "LOW",
            category: "STYLE",
            suggestion: `In production, use a logging module (e.g., 'import logging') instead of print().

Replace print() with:
import logging
logger = logging.getLogger(__name__)
logger.info("your message")`,
            problematicCode: line.text.trim(),
          });
        }
        if (line.text.match(/\b[A-Z][a-zA-Z0-9]*\s*=[^=]/) || line.text.match(/\b[a-z]+[A-Z][a-zA-Z0-9]*\s*=[^=]/)) {
            // Check for PascalCase or camelCase variable names (Python prefers snake_case)
            issues.push({
              id: crypto.randomUUID(),
              ruleId: "naming-convention",
              message: "Variable naming convention violation (non snake_case detected).",
              line: line.number,
              column: 0,
              severity: "INFO",
              category: "STYLE",
              suggestion: `Python variables should use snake_case (e.g., 'user_name').

Replace PascalCase/camelCase with snake_case:
user_name = "John"  # Instead of: userName or UserName`,
              problematicCode: line.text.trim(),
            });
          }
        if (line.text.match(/\bdef\s+[A-Z]/) || line.text.match(/\bdef\s+[a-z]+[A-Z]/)) {
          issues.push({
            id: crypto.randomUUID(),
            ruleId: "naming-convention",
            message: "Function naming convention violation (non snake_case detected).",
            line: line.number,
            column: 0,
            severity: "INFO",
            category: "STYLE",
            suggestion: `Python functions should use snake_case (e.g., 'process_data').

Replace PascalCase/camelCase with snake_case:
def process_data():  # Instead of: def processData() or ProcessData()`,
            problematicCode: line.text.trim(),
          });
        }
      }

      // PHP Specific
      if (lang === 'php') {
        if (line.text.match(/\becho\s+/) || line.text.match(/\bprint\s+/)) {
          issues.push({
            id: crypto.randomUUID(),
            ruleId: "no-echo",
            message: "Direct output detected (echo/print).",
            line: line.number,
            column: 0,
            severity: "LOW",
            category: "STYLE",
            suggestion: `In modern PHP frameworks, data should be returned via a response or template engine.`,
            problematicCode: line.text.trim(),
          });
        }
        if (line.text.includes("<? ") || line.text.includes("<?\n")) {
            issues.push({
              id: crypto.randomUUID(),
              ruleId: "no-short-tags",
              message: "Avoid using PHP short tags.",
              line: line.number,
              column: 0,
              severity: "MEDIUM",
              category: "STYLE",
              suggestion: `Always use the full '<?php' tag for better compatibility.`,
              problematicCode: line.text.trim(),
            });
          }
      }
    });
    return issues;
  }

  // Security related checks
  checkSecurity(lang) {
    const issues = [];
    this.lines.forEach((line) => {
      // Rule: No eval
      if (line.text.match(/\beval\s*\(/)) {
        issues.push({
          id: crypto.randomUUID(),
          ruleId: "no-eval",
          message: "Usage of eval() detected. This is a severe security risk.",
          line: line.number,
          column: line.text.indexOf("eval"),
          severity: "CRITICAL",
          category: "SECURITY",
          suggestion: `eval() allows arbitrary code execution and is a critical security vulnerability.

Remove eval() entirely. For JSON parsing, use:
const data = JSON.parse(jsonString);

For dynamic function calls, use a function map:
const actions = { add: () => {}, sub: () => {} };
actions[operation]();`,
          problematicCode: line.text.trim(),
        });
      }

      // Rule: Loose equality (JS/TS only)
      if ((lang === 'javascript' || lang === 'typescript') && line.text.match(/[^=]==[^=]/) && !line.text.includes("null")) {
        issues.push({
          id: crypto.randomUUID(),
          ruleId: "no-loose-equality",
          message: "Usage of '==' detected. Use '===' for strict equality.",
          line: line.number,
          column: line.text.indexOf("=="),
          severity: "LOW",
          category: "BUG",
          suggestion: `Strict equality (===) is safer and avoids unexpected type coercion issues.

Replace '==' with '===':
if (value === 0) { ... }  // Instead of: if (value == 0)`,
          problematicCode: line.text.trim(),
        });
      }

      // JS Specific Security
      if (lang === 'javascript' || lang === 'typescript') {
        if (line.text.match(/\.innerHTML\s*=/) || line.text.match(/dangerouslySetInnerHTML/)) {
          issues.push({
            id: crypto.randomUUID(),
            ruleId: "xss-risk",
            message: "Potential XSS vulnerability via innerHTML.",
            line: line.number,
            column: line.text.indexOf("innerHTML"),
            severity: "HIGH",
            category: "SECURITY",
            suggestion: `Using innerHTML can expose your application to Cross-Site Scripting (XSS). Use textContent or DOM elements instead.`,
            problematicCode: line.text.trim(),
          });
        }
      }

      // PHP Specific Security
      if (lang === 'php') {
        if (line.text.match(/\b(mysql_query|mysqli_query)\s*\(/)) {
          issues.push({
            id: crypto.randomUUID(),
            ruleId: "sql-injection-risk",
            message: "Direct database query detected. Use Prepared Statements.",
            line: line.number,
            column: 0,
            severity: "HIGH",
            category: "SECURITY",
            suggestion: `Direct queries are prone to SQL injection. Use PDO with prepared statements instead.`,
            problematicCode: line.text.trim(),
          });
        }
      }

      // Rule: Hardcoded secrets
      const secretRegex = /['"](AIza|sk-proj-|ghp_|glpat-)[a-zA-Z0-9_\-]{20,}['"]/;
      const genericSecretRegex = /\b(PASSWORD|SECRET|TOKEN|KEY)\s*=\s*['"][^'"]{6,}['"]/i;
      
      if (line.text.match(secretRegex) || line.text.match(genericSecretRegex)) {
        issues.push({
          id: crypto.randomUUID(),
          ruleId: "detect-secrets",
          message: "Potential hardcoded API key or secret detected.",
          line: line.number,
          column: 0,
          severity: "HIGH",
          category: "SECURITY",
          suggestion: `Never hardcode secrets. Use environment variables.

Replace hardcoded values with:
const apiKey = process.env.API_KEY;  // Node.js
const apiKey = import.meta.env.VITE_API_KEY;  // Vite`,
          problematicCode: line.text.trim(),
        });
      }
    });
    return issues;
  }

  // Very simple complexity check based on indentation
  checkComplexity(lang) {
    const issues = [];
    this.lines.forEach((line) => {
      const indentation = line.text.search(/\S/);
      const maxIndentation = lang === 'python' ? 16 : 20; // Python is indentation sensitive
      if (indentation > maxIndentation) {
        issues.push({
          id: crypto.randomUUID(),
          ruleId: "high-complexity",
          message: "Deep nesting detected (Complexity).",
          line: line.number,
          column: indentation,
          severity: "MEDIUM",
          category: "COMPLEXITY",
          suggestion: `Logic is too deeply nested. Refactor into smaller functions.`,
          problematicCode: line.text.trim(),
        });
      }
    });
    return issues;
  }

  // New: Check for TODOs, Empty Catch, and Debugger
  // Technical debt and debug helpers
  checkTechDebt(lang) {
    const issues = [];
    this.lines.forEach((line) => {
      if (line.text.includes("TODO") || line.text.includes("FIXME")) {
        issues.push({
          id: crypto.randomUUID(),
          ruleId: "tech-debt",
          message: "Technical Debt detected (TODO/FIXME).",
          line: line.number,
          severity: "LOW",
          category: "DEBT",
          suggestion: `Resolve technical debt or track it in your task management system.`,
          problematicCode: line.text.trim(),
        });
      }
      
      // Duplicated logic hint (looks for duplicated conditions in if/else if)
      if (line.text.includes("if")) {
        const currentCondition = line.text.match(/\((.*)\)/)?.[1]?.trim();
        if (currentCondition) {
          if (this.lastCondition === currentCondition && line.text.includes("else if")) {
             issues.push({
              id: crypto.randomUUID(),
              ruleId: "duplicate-condition",
              message: "Possible duplicated condition detected in if/else if chain.",
              line: line.number,
              severity: "HIGH",
              category: "BUG",
              suggestion: `The condition "${currentCondition}" is identical to the previous check. Combine or remove it.`,
              problematicCode: line.text.trim(),
            });
          }
          this.lastCondition = currentCondition;
        }
      } else if (!line.text.trim().startsWith("}") && !line.text.trim().startsWith("else")) {
        // Reset last condition if we are outside the if/else if block
        // (This is a simplified heuristic)
        if (line.text.trim().length > 0) {
          // this.lastCondition = null; 
          // Actually, let's just keep it simple for now or it gets messy
        }
      }

      // Rule: Empty catch block
      if (line.text.match(/catch\s*\(.*\)\s*\{\s*\}/)) {
        issues.push({
          id: crypto.randomUUID(),
          ruleId: "empty-catch",
          message: "Empty catch block detected.",
          line: line.number,
          column: line.text.indexOf("catch"),
          severity: "MEDIUM",
          category: "BUG_RISK",
          suggestion: `Errors should be handled or logged.`,
          problematicCode: line.text.trim(),
        });
      }

      // Rule: Debugger statement
      if (line.text.includes("debugger;")) {
        issues.push({
          id: crypto.randomUUID(),
          ruleId: "no-debugger",
          message: "Debugger statement detected.",
          line: line.number,
          column: line.text.indexOf("debugger"),
          severity: "HIGH",
          category: "BUG_RISK",
          suggestion: `Remove debugger statements before deployment.`,
          problematicCode: line.text.trim(),
        });
      }

      // PHP Specific Debt
      if (lang === 'php') {
          if (line.text.match(/\b(die|exit)\s*[\(;]/)) {
              issues.push({
                id: crypto.randomUUID(),
                ruleId: "no-die",
                message: "Avoid using die() or exit().",
                line: line.number,
                column: 0,
                severity: "MEDIUM",
                category: "BUG_RISK",
                suggestion: `Use exceptions or proper application exit points instead of die().`,
                problematicCode: line.text.trim(),
              });
          }
      }

      // Python Specific Debt
      if (lang === 'python') {
          if (line.text.match(/\bexcept:\s*(#.*)?$/)) {
              issues.push({
                id: crypto.randomUUID(),
                ruleId: "no-bare-except",
                message: "Avoid bare 'except:'.",
                line: line.number,
                column: 0,
                severity: "MEDIUM",
                category: "BUG_RISK",
                suggestion: `Catch specific exceptions or use 'except Exception:' to avoid catching system exits.

Replace bare except with:
try:
    risky_operation()
except ValueError as e:
    logger.error(f"Error: {e}")
# Or use: except Exception as e:`,
                problematicCode: line.text.trim(),
              });
          }
      }
    });
    return issues;
  }
}

export const analyzerService = new AnalyzerService();
