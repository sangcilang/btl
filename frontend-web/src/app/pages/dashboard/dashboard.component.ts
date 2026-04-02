import { Component, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { AuthUser, ReportHistoryItem, ReportItem, ReportStats } from '../../core/models';
import { parseStructuredReportContent } from '../reports/report-templates';
import type { StructuredReportPreview } from '../reports/report-template-types';
import {
  createEmptyAttendanceReport,
  type AttendanceReportPayload
} from '../reports/templates/attendance/logic';
import {
  createEmptyElectricityRevenueReport,
  type ElectricityRevenueReportPayload
} from '../reports/templates/electricity-revenue/logic';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  user: AuthUser | null = null;
  reports: ReportItem[] = [];
  pendingReports: ReportItem[] = [];
  structuredReportsById: Record<string, StructuredReportPreview> = {};
  selectedHistory: ReportHistoryItem[] = [];
  selectedHistoryReportId = '';
  stats: ReportStats | null = null;
  isLoading = false;
  isSubmitting = false;
  statusMessage = '';
  errorMessage = '';
  actionComments: Record<string, string> = {};
  selectedFile: File | null = null;
  resubmitReportId: string | null = null;

  readonly reportForm = this.formBuilder.group({
    title: [''],
    content: ['']
  });

  constructor(
    private readonly formBuilder: import('@angular/forms').FormBuilder,
    private readonly apiService: ApiService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.user = this.authService.currentUser;
    this.loadDashboardData();
  }

  get isStaff(): boolean {
    return (this.user?.role ?? '').toLowerCase() === 'staff';
  }

  get isManager(): boolean {
    return (this.user?.role ?? '').toLowerCase() === 'manager';
  }

  get isDirector(): boolean {
    return (this.user?.role ?? '').toLowerCase() === 'director';
  }

  get isAdmin(): boolean {
    return (this.user?.role ?? '').toLowerCase() === 'admin';
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  loadDashboardData(): void {
    if (!this.user) {
      return;
    }

    this.errorMessage = '';
    this.statusMessage = '';
    this.isLoading = true;

    const stats$ = (this.isManager || this.isDirector || this.isAdmin)
      ? this.apiService.getStats()
      : of(null);

    const reports$ = this.isAdmin
      ? this.apiService.getAdminReports()
      : this.apiService.getReports();

    const pending$ = (this.isManager || this.isDirector)
      ? this.apiService.getPending(this.isManager ? 1 : 2)
      : of([]);

    forkJoin({
      stats: stats$,
      reports: reports$,
      pending: pending$
    }).pipe(
      finalize(() => { this.isLoading = false; }),
      catchError((error) => {
        this.errorMessage = this.resolveError(error);
        return of({ stats: null, reports: [], pending: [] });
      })
    ).subscribe((result) => {
      this.stats = result.stats;
      this.reports = result.reports;
      this.pendingReports = result.pending;
      this.structuredReportsById = [...result.reports, ...result.pending].reduce<
        Record<string, StructuredReportPreview>
      >((acc, report) => {
        acc[report.id] = parseStructuredReportContent(report.content);
        return acc;
      }, {});
    });
  }

  submitReport(): void {
    if (!this.user || this.isSubmitting) {
      this.reportForm.markAllAsTouched();
      return;
    }

    const title = this.reportForm.controls['title'].value ?? '';
    const content = this.reportForm.controls['content'].value ?? '';
    if (!title.trim() || !content.trim()) {
      this.errorMessage = 'Tiêu đề và nội dung là bắt buộc.';
      return;
    }

    const formData = new FormData();
    formData.append('Title', title);
    formData.append('Content', content);
    if (this.selectedFile) {
      formData.append('Attachment', this.selectedFile);
    }

    this.errorMessage = '';
    this.statusMessage = '';
    this.isSubmitting = true;

    if (this.resubmitReportId) {
      this.apiService.resubmitReport(this.resubmitReportId, formData)
        .pipe(finalize(() => { this.isSubmitting = false; }))
        .subscribe({
          next: () => {
            this.statusMessage = 'Nộp lại báo cáo thành công.';
            this.resetForm();
            this.loadDashboardData();
          },
          error: (error) => {
            this.errorMessage = this.resolveError(error);
          }
        });
      return;
    }

    this.apiService.createReport(formData)
      .pipe(finalize(() => { this.isSubmitting = false; }))
      .subscribe({
        next: () => {
          this.statusMessage = 'Tạo báo cáo thành công.';
          this.resetForm();
          this.loadDashboardData();
        },
        error: (error) => {
          this.errorMessage = this.resolveError(error);
        }
      });
  }

  startResubmit(report: ReportItem): void {
    this.resubmitReportId = report.id;
    this.reportForm.patchValue({
      title: report.title,
      content: report.content
    });
  }

  cancelResubmit(): void {
    this.resubmitReportId = null;
    this.resetForm();
  }

  submitDecision(report: ReportItem, isReturn: boolean): void {
    if (!this.user || this.isSubmitting) {
      return;
    }

    const comment = this.actionComments[report.id] ?? '';
    this.errorMessage = '';
    this.statusMessage = '';
    this.isSubmitting = true;

    const request$ = isReturn
      ? this.apiService.returnReport(report.id, comment)
      : this.apiService.approveReport(report.id, comment);

    request$
      .pipe(finalize(() => { this.isSubmitting = false; }))
      .subscribe({
        next: (res) => {
          this.statusMessage = res.message || (isReturn ? 'Đã trả báo cáo.' : 'Đã duyệt báo cáo.');
          this.actionComments[report.id] = '';
          this.loadDashboardData();
        },
        error: (error) => {
          this.errorMessage = this.resolveError(error);
        }
      });
  }

  loadHistory(report: ReportItem): void {
    this.errorMessage = '';
    this.selectedHistoryReportId = report.id;
    this.apiService.getHistory(report.id).subscribe({
      next: (history) => {
        this.selectedHistory = history;
      },
      error: (error) => {
        this.selectedHistory = [];
        this.errorMessage = this.resolveError(error);
      }
    });
  }

  downloadAttachment(report: ReportItem): void {
    this.apiService.downloadAttachment(report.id, report.fileOriginalName).subscribe({
      error: (error) => {
        this.errorMessage = this.resolveError(error);
      }
    });
  }

  toAttendancePayload(structured: StructuredReportPreview): AttendanceReportPayload {
    return structured?.kind === 'attendance' ? structured.payload : createEmptyAttendanceReport();
  }

  toElectricityRevenuePayload(structured: StructuredReportPreview): ElectricityRevenueReportPayload {
    return structured?.kind === 'electricityRevenue'
      ? structured.payload
      : createEmptyElectricityRevenueReport();
  }

  deleteReport(report: ReportItem): void {
    if (!this.user) {
      return;
    }
    const isDelete = window.confirm(`Xóa báo cáo "${report.title}"?`);
    if (!isDelete) {
      return;
    }

    this.apiService.deleteReport(report.id, this.isAdmin).subscribe({
      next: (message) => {
        this.statusMessage = message || 'Xóa báo cáo thành công.';
        this.loadDashboardData();
      },
      error: (error) => {
        this.errorMessage = this.resolveError(error);
      }
    });
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/login';
  }

  private resetForm(): void {
    this.reportForm.reset();
    this.selectedFile = null;
    this.resubmitReportId = null;
  }

  private resolveError(error: unknown): string {
    const httpError = error as { error?: unknown; message?: string };
    if (typeof httpError.error === 'string') {
      return httpError.error;
    }

    if (httpError.error && typeof httpError.error === 'object') {
      const record = httpError.error as Record<string, unknown>;
      if (typeof record['message'] === 'string') {
        return record['message'];
      }
    }

    return httpError.message || 'Đã xảy ra lỗi.';
  }
}
