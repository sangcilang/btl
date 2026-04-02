import type { Report } from "../../types";
import type { AttendanceReportPayload } from "./templates/attendance/logic";
import type { ElectricityRevenueReportPayload } from "./templates/electricity-revenue/logic";

export type ReportFormMode = "standard" | "template";
export type ReportTemplateKind = "attendance" | "electricityRevenue";

export interface ReportTemplateOption {
  value: ReportTemplateKind;
  label: string;
  titlePlaceholder: string;
}

export type StructuredReport =
  | { kind: "attendance"; payload: AttendanceReportPayload }
  | { kind: "electricityRevenue"; payload: ElectricityRevenueReportPayload }
  | null;

export interface ResubmitFormState {
  title: string;
  content: string;
  attachment: File | null;
  templateKind: ReportTemplateKind | null;
  attendancePayload: AttendanceReportPayload | null;
  electricityRevenuePayload: ElectricityRevenueReportPayload | null;
}

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

export interface DefaultResubmitFormFactory {
  (report: Report): ResubmitFormState;
}
