import { FormEvent, useState } from "react";
import { login } from "../../lib/api";
import type { AuthSession } from "../../types";

interface LoginFormProps {
  onLoginSuccess: (session: AuthSession) => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!userName.trim() || !password.trim()) {
      setError("Nhập username và password.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      const session = await login({ userName: userName.trim(), password: password.trim() });
      onLoginSuccess(session);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Đăng nhập thất bại.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <h2>Đăng nhập</h2>
      <p className="subtext">123456</p>
      <label htmlFor="username">Username</label>
      <input
        id="username"
        value={userName}
        onChange={(event) => setUserName(event.target.value)}
        placeholder="Nhập username"
      />
      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Nhập password"
      />
      {error ? <p className="error">{error}</p> : null}
      <button disabled={isLoading} type="submit">
        {isLoading ? "Đang xử lý..." : "Đăng nhập"}
      </button>
    </form>
  );
}
