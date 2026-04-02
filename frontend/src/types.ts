export type UserRole = "Staff" | "Manager" | "Director" | "Admin";

export interface User {
  id: number;
  userName: string;
  role: UserRole;
}

export interface AuthSession {
  accessToken: string;
  expiresAt: string;
  user: User;
}

export interface Report {
  id: string;
  title: string;
  content: string;
  currentLevel: number;
  isApproved: boolean;
  status: string;
  returnedReason?: string | null;
  fileOriginalName?: string | null;
  hasAttachment: boolean;
  createdAt: string;
  createdByUserId: number;
}

export interface LoginRequest {
  userName: string;
  password: string;
}

export interface CreateReportRequest {
  title: string;
  content: string;
  attachment?: File | null;
}

export interface ResubmitReportRequest {
  title: string;
  content: string;
  attachment?: File | null;
}

export interface ApproveReportRequest {
  comment: string;
}

export interface ReturnReportRequest {
  comment: string;
}

export interface ReportHistoryItem {
  id: string;
  reportId: string;
  level: number;
  action: string;
  comment: string;
  approverUserId: number;
  approverUserName: string;
  approverRole: string;
  approvedAt: string;
}

export interface ReportStatistics {
  totalReports: number;
  pendingManager: number;
  pendingDirector: number;
  returnedReports: number;
  approvedReports: number;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  assignedToUserId: number;
  assignedToUserName: string;
  assignedByUserId: number;
  assignedByUserName: string;
  dueDate?: string | null;
  status: "Todo" | "InProgress" | "Done";
  createdAt: string;
}

export interface CreateTaskRequest {
  assignedToUserId: number;
  title: string;
  description: string;
  dueDate?: string | null;
}

export interface TaskHistoryItem {
  id: string;
  taskId: string;
  taskTitle: string;
  action: string;
  status: string;
  note: string;
  assignedByUserId: number;
  assignedByUserName: string;
  completedByUserId?: number | null;
  completedByUserName?: string | null;
  completedAt?: string | null;
  changedAt: string;
}

export interface AdminOverview {
  totalUsers: number;
  totalReports: number;
  totalTasks: number;
  pendingReports: number;
}

export interface AdminUser {
  id: number;
  userName: string;
  role: UserRole;
}
