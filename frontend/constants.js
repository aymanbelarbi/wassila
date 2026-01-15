export const API_URL = "http://localhost:8000/api";
export const STORAGE_KEYS = {
  USERS: "codeguard_users",
  PROJECTS: "codeguard_projects",
  SCANS: "codeguard_scans",
  CURRENT_USER: "codeguard_current_user_session",
  TOKEN: "codeguard_token",
};

export const STATIC_RULES = [
  {
    id: "no-console",
    description: "Avoid using console.log in production",
    severity: "LOW",
  },
  {
    id: "no-eval",
    description: "Avoid using eval() as it is a security risk",
    severity: "CRITICAL",
  },
  {
    id: "complexity",
    description: "Function complexity is too high",
    severity: "MEDIUM",
  },
  { id: "long-function", description: "Function is too long", severity: "LOW" },
  {
    id: "secrets",
    description: "Possible hardcoded secret detected",
    severity: "HIGH",
  },
];
