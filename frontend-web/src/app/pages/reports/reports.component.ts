import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { AuthUser, ReportHistoryItem, ReportItem } from '../../core/models';
import {
  REPORT_TEMPLATE_OPTIONS,
  createDefaultResubmitForm,
  createTemplateSubmission,
  getTemplateTitlePlaceholder,
  parseStructuredReportContent
} from './report-templates';
import type {
  ReportFormMode,
  ReportTemplateKind,
  ReportTemplateOption,
  StructuredReportPreview
} from './report-template-types';
import {
  createEmptyAttendanceReport,
  type AttendanceReportPayload
} from './templates/attendance/logic';
import {
  createEmptyElectricityRevenueReport,
  type ElectricityRevenueReportPayload
} from './templates/electricity-revenue/logic';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  user: AuthUser | null = null;
  reports: ReportItem[] = [];
  structuredReportsById: Record<string, StructuredReportPreview> = {};
  selectedHistory: ReportHistoryItem[] = [];
  selectedHistoryReportId = '';
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  statusMessage = '';
  selectedFile: File | null = null;
  resubmitReportId: string | null = null;
  reportMode: ReportFormMode = 'standard';
  templateKind: ReportTemplateKind = 'attendance';
  attendanceReport = createEmptyAttendanceReport();
  electricityRevenueReport = createEmptyElectricityRevenueReport();
  readonly reportTemplateOptions: ReportTemplateOption[] = REPORT_TEMPLATE_OPTIONS;

  readonly reportForm = this.formBuilder.group({
    title: ['', [Validators.required]],
    content: ['']
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly apiService: ApiService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.user = this.authService.currentUser;
    this.loadReports();
  }

  get isStaff(): boolean {
    return (this.user?.role ?? '').toLowerCase() === 'staff';
  }

  get isAdmin(): boolean {
    return (this.user?.role ?? '').toLowerCase() === 'admin';
  }

  get canCreateReport(): boolean {
    return !!this.user && !this.isAdmin;
  }

  get titlePlaceholder(): string {
    if (this.reportMode === 'standard') {
      return 'Nhập tiêu đề';
    }

    return getTemplateTitlePlaceholder(this.templateKind);
  }

  get submitLabel(): string {
    if (this.isSubmitting) {
      return 'Đang xử lý...';
    }

    return this.resubmitReportId ? 'Nộp lại' : 'Gửi báo cáo';
  }

  get hasValidTitle(): boolean {
    return !!this.reportForm.controls['title'].value?.trim();
  }

  onReportModeChange(mode: ReportFormMode): void {
    this.reportMode = mode;
    this.errorMessage = '';
  }

  onTemplateKindChange(kind: string): void {
    if (kind !== 'attendance' && kind !== 'electricityRevenue') {
      return;
    }

    this.templateKind = kind;
    this.errorMessage = '';
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  loadReports(): void {
    if (!this.user) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const request$ = this.isAdmin
      ? this.apiService.getAdminReports()
      : this.apiService.getReports();

    request$
      .pipe(finalize(() => {
        this.isLoading = false;
      }))
      .subscribe({
        next: (rows) => {
          this.reports = rows;
          this.structuredReportsById = rows.reduce<Record<string, StructuredReportPreview>>((acc, report) => {
            acc[report.id] = parseStructuredReportContent(report.content);
            return acc;
          }, {});
        },
        error: (error) => {
          this.errorMessage = this.resolveError(error);
        }
      });
  }

  submitReport(): void {
    if (!this.user || !this.hasValidTitle || this.isSubmitting) {
      this.reportForm.markAllAsTouched();
      return;
    }

    const title = this.reportForm.controls['title'].value?.trim() || '';
    let content = this.reportForm.controls['content'].value?.trim() || '';
    let attachment = this.selectedFile;

    if (this.reportMode === 'standard') {
      if (!content) {
        this.errorMessage = 'Nội dung là bắt buộc.';
        return;
      }
    } else {
      const { submission, error } = createTemplateSubmission(
        this.templateKind,
        {
          title,
          attendancePayload: this.attendanceReport,
          electricityRevenuePayload: this.electricityRevenueReport
        },
        { actionLabel: this.resubmitReportId ? 'nộp lại' : 'gửi báo cáo' }
      );

      if (!submission) {
        this.errorMessage = error;
        return;
      }

      content = submission.content;
      attachment = submission.attachment;
    }

    const formData = new FormData();
    formData.append('Title', title);
    formData.append('Content', content);
    if (attachment) {
      formData.append('Attachment', attachment);
    }

    this.errorMessage = '';
    this.statusMessage = '';
    this.isSubmitting = true;

    if (this.resubmitReportId) {
      this.apiService.resubmitReport(this.resubmitReportId, formData)
        .pipe(finalize(() => {
          this.isSubmitting = false;
        }))
        .subscribe({
          next: (res) => {
            this.statusMessage = res.message || 'Nộp lại thành công.';
            this.resetForm();
            this.loadReports();
          },
          error: (error) => {
            this.errorMessage = this.resolveError(error);
          }
        });
      return;
    }

    this.apiService.createReport(formData)
      .pipe(finalize(() => {
        this.isSubmitting = false;
      }))
      .subscribe({
        next: () => {
          this.statusMessage = 'Tạo báo cáo thành công.';
          this.resetForm();
          this.loadReports();
        },
        error: (error) => {
          this.errorMessage = this.resolveError(error);
        }
      });
  }

  startResubmit(report: ReportItem): void {
    const formState = createDefaultResubmitForm(report);

    this.resubmitReportId = report.id;
    this.selectedFile = null;
    this.reportForm.patchValue({
      title: formState.title,
      content: formState.content
    });

    if (formState.templateKind === 'attendance' && formState.attendancePayload) {
      this.reportMode = 'template';
      this.templateKind = 'attendance';
      this.attendanceReport = formState.attendancePayload;
      this.electricityRevenueReport = createEmptyElectricityRevenueReport();
      return;
    }

    if (formState.templateKind === 'electricityRevenue' && formState.electricityRevenuePayload) {
      this.reportMode = 'template';
      this.templateKind = 'electricityRevenue';
      this.electricityRevenueReport = formState.electricityRevenuePayload;
      this.attendanceReport = createEmptyAttendanceReport();
      return;
    }

    this.reportMode = 'standard';
    this.attendanceReport = createEmptyAttendanceReport();
    this.electricityRevenueReport = createEmptyElectricityRevenueReport();
  }

  cancelResubmit(): void {
    this.resetForm();
  }

  deleteReport(report: ReportItem): void {
    if (!this.user) {
      return;
    }

    if (!window.confirm(`Xóa báo cáo "${report.title}"?`)) {
      return;
    }

    this.apiService.deleteReport(report.id, this.isAdmin).subscribe({
      next: (message) => {
        this.statusMessage = message || 'Xóa thành công.';
        this.loadReports();
      },
      error: (error) => {
        this.errorMessage = this.resolveError(error);
      }
    });
  }

  loadHistory(report: ReportItem): void {
    this.selectedHistoryReportId = report.id;
    this.apiService.getHistory(report.id).subscribe({
      next: (history) => {
        this.selectedHistory = history;
      },
      error: (error) => {
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

  private resetForm(): void {
    this.reportForm.reset({ title: '', content: '' });
    this.selectedFile = null;
    this.resubmitReportId = null;
    this.reportMode = 'standard';
    this.templateKind = 'attendance';
    this.attendanceReport = createEmptyAttendanceReport();
    this.electricityRevenueReport = createEmptyElectricityRevenueReport();
  }

  private resolveError(error: unknown): string {
    const httpError = error as { error?: unknown; message?: string };
    if (typeof httpError.error === 'string') {
      return httpError.error;
    }

    return httpError.message || 'Đã xảy ra lỗi.';
  }
}
