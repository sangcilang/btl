import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ReportHistoryItem, ReportItem } from '../../core/models';
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
  selector: 'app-approvals',
  templateUrl: './approvals.component.html',
  styleUrls: ['./approvals.component.scss']
})
export class ApprovalsComponent implements OnInit {
  pendingReports: ReportItem[] = [];
  structuredReportsById: Record<string, StructuredReportPreview> = {};
  selectedHistory: ReportHistoryItem[] = [];
  comments: Record<string, string> = {};
  message = '';
  errorMessage = '';
  isSubmitting = false;

  constructor(
    private readonly apiService: ApiService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadPending();
  }

  private get level(): number {
    const role = this.authService.currentUser?.role;
    return role === 'Manager' ? 1 : 2;
  }

  loadPending(): void {
    this.apiService.getPending(this.level).subscribe({
      next: (rows) => {
        this.pendingReports = rows;
        this.structuredReportsById = rows.reduce<Record<string, StructuredReportPreview>>((acc, report) => {
          acc[report.id] = parseStructuredReportContent(report.content);
          return acc;
        }, {});
      },
      error: (error) => { this.errorMessage = this.resolveError(error); }
    });
  }

  submitDecision(report: ReportItem, isReturn: boolean): void {
    const user = this.authService.currentUser;
    if (!user || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.message = '';

    const req$ = isReturn
      ? this.apiService.returnReport(report.id, this.comments[report.id] ?? '')
      : this.apiService.approveReport(report.id, this.comments[report.id] ?? '');

    req$.subscribe({
      next: (res) => {
        this.message = res.message;
        this.comments[report.id] = '';
        this.isSubmitting = false;
        this.loadPending();
      },
      error: (error) => {
        this.errorMessage = this.resolveError(error);
        this.isSubmitting = false;
      }
    });
  }

  loadHistory(reportId: string): void {
    this.apiService.getHistory(reportId).subscribe({
      next: (rows) => { this.selectedHistory = rows; },
      error: (error) => { this.errorMessage = this.resolveError(error); }
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

  private resolveError(error: unknown): string {
    const httpError = error as { error?: unknown; message?: string };
    if (typeof httpError.error === 'string') {
      return httpError.error;
    }
    return httpError.message || 'Đã xảy ra lỗi.';
  }
}
