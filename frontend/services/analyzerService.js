export class AnalyzerService {
  constructor() {
    this.lines = [];
  }

  analyze(code, language = "javascript") {
    this.lines = code.split("\n").map((text, i) => ({ text, number: i + 1 }));
    const issues = [];
    this.lastCondition = null;
    const lang = (language || "javascript").toLowerCase();

    issues.push(...this.checkStyle(lang));
    issues.push(...this.checkSecurity(lang));
    issues.push(...this.checkComplexity(lang));
    issues.push(...this.checkTechDebt(lang));

    // Calculate score based on weighted severity
    const weights = {
      CRITICAL: 25,
      HIGH: 15,
      MEDIUM: 8,
      LOW: 3,
      INFO: 0,
    };

    const totalDeduction = issues.reduce(
      (acc, issue) => acc + (weights[issue.severity] || 5),
      0
    );
    const score = Math.round(Math.max(0, 100 - totalDeduction));

    return { issues, score };
  }

  checkStyle(lang) {
    const issues = [];
    this.lines.forEach((line) => {
      const trimmed = line.text.trim();
      // Skip if the entire line is a comment
      if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("#")) {
        return;
      }

      // Strip trailing comments for inner-line analysis
      const codeOnly = line.text.split("//")[0].split("/*")[0];

      const maxLen = lang === "typescript" || lang === "javascript" ? 160 : 120;
      if (line.text.length > maxLen) {
        issues.push({
          id: crypto.randomUUID(),
          ruleId: "max-len",
          message: "Line exceeds 120 characters.",
          line: line.number,
          column: 120,
          severity: "LOW",
          category: "STYLE",
          suggestion: `Lines should be no longer than 120 characters to maintain readability and avoid horizontal scrolling.
---CODE---
// Break long lines into multiple lines
const longString = "part1" + 
  "part2" + 
  "part3";`,
          problematicCode: trimmed,
        });
      }

      if (lang === "javascript" || lang === "typescript") {
        if (codeOnly.includes("console.log")) {
          issues.push({
            id: crypto.randomUUID(),
            ruleId: "no-console",
            message: "Avoid using console.log in production code.",
            line: line.number,
            column: line.text.indexOf("console.log"),
            severity: "LOW",
            category: "STYLE",
            suggestion: `console.log should not be used in production. It can leak sensitive info and clutter logs.
---CODE---
// Use a dedicated logger
const logger = { info: (msg) => {}, error: (msg) => {} };
logger.info("your message");`,
            problematicCode: trimmed,
          });
        }
        if (codeOnly.match(/\bvar\s+\w+/)) {
          issues.push({
            id: crypto.randomUUID(),
            ruleId: "no-var",
            message: "Avoid using 'var'. Use 'const' or 'let' instead.",
            line: line.number,
            column: line.text.indexOf("var"),
            severity: "MEDIUM",
            category: "STYLE",
            suggestion: `'var' is function-scoped and can lead to hoisting bugs. 'const' and 'let' are block-scoped and safer.
---CODE---
// Use const for values that don't change
const myValue = 42;

// Use let for values that change
let counter = 0;`,
            problematicCode: trimmed,
          });
        }
        if (codeOnly.match(/\b[a-z]+_[a-z]+/)) {
          issues.push({
            id: crypto.randomUUID(),
            ruleId: "naming-convention",
            message:
              "Variable naming convention violation (snake_case detected).",
            line: line.number,
            column: 0,
            severity: "INFO",
            category: "STYLE",
            suggestion: `JavaScript standard implies camelCase for variables and functions.
---CODE---
// Use camelCase
const userName = "John"; // instead of user_name
function getUserData() {} // instead of get_user_data`,
            problematicCode: trimmed,
          });
        }
      }

      if (lang === "python") {
        if (codeOnly.match(/\bprint\s*\(/)) {
          issues.push({
            id: crypto.randomUUID(),
            ruleId: "no-print",
            message: "Avoid using print() in professional code.",
            line: line.number,
            column: line.text.indexOf("print"),
            severity: "LOW",
            category: "STYLE",
            suggestion: `In production, use a standardized logging module instead of raw print statements.
---CODE---
import logging
logger = logging.getLogger(__name__)

# Replace print("msg") with:
logger.info("your message")`,
            problematicCode: trimmed,
          });
        }
        if (
          codeOnly.match(/\b[A-Z][a-zA-Z0-9]*\s*=[^=]/) ||
          codeOnly.match(/\b[a-z]+[A-Z][a-zA-Z0-9]*\s*=[^=]/)
        ) {
          issues.push({
            id: crypto.randomUUID(),
            ruleId: "naming-convention",
            message:
              "Variable naming convention violation (non snake_case detected).",
            line: line.number,
            column: 0,
            severity: "INFO",
            category: "STYLE",
            suggestion: `Python variables should use snake_case for better readability and PEP-8 compliance.
---CODE---
# Use snake_case
user_name = "John"  
# Avoid: userName or UserName`,
            problematicCode: trimmed,
          });
        }
        if (
          codeOnly.match(/\bdef\s+[A-Z]/) ||
          codeOnly.match(/\bdef\s+[a-z]+[A-Z]/)
        ) {
          issues.push({
            id: crypto.randomUUID(),
            ruleId: "naming-convention",
            message:
              "Function naming convention violation (non snake_case detected).",
            line: line.number,
            column: 0,
            severity: "INFO",
            category: "STYLE",
            suggestion: `Python functions should use snake_case.
---CODE---
# Use snake_case for functions
def process_data():
    pass
# Avoid: def processData()`,
            problematicCode: trimmed,
          });
        }
      }

      if (lang === "php") {
        if (codeOnly.match(/\becho\s+/) || codeOnly.match(/\bprint\s+/)) {
          issues.push({
            id: crypto.randomUUID(),
            ruleId: "no-echo",
            message: "Direct output detected (echo/print).",
            line: line.number,
            column: 0,
            severity: "LOW",
            category: "STYLE",
            suggestion: `In modern PHP architectures (MVC), data should be returned purely, not echoed directly.
---CODE---
// Return data instead of printing
return response()->json(['data' => $value]);

// Or in a template
<?= $value ?>`,
            problematicCode: trimmed,
          });
        }
        if (codeOnly.includes("<? ") || codeOnly.includes("<?\n")) {
          issues.push({
            id: crypto.randomUUID(),
            ruleId: "no-short-tags",
            message: "Avoid using PHP short tags.",
            line: line.number,
            column: 0,
            severity: "MEDIUM",
            category: "STYLE",
            suggestion: `Short tags (<?) are not supported on all servers. Use the full tag.
---CODE---
<?php
// Your code here
?>`,
            problematicCode: trimmed,
          });
        }
      }
    });
    return issues;
  }

  checkSecurity(lang) {
    const issues = [];
    this.lines.forEach((line) => {
      const trimmed = line.text.trim();
      // Skip if the entire line is a comment
      if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("#")) {
        return;
      }
      const codeOnly = line.text.split("//")[0].split("/*")[0];

      if (codeOnly.match(/\beval\s*\(/)) {
        issues.push({
          id: crypto.randomUUID(),
          ruleId: "no-eval",
          message: "Usage of eval() detected. This is a severe security risk.",
          line: line.number,
          column: line.text.indexOf("eval"),
          severity: "CRITICAL",
          category: "SECURITY",
          suggestion: `eval() allows arbitrary code execution and is a major security vector.
---CODE---
// For JSON parsing:
const data = JSON.parse(jsonString);

// For dynamic operations, use a map:
const actions = { 
  add: (a, b) => a + b 
};
const result = actions[operation](x, y);`,
          problematicCode: trimmed,
        });
      }

      if (
        (lang === "javascript" || lang === "typescript") &&
        !codeOnly.includes("null")
      ) {
        if (
          codeOnly.match(/[^=!]={2}[^=]/) ||
          codeOnly.match(/^={2}[^=]/) ||
          codeOnly.match(/[^=!]={2}$/)
        ) {
          issues.push({
            id: crypto.randomUUID(),
            ruleId: "no-loose-equality",
            message: "Usage of '==' detected. Use '===' for strict equality.",
            line: line.number,
            column: line.text.indexOf("=="),
            severity: "LOW",
            category: "BUG",
            suggestion: `Loose equality (==) performs type coercion which can verify true for unexpected values.
---CODE---
// Use strict equality
if (value === 0) {
  // ...
}`,
            problematicCode: trimmed,
          });
        }
      }

      if (lang === "javascript" || lang === "typescript") {
        if (
          codeOnly.match(/\.innerHTML\s*=/) ||
          codeOnly.match(/dangerouslySetInnerHTML/)
        ) {
          issues.push({
            id: crypto.randomUUID(),
            ruleId: "xss-risk",
            message: "Potential XSS vulnerability via innerHTML.",
            line: line.number,
            column: line.text.indexOf("innerHTML"),
            severity: "HIGH",
            category: "SECURITY",
            suggestion: `innerHTML allows injection of malicious scripts (XSS).
---CODE---
// Use textContent for text
element.textContent = "Safe Text";

// Or safely create elements
const div = document.createElement('div');
div.textContent = "Content";
parent.appendChild(div);`,
            problematicCode: trimmed,
          });
        }
      }

      if (lang === "php") {
        if (codeOnly.match(/\b(mysql_query|mysqli_query)\s*\(/)) {
          issues.push({
            id: crypto.randomUUID(),
            ruleId: "sql-injection-risk",
            message: "Direct database query detected. Use Prepared Statements.",
            line: line.number,
            column: 0,
            severity: "HIGH",
            category: "SECURITY",
            suggestion: `Direct SQL queries with concatenated strings are the #1 cause of SQL Injection.
---CODE---
// Use PDO with prepared statements
$stmt = $pdo->prepare('SELECT * FROM users WHERE id = :id');
$stmt->execute(['id' => $id]);
$user = $stmt->fetch();`,
            problematicCode: trimmed,
          });
        }
      }

      const secretRegex =
        /['"](AIza|sk-proj-|ghp_|glpat-)[a-zA-Z0-9_\-]{20,}['"]/;
      const genericSecretRegex =
        /\b(PASSWORD|SECRET|TOKEN|KEY)\s*=\s*['"][^'"]{6,}['"]/i;

      if (codeOnly.match(secretRegex) || codeOnly.match(genericSecretRegex)) {
        issues.push({
          id: crypto.randomUUID(),
          ruleId: "detect-secrets",
          message: "Potential hardcoded API key or secret detected.",
          line: line.number,
          column: 0,
          severity: "HIGH",
          category: "SECURITY",
          suggestion: `Hardcoding secrets pushes them to version control where they can be stolen.
---CODE---
// Use environment variables
const apiKey = process.env.API_KEY; 

// Or in Vite
const apiKey = import.meta.env.VITE_API_KEY;`,
          problematicCode: trimmed,
        });
      }
    });
    return issues;
  }

  checkComplexity(lang) {
    const issues = [];
    this.lines.forEach((line) => {
      const trimmed = line.text.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("#")) {
        return;
      }
      
      const indentation = line.text.search(/\S/);
      const maxIndentation = lang === "python" ? 16 : 20;
      if (indentation > maxIndentation) {
        issues.push({
          id: crypto.randomUUID(),
          ruleId: "high-complexity",
          message: "Deep nesting detected (Complexity).",
          line: line.number,
          column: indentation,
          severity: "MEDIUM",
          category: "COMPLEXITY",
          suggestion: `Code is too nested (arrow code), making it hard to read and test.
---CODE---
// Extract logic into a separate function
function handleItem(item) {
   // Logic here
}

// Then use it
items.forEach(handleItem);`,
          problematicCode: line.text.trim(),
        });
      }
    });
    return issues;
  }

  checkTechDebt(lang) {
    const issues = [];
    this.lines.forEach((line) => {
      const trimmed = line.text.trim();
      // Skip if the entire line is a comment or part of a block comment
      if (
        trimmed.startsWith("//") || 
        trimmed.startsWith("/*") || 
        trimmed.startsWith("*") || 
        trimmed.startsWith("#")
      ) {
        return;
      }
      
      if (line.text.includes("TODO") || line.text.includes("FIXME")) {
        issues.push({
          id: crypto.randomUUID(),
          ruleId: "tech-debt",
          message: "Technical Debt detected (TODO/FIXME).",
          line: line.number,
          severity: "LOW",
          category: "DEBT",
          suggestion: `TODOs often get forgotten. It is better to track them in a ticket system.
---CODE---
// Resolve the task now or move to Jira/Linear.`,
          problematicCode: line.text.trim(),
        });
      }

      if (line.text.includes("if")) {
        const currentCondition = line.text.match(/\((.*)\)/)?.[1]?.trim();
        if (currentCondition) {
          if (
            this.lastCondition === currentCondition &&
            line.text.includes("else if")
          ) {
            issues.push({
              id: crypto.randomUUID(),
              ruleId: "duplicate-condition",
              message:
                "Possible duplicated condition detected in if/else if chain.",
              line: line.number,
              severity: "HIGH",
              category: "BUG",
              suggestion: `The condition checks for the same thing twice.
---CODE---
// Remove the duplicate else if block
if (x === 1) {
  // ...
} else {
  // Handle other cases
}`,
              problematicCode: line.text.trim(),
            });
          }
          this.lastCondition = currentCondition;
        }
      } else if (
        !line.text.trim().startsWith("}") &&
        !line.text.trim().startsWith("else")
      ) {
        if (line.text.trim().length > 0) {
        }
      }

      if (line.text.match(/catch\s*\(.*\)\s*\{\s*\}/)) {
        issues.push({
          id: crypto.randomUUID(),
          ruleId: "empty-catch",
          message: "Empty catch block detected.",
          line: line.number,
          column: line.text.indexOf("catch"),
          severity: "MEDIUM",
          category: "BUG_RISK",
          suggestion: `Silencing errors makes debugging impossible.
---CODE---
try {
  // ...
} catch (error) {
  // At least log the error
  console.error(error); 
}`,
          problematicCode: line.text.trim(),
        });
      }

      if (line.text.includes("debugger;")) {
        issues.push({
          id: crypto.randomUUID(),
          ruleId: "no-debugger",
          message: "Debugger statement detected.",
          line: line.number,
          column: line.text.indexOf("debugger"),
          severity: "HIGH",
          category: "BUG_RISK",
          suggestion: `Debugger statements stop execution and should never be in production.
---CODE---
// Remove this line completely
debugger;`,
          problematicCode: line.text.trim(),
        });
      }

      if (lang === "php") {
        if (line.text.match(/\b(die|exit)\s*[\(;]/)) {
          issues.push({
            id: crypto.randomUUID(),
            ruleId: "no-die",
            message: "Avoid using die() or exit().",
            line: line.number,
            column: 0,
            severity: "MEDIUM",
            category: "BUG_RISK",
            suggestion: `Abruptly stopping the script is bad helper practice.
---CODE---
// Throw an exception instead
throw new \RuntimeException("Error occurred");`,
            problematicCode: line.text.trim(),
          });
        }
      }

      if (lang === "python") {
        if (line.text.match(/\bexcept:\s*(#.*)?$/)) {
          issues.push({
            id: crypto.randomUUID(),
            ruleId: "no-bare-except",
            message: "Avoid bare 'except:'.",
            line: line.number,
            column: 0,
            severity: "MEDIUM",
            category: "BUG_RISK",
            suggestion: `Bare 'except:' catches everything, including SystemExit, making it hard to stop scripts.
---CODE---
# Catch Exception instead
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
