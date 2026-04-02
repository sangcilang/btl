import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AdminOverview,
  AdminUser,
  AuthSession,
  ReportHistoryItem,
  ReportItem,
  ReportStats,
  TaskAssignee,
  TaskHistoryItem,
  TaskItem
} from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  login(userName: string, password: string): Observable<AuthSession> {
    return this.http.post<AuthSession>(`${this.baseUrl}/auth/login`, { userName, password });
  }

  getReports(): Observable<ReportItem[]> {
    return this.http.get<ReportItem[]>(`${this.baseUrl}/reports`);
  }

  getAdminReports(): Observable<ReportItem[]> {
    return this.http.get<ReportItem[]>(`${this.baseUrl}/admin/reports`);
  }

  createReport(formData: FormData): Observable<ReportItem> {
    return this.http.post<ReportItem>(`${this.baseUrl}/reports`, formData);
  }

  resubmitReport(reportId: string, formData: FormData): Observable<{ message: string; report: ReportItem }> {
    return this.http.post<{ message: string; report: ReportItem }>(`${this.baseUrl}/reports/${reportId}/resubmit`, formData);
  }

  getPending(level: number): Observable<ReportItem[]> {
    return this.http.get<ReportItem[]>(`${this.baseUrl}/report-approvals/pending/${level}`);
  }

  approveReport(reportId: string, comment: string): Observable<{ message: string; report: ReportItem }> {
    return this.http.post<{ message: string; report: ReportItem }>(`${this.baseUrl}/report-approvals/${reportId}/approve`, {
      comment
    });
  }

  returnReport(reportId: string, comment: string): Observable<{ message: string; report: ReportItem }> {
    return this.http.post<{ message: string; report: ReportItem }>(`${this.baseUrl}/report-approvals/${reportId}/return`, {
      comment
    });
  }

  getStats(): Observable<ReportStats> {
    return this.http.get<ReportStats>(`${this.baseUrl}/dashboard/stats`);
  }

  getHistory(reportId: string): Observable<ReportHistoryItem[]> {
    return this.http.get<ReportHistoryItem[]>(`${this.baseUrl}/reports/${reportId}/history`);
  }

  deleteReport(reportId: string, isAdmin: boolean): Observable<string> {
    const endpoint = isAdmin ? `${this.baseUrl}/admin/reports/${reportId}` : `${this.baseUrl}/reports/${reportId}`;
    return this.http.delete(endpoint, { responseType: 'text' });
  }

  getTasks(): Observable<TaskItem[]> {
    return this.http.get<TaskItem[]>(`${this.baseUrl}/tasks`);
  }

  getTaskHistory(): Observable<TaskHistoryItem[]> {
    return this.http.get<TaskHistoryItem[]>(`${this.baseUrl}/tasks/history`);
  }

  getAssignableStaff(): Observable<TaskAssignee[]> {
    return this.http.get<TaskAssignee[]>(`${this.baseUrl}/tasks/staff`);
  }

  createTask(payload: {
    assignedToUserId: number;
    title: string;
    description: string;
    dueDate?: string | null;
  }): Observable<{ message: string; task: TaskItem }> {
    return this.http.post<{ message: string; task: TaskItem }>(`${this.baseUrl}/tasks`, payload);
  }

  updateTaskStatus(taskId: string, status: string): Observable<string> {
    return this.http.patch(`${this.baseUrl}/tasks/${taskId}/status`, { status }, { responseType: 'text' });
  }

  getAdminOverview(): Observable<AdminOverview> {
    return this.http.get<AdminOverview>(`${this.baseUrl}/admin/overview`);
  }

  getAdminUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.baseUrl}/admin/users`);
  }

  createAdminUser(payload: { userName: string; password: string; role: string }): Observable<AdminUser> {
    return this.http.post<AdminUser>(`${this.baseUrl}/admin/users`, payload);
  }

  updateAdminUserRole(userId: number, payload: { role: string }): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.baseUrl}/admin/users/${userId}/role`, payload);
  }

  deleteAdminUser(id: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/admin/users/${id}`, { responseType: 'text' });
  }

  downloadAttachment(reportId: string, fileName?: string | null): Observable<void> {
    return this.http.get(`${this.baseUrl}/reports/${reportId}/attachment`, { responseType: 'blob' }).pipe(
      tap((blob) => {
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName || 'attachment';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      }),
      map(() => void 0)
    );
  }
}
