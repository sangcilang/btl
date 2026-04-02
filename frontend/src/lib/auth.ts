import type { AuthSession } from "../types";

const STORAGE_KEY = "report-approval-session";
const LEGACY_STORAGE_KEY = "report-approval-user";

function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Partial<AuthSession>;
  return (
    typeof session.accessToken === "string" &&
    typeof session.expiresAt === "string" &&
    !!session.user &&
    typeof session.user.id === "number" &&
    typeof session.user.userName === "string" &&
    typeof session.user.role === "string"
  );
}

export function getCurrentSession(): AuthSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isAuthSession(parsed)) {
      clearCurrentSession();
      return null;
    }

    if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
      clearCurrentSession();
      return null;
    }

    return parsed;
  } catch {
    clearCurrentSession();
    return null;
  }
}

export function saveCurrentSession(session: AuthSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export function clearCurrentSession(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}
