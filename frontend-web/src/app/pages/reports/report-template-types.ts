import type { ReportItem } from '../../core/models';
import type { AttendanceReportPayload } from './templates/attendance/logic';
import type { ElectricityRevenueReportPayload } from './templates/electricity-revenue/logic';

export type ReportFormMode = 'standard' | 'template';
export type ReportTemplateKind = 'attendance' | 'electricityRevenue';

export interface ReportTemplateOption {
  value: string;
  label: string;
  titlePlaceholder: string;
  disabled?: boolean;
}

export type StructuredReportPreview =
  | { kind: 'attendance'; payload: AttendanceReportPayload }
  | { kind: 'electricityRevenue'; payload: ElectricityRevenueReportPayload }
  | null;

export interface TemplateSubmissionContext {
  title: string;
  attendancePayload: AttendanceReportPayload;
  electricityRevenuePayload: ElectricityRevenueReportPayload;
}

export interface TemplateSubmission {
  content: string;
  attachment: File;
}

export interface TemplateSubmissionResult {
  submission: TemplateSubmission | null;
  error: string;
}

export interface ResubmitFormState {
  title: string;
  content: string;
  templateKind: ReportTemplateKind | null;
  attendancePayload: AttendanceReportPayload | null;
  electricityRevenuePayload: ElectricityRevenueReportPayload | null;
}

export interface DefaultResubmitFormFactory {
  (report: ReportItem): ResubmitFormState;
}
