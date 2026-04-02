import type {
  AdminOverview,
  AdminUser,
  ApproveReportRequest,
  AuthSession,
  CreateTaskRequest,
  CreateReportRequest,
  LoginRequest,
  Report,
  ReportHistoryItem,
  ReportStatistics,
  ResubmitReportRequest,
  ReturnReportRequest,
  TaskHistoryItem,
  TaskItem
} from "../types";
import { clearCurrentSession, getCurrentSession } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5255";

function withAuth(options?: RequestInit): RequestInit {
  const headers = new Headers(options?.headers);
  const session = getCurrentSession();
  if (session?.accessToken) {
    headers.set("Authorization", `Bearer ${session.accessToken}`);
  }

  return {
    ...options,
    headers
  };
}

async function fetchApi(path: string, options?: RequestInit): Promise<Response> {
  const response = await fetch(`${API_BASE_URL}${path}`, withAuth(options));
  if (response.status === 401) {
    clearCurrentSession();
  }

  return response;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetchApi(path, options);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  const text = await response.text();
  return text as T;
}

function toFormData(payload: {
  [key: string]: string | number | File | null | undefined;
}): FormData {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (value instanceof File) {
      formData.append(key, value);
      return;
    }

    formData.append(key, String(value));
  });

  return formData;
}

export async function login(payload: LoginRequest): Promise<AuthSession> {
  return request<AuthSession>("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export async function getReports(): Promise<Report[]> {
  return request<Report[]>("/api/reports");
}

export async function createReport(payload: CreateReportRequest): Promise<Report> {
  const formData = toFormData({
    title: payload.title,
    content: payload.content,
    attachment: payload.attachment
  });

  return request<Report>("/api/reports", {
    method: "POST",
    body: formData
  });
}

export async function resubmitReport(reportId: string, payload: ResubmitReportRequest): Promise<void> {
  const formData = toFormData({
    title: payload.title,
    content: payload.content,
    attachment: payload.attachment
  });

  await request(`/api/reports/${reportId}/resubmit`, {
    method: "POST",
    body: formData
  });
}

export async function getPendingReports(level: number): Promise<Report[]> {
  return request<Report[]>(`/api/report-approvals/pending/${level}`);
}

export async function approveReport(reportId: string, payload: ApproveReportRequest): Promise<void> {
  await request(`/api/report-approvals/${reportId}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export async function returnReport(reportId: string, payload: ReturnReportRequest): Promise<void> {
  await request(`/api/report-approvals/${reportId}/return`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export async function getReportHistory(reportId: string): Promise<ReportHistoryItem[]> {
  return request<ReportHistoryItem[]>(`/api/reports/${reportId}/history`);
}

export async function getApprovalHistoryByUser(): Promise<ReportHistoryItem[]> {
  return request<ReportHistoryItem[]>("/api/report-approvals/history");
}

export async function getDashboardStats(): Promise<ReportStatistics> {
  return request<ReportStatistics>("/api/dashboard/stats");
}

export async function getTasks(): Promise<TaskItem[]> {
  return request<TaskItem[]>("/api/tasks");
}

export async function getTaskHistory(): Promise<TaskHistoryItem[]> {
  return request<TaskHistoryItem[]>("/api/tasks/history");
}

export async function createTask(payload: CreateTaskRequest): Promise<void> {
  await request("/api/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export async function updateTaskStatus(taskId: string, status: "Todo" | "InProgress" | "Done"): Promise<void> {
  await request(`/api/tasks/${taskId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status })
  });
}

export async function deleteReport(reportId: string): Promise<void> {
  await request(`/api/reports/${reportId}`, {
    method: "DELETE"
  });
}

export async function getAdminOverview(): Promise<AdminOverview> {
  return request<AdminOverview>("/api/admin/overview");
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  return request<AdminUser[]>("/api/admin/users");
}

export async function createAdminUser(
  userName: string,
  password: string,
  role: "Staff" | "Manager" | "Director" | "Admin"
): Promise<AdminUser> {
  return request<AdminUser>("/api/admin/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ userName, password, role })
  });
}

export async function updateAdminUserRole(
  userId: number,
  role: "Staff" | "Manager" | "Director" | "Admin"
): Promise<AdminUser> {
  return request<AdminUser>(`/api/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ role })
  });
}

export async function deleteAdminUser(userId: number): Promise<void> {
  await request(`/api/admin/users/${userId}`, {
    method: "DELETE"
  });
}

export async function getAdminReports(): Promise<Report[]> {
  return request<Report[]>("/api/admin/reports");
}

export async function getAdminTasks(): Promise<TaskItem[]> {
  return request<TaskItem[]>("/api/admin/tasks");
}

export async function deleteAdminReport(reportId: string): Promise<void> {
  await request(`/api/admin/reports/${reportId}`, {
    method: "DELETE"
  });
}

export async function deleteAdminTask(taskId: string): Promise<void> {
  await request(`/api/admin/tasks/${taskId}`, {
    method: "DELETE"
  });
}

export async function downloadAttachment(reportId: string, fileName?: string | null): Promise<void> {
  const response = await fetchApi(`/api/reports/${reportId}/attachment`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Request failed");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName || "attachment";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}
