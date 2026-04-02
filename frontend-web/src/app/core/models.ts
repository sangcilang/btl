export type UserRole = 'Staff' | 'Manager' | 'Director' | 'Admin' | string;

export interface AuthUser {
  id: number;
  userName: string;
  role: UserRole;
}

export interface AuthSession {
  accessToken: string;
  expiresAt: string;
  user: AuthUser;
}

export interface ReportItem {
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

export interface ReportStats {
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
  status: 'Todo' | 'InProgress' | 'Done' | string;
  createdAt: string;
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

export interface TaskAssignee {
  id: number;
  userName: string;
}

export interface AdminUser {
  id: number;
  userName: string;
  role: UserRole;
}

export interface AdminOverview {
  totalUsers: number;
  totalReports: number;
  totalTasks: number;
  pendingReports: number;
}
