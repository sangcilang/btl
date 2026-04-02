import {
  type AttendanceReportPayload,
  buildAttendanceReportContent,
  createAttendanceExcelFile,
  createEmptyAttendanceReport,
  normalizeAttendanceReportPayload,
  parseAttendanceReportContent
} from "./templates/attendance/logic";
import {
  type ElectricityRevenueReportPayload,
  buildElectricityRevenueReportContent,
  createElectricityRevenueExcelFile,
  createEmptyElectricityRevenueReport,
  normalizeElectricityRevenueReportPayload,
  parseElectricityRevenueReportContent
} from "./templates/electricity-revenue/logic";
import type {
  DefaultResubmitFormFactory,
  ReportTemplateKind,
  ReportTemplateOption,
  ResubmitFormState,
  StructuredReport,
  TemplateSubmissionContext,
  TemplateSubmissionResult
} from "./reportTemplateTypes";

const REPORT_TEMPLATE_OPTION_MAP: Record<ReportTemplateKind, ReportTemplateOption> = {
  attendance: {
    value: "attendance",
    label: "B\u00e1o c\u00e1o ch\u1ea5m c\u00f4ng",
    titlePlaceholder: "V\u00ed d\u1ee5: B\u00e1o c\u00e1o ch\u1ea5m c\u00f4ng th\u00e1ng 03/2026"
  },
  electricityRevenue: {
    value: "electricityRevenue",
    label: "B\u1ea3ng chi ti\u1ebft doanh thu \u0111i\u1ec7n",
    titlePlaceholder:
      "V\u00ed d\u1ee5: B\u1ea3ng chi ti\u1ebft doanh thu \u0111i\u1ec7n th\u00e1ng 03/2026"
  }
};

export const REPORT_TEMPLATE_OPTIONS: ReportTemplateOption[] = [
  REPORT_TEMPLATE_OPTION_MAP.attendance,
  REPORT_TEMPLATE_OPTION_MAP.electricityRevenue
];

interface TemplateSubmissionOptions {
  actionLabel?: string;
}

export function getTemplateTitlePlaceholder(kind: ReportTemplateKind): string {
  return REPORT_TEMPLATE_OPTION_MAP[kind].titlePlaceholder;
}

export function parseStructuredReport(content: string): StructuredReport {
  const attendancePayload = parseAttendanceReportContent(content);
  if (attendancePayload) {
    return { kind: "attendance", payload: attendancePayload };
  }

  const electricityRevenuePayload = parseElectricityRevenueReportContent(content);
  if (electricityRevenuePayload) {
    return { kind: "electricityRevenue", payload: electricityRevenuePayload };
  }

  return null;
}

function createAttendanceTemplateSubmission(
  context: TemplateSubmissionContext,
  actionLabel: string
): TemplateSubmissionResult {
  const normalizedAttendancePayload = normalizeAttendanceReportPayload(context.attendancePayload);

  if (normalizedAttendancePayload.rows.length === 0) {
    return {
      submission: null,
      error: `C\u1ea7n \u00edt nh\u1ea5t m\u1ed9t d\u00f2ng ch\u1ea5m c\u00f4ng tr\u01b0\u1edbc khi ${actionLabel}.`
    };
  }

  return {
    submission: {
      content: buildAttendanceReportContent(normalizedAttendancePayload),
      attachment: createAttendanceExcelFile(normalizedAttendancePayload, context.title.trim())
    },
    error: ""
  };
}

function createElectricityRevenueTemplateSubmission(
  context: TemplateSubmissionContext,
  actionLabel: string
): TemplateSubmissionResult {
  const normalizedElectricityRevenuePayload = normalizeElectricityRevenueReportPayload(
    context.electricityRevenuePayload
  );

  if (normalizedElectricityRevenuePayload.rows.length === 0) {
    return {
      submission: null,
      error: `C\u1ea7n \u00edt nh\u1ea5t m\u1ed9t d\u00f2ng doanh thu \u0111i\u1ec7n tr\u01b0\u1edbc khi ${actionLabel}.`
    };
  }

  return {
    submission: {
      content: buildElectricityRevenueReportContent(normalizedElectricityRevenuePayload),
      attachment: createElectricityRevenueExcelFile(
        normalizedElectricityRevenuePayload,
        context.title.trim()
      )
    },
    error: ""
  };
}

export function createTemplateSubmission(
  templateKind: ReportTemplateKind,
  context: TemplateSubmissionContext,
  options: TemplateSubmissionOptions = {}
): TemplateSubmissionResult {
  const actionLabel = options.actionLabel ?? "g\u1eedi b\u00e1o c\u00e1o";

  if (templateKind === "attendance") {
    return createAttendanceTemplateSubmission(context, actionLabel);
  }

  return createElectricityRevenueTemplateSubmission(context, actionLabel);
}

function createAttendanceResubmitState(
  reportTitle: string,
  payload: AttendanceReportPayload
): ResubmitFormState {
  return {
    title: reportTitle,
    content: "",
    attachment: null,
    templateKind: "attendance",
    attendancePayload: {
      ...payload,
      rows: payload.rows.length > 0 ? payload.rows : createEmptyAttendanceReport().rows
    },
    electricityRevenuePayload: null
  };
}

function createElectricityRevenueResubmitState(
  reportTitle: string,
  payload: ElectricityRevenueReportPayload
): ResubmitFormState {
  return {
    title: reportTitle,
    content: "",
    attachment: null,
    templateKind: "electricityRevenue",
    attendancePayload: null,
    electricityRevenuePayload: {
      ...payload,
      rows:
        payload.rows.length > 0
          ? payload.rows
          : createEmptyElectricityRevenueReport().rows
    }
  };
}

export const createDefaultResubmitForm: DefaultResubmitFormFactory = (report) => {
  const structuredReport = parseStructuredReport(report.content);

  if (structuredReport?.kind === "attendance") {
    return createAttendanceResubmitState(report.title, structuredReport.payload);
  }

  if (structuredReport?.kind === "electricityRevenue") {
    return createElectricityRevenueResubmitState(report.title, structuredReport.payload);
  }

  return {
    title: report.title,
    content: report.content,
    attachment: null,
    templateKind: null,
    attendancePayload: null,
    electricityRevenuePayload: null
  };
};
