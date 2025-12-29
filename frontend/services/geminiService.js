import { GoogleGenAI } from "@google/genai";

class GeminiService {
  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === "undefined" || apiKey === "") {
      this.apiKeyError = true;
      this.ai = null;
    } else {
      this.apiKeyError = false;
      this.ai = new GoogleGenAI({
        apiKey: apiKey,
      });
    }
  }

  async reviewCode(code, staticIssues, language = 'javascript') {
    if (this.apiKeyError || !this.ai) {
      const error = new Error("API key not configured");
      error.userMessage =
        "Gemini API key is not set. Create a .env.local file with VITE_GEMINI_API_KEY from https://aistudio.google.com/";
      throw error;
    }

    if (!code || !staticIssues) {
      const error = new Error("Invalid input");
      error.userMessage = "Code and issues are required for analysis";
      throw error;
    }

    const issuesContext = staticIssues
      .map(
        (issue) =>
          `- Line ${issue.line} [${issue.severity}] ${issue.category}: ${issue.message}`
      )
      .join("\n");

    const prompt = `
      You are a World-Class Senior Software Engineer and Security Architect. 
      Your mission is to analyze the provided ${language.toUpperCase()} code and rewrite it to be mathematically perfect according to our strict static analyzer.
      
      ---
      CONTEXT:
      Current Language: ${language}
      Analyzer Findings:
      ${issuesContext}
      
      ---
      SOURCE CODE TO ANALYZE:
      ${code}
      
      ---
      STRICT CONSTRAINTS FOR 100/100 SCORE:
      To achieve a perfect score, your fixed code MUST contain ZERO violations of the following rules:
      
      1. STYLE & CLEAN CODE:
         - [max-len]: Lines MUST NOT exceed 120 characters (160 for JS/TS).
         - [no-console] (JS/TS): Remove all console logs. Use a dummy 'logger' object if logging is needed.
         - [no-print] (Python): Remove all print() calls.
         - [no-echo/no-short-tags] (PHP): Use <?php and avoid direct echo/print.
         - [no-var] (JS/TS): Use 'const' or 'let' only.
         - [naming-convention]: 
            - JS/TS: Use camelCase (no snake_case like user_name).
            - Python: Use snake_case (no camelCase like userName).

      2. SECURITY:
         - [no-eval]: Never use eval().
         - [detect-secrets]: Never hardcode passwords, API keys (AIza, sk-proj-, etc.), or tokens.
         - [xss-risk] (JS): Never use innerHTML or dangerouslySetInnerHTML.
         - [sql-injection-risk] (PHP): Use prepared statements; avoid direct mysql*_query.

      3. BUG PREVENTION:
         - [no-loose-equality] (JS/TS): Alway use === or !== instead of == or !=.
         - [empty-catch]: Never leave catch blocks empty. Log or handle errors.
         - [no-debugger]: Remove all 'debugger;' statements.
         - [duplicate-condition]: Ensure if/else if chains do not have identical conditions.
         - [no-bare-except] (Python): Always catch Exception or a specific error (never 'except:').
         - [no-die] (PHP): Never use die() or exit().

      4. COMPLEXITY:
         - [high-complexity]: Avoid deep nesting (max 3-4 levels). Refactor into helpers.

      ---
      MANDATORY INTERNAL AUDIT:
      Before providing the fixed code, perform an internal audit:
      - Does every variable follow the naming convention?
      - Is every 'var' replaced?
      - Is every '==' replaced with '==='?
      - is 'eval' removed?
      - are all 'console.log' removed?
      - are any lines too long?
      
      ---
      OUTPUT REQUIREMENTS:
      1. Provide a brief, professional summary of the architectural improvements.
      2. Provide the FULL fixed source code. 
      3. SUMMARY STYLE: Write a single, cohesive paragraph (3-4 sentences) that summarizes the changes logically. Do not use bullet points. Focus on the high-level impact (Security, Stability, Clean Code).
      4. DO NOT include "PR-READY", "100/100 Score", or guaranteed promises in the summary. Just the facts.
      
      FAILURE TO ADHERE TO ANY RULE WILL RESULT IN A SCORE BELOW 100 AND IS UNACCEPTABLE.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              summary: {
                type: "string",
                description: "A concise, cohesive paragraph summarizing the code improvements. Focus on high-level impact like security and readability.",
              },
              fixedCode: {
                type: "string",
                description: "The full rewritten source code.",
              },
            },
            required: ["summary", "fixedCode"],
          },
        },
      });

      const result = JSON.parse(response.text || "{}");

      if (!result.summary || !result.fixedCode) {
        throw new Error("Invalid response format from Gemini API");
      }

      return {
        summary: result.summary,
        fixedCode: result.fixedCode,
      };
    } catch (error) {
      console.error("Gemini API Error Detail:", error);
      
      const status = error.status || (error.response && error.response.status);
      
      if (status === 429) {
        const errorMsg = "Gemini API rate limit exceeded. Since you're using a new account, this is likely a temporary quota lock (5-10 mins). Please try again shortly.";
        const apiError = new Error("Rate limit exceeded");
        apiError.userMessage = errorMsg;
        apiError.status = 429;
        throw apiError;
      }

      const errorMsg = error.message || "Error processing your request";
      const apiError = new Error("API Error");
      apiError.userMessage = `AI Analysis failed: ${errorMsg}. Please ensure your API key is valid.`;
      apiError.status = status;
      throw apiError;
    }
  }
}

export const geminiService = new GeminiService();
