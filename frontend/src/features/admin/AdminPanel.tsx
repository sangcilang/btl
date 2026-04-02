import { FormEvent, useState } from "react";
import { createAdminUser, deleteAdminReport, deleteAdminTask, deleteAdminUser, updateAdminUserRole } from "../../lib/api";
import type { AdminOverview, AdminUser, Report, TaskItem } from "../../types";

interface AdminPanelProps {
  adminUserId: number;
  overview: AdminOverview;
  users: AdminUser[];
  reports: Report[];
  tasks: TaskItem[];
  onRefresh: () => Promise<void>;
}

export function AdminPanel({ adminUserId, overview, users, reports, tasks, onRefresh }: AdminPanelProps) {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"Staff" | "Manager" | "Director" | "Admin">("Staff");
  const [loading, setLoading] = useState(false);
  const [deletingReportId, setDeletingReportId] = useState("");
  const [deletingTaskId, setDeletingTaskId] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState(0);
  const [deletingUserId, setDeletingUserId] = useState(0);
  const [rolesByUserId, setRolesByUserId] = useState<Record<number, "Staff" | "Manager" | "Director" | "Admin">>(
    {}
  );
  const [error, setError] = useState("");

  async function handleCreateUser(event: FormEvent) {
    event.preventDefault();
    if (!userName.trim() || !password.trim()) {
      setError("Nhập đầy đủ username và password.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await createAdminUser(userName.trim(), password.trim(), role);
      setUserName("");
      setPassword("");
      setRole("Staff");
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo được user.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateRole(user: AdminUser) {
    const nextRole = rolesByUserId[user.id] ?? user.role;
    if (nextRole === user.role) {
      return;
    }

    try {
      setUpdatingUserId(user.id);
      setError("");
      await updateAdminUserRole(user.id, nextRole);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không đổi được role.");
    } finally {
      setUpdatingUserId(0);
    }
  }

  async function handleDeleteUser(user: AdminUser) {
    const ok = window.confirm(`Xóa tài khoản "${user.userName}"?`);
    if (!ok) {
      return;
    }

    try {
      setDeletingUserId(user.id);
      setError("");
      await deleteAdminUser(user.id);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không xóa được user.");
    } finally {
      setDeletingUserId(0);
    }
  }

  async function handleDeleteReport(reportId: string, title: string) {
    const ok = window.confirm(`Admin xóa báo cáo "${title}"?`);
    if (!ok) {
      return;
    }

    try {
      setDeletingReportId(reportId);
      setError("");
      await deleteAdminReport(reportId);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không xóa được báo cáo.");
    } finally {
      setDeletingReportId("");
    }
  }

  async function handleDeleteTask(taskId: string, title: string) {
    const ok = window.confirm(`Admin xóa nhiệm vụ "${title}"?`);
    if (!ok) {
      return;
    }

    try {
      setDeletingTaskId(taskId);
      setError("");
      await deleteAdminTask(taskId);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không xóa được nhiệm vụ.");
    } finally {
      setDeletingTaskId("");
    }
  }

  return (
    <section className="panel">
      <h2>Trang Admin</h2>
      {error ? <p className="error">{error}</p> : null}

      <div className="stats-grid">
        <div className="stat-card">
          <p className="subtext">Tổng users</p>
          <strong>{overview.totalUsers}</strong>
        </div>
        <div className="stat-card">
          <p className="subtext">Tổng báo cáo</p>
          <strong>{overview.totalReports}</strong>
        </div>
        <div className="stat-card">
          <p className="subtext">Tổng nhiệm vụ</p>
          <strong>{overview.totalTasks}</strong>
        </div>
        <div className="stat-card">
          <p className="subtext">Báo cáo đang chờ</p>
          <strong>{overview.pendingReports}</strong>
        </div>
      </div>

      <form className="task-form" onSubmit={handleCreateUser}>
        <h4>Tạo tài khoản mới</h4>
        <input value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Username" />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <select value={role} onChange={(e) => setRole(e.target.value as "Staff" | "Manager" | "Director" | "Admin")}>
          <option value="Staff">Staff</option>
          <option value="Manager">Manager</option>
          <option value="Director">Director</option>
          <option value="Admin">Admin</option>
        </select>
        <button type="submit" disabled={loading}>
          {loading ? "Đang tạo..." : "Tạo user"}
        </button>
      </form>

      <h4>Danh sách người dùng</h4>
      <ul className="report-list">
        {users.map((u) => (
          <li key={u.id} className="report-item">
            <div className="report-header">
              <span>
                #{u.id} - {u.userName}
              </span>
              <div className="admin-user-actions">
                <select
                  value={rolesByUserId[u.id] ?? u.role}
                  onChange={(e) =>
                    setRolesByUserId((prev) => ({
                      ...prev,
                      [u.id]: e.target.value as "Staff" | "Manager" | "Director" | "Admin"
                    }))
                  }
                >
                  <option value="Staff">Staff</option>
                  <option value="Manager">Manager</option>
                  <option value="Director">Director</option>
                  <option value="Admin">Admin</option>
                </select>
                <button type="button" disabled={updatingUserId === u.id} onClick={() => void handleUpdateRole(u)}>
                  {updatingUserId === u.id ? "Đang lưu..." : "Lưu role"}
                </button>
                <button
                  type="button"
                  className="danger-button"
                  disabled={deletingUserId === u.id || u.id === adminUserId}
                  onClick={() => void handleDeleteUser(u)}
                >
                  {deletingUserId === u.id ? "Đang xóa..." : "Xóa user"}
                </button>
              </div>
            </div>
            <p className="subtext">Role hiện tại: {u.role}</p>
          </li>
        ))}
      </ul>

      <h4>Toàn bộ báo cáo</h4>
      <ul className="report-list">
        {reports.map((r) => (
          <li key={r.id} className="report-item">
            <div className="report-header">
              <span>
                {r.title} - {r.status} - User {r.createdByUserId}
              </span>
              <button
                type="button"
                className="danger-button"
                disabled={deletingReportId === r.id}
                onClick={() => void handleDeleteReport(r.id, r.title)}
              >
                {deletingReportId === r.id ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <h4>Toàn bộ nhiệm vụ</h4>
      <ul className="report-list">
        {tasks.map((t) => (
          <li key={t.id} className="report-item">
            <div className="report-header">
              <span>
                {t.title} - {t.status} | Giao: {t.assignedByUserName} | Nhận: {t.assignedToUserName}
              </span>
              <button
                type="button"
                className="danger-button"
                disabled={deletingTaskId === t.id}
                onClick={() => void handleDeleteTask(t.id, t.title)}
              >
                {deletingTaskId === t.id ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
