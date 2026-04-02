import { LoginForm } from "../features/auth/LoginForm";
import type { AuthSession } from "../types";

interface LoginPageProps {
  onLoginSuccess: (session: AuthSession) => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  return (
    <main className="container">
      <h1>Report Approval</h1>
      <LoginForm onLoginSuccess={onLoginSuccess} />
    </main>
  );
}
