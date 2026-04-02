import {
  type AttendanceReportPayload,
  buildAttendanceReportContent,
  createAttendanceExcelFile,
  createEmptyAttendanceReport,
  normalizeAttendanceReportPayload,
  parseAttendanceReportContent
} from './templates/attendance/logic';
import {
  type ElectricityRevenueReportPayload,
  buildElectricityRevenueReportContent,
  createElectricityRevenueExcelFile,
  createEmptyElectricityRevenueReport,
  normalizeElectricityRevenueReportPayload,
  parseElectricityRevenueReportContent
} from './templates/electricity-revenue/logic';
import type {
  DefaultResubmitFormFactory,
  ReportTemplateKind,
  ReportTemplateOption,
  ResubmitFormState,
  StructuredReportPreview,
  TemplateSubmissionContext,
  TemplateSubmissionResult
} from './report-template-types';

const REPORT_TEMPLATE_OPTION_MAP: Record<ReportTemplateKind, ReportTemplateOption> = {
  attendance: {
    value: 'attendance',
    label: 'Báo cáo chấm công',
    titlePlaceholder: 'Ví dụ: Báo cáo chấm công tháng 03/2026'
  },
  electricityRevenue: {
    value: 'electricityRevenue',
    label: 'Bảng chi tiết doanh thu điện',
    titlePlaceholder: 'Ví dụ: Bảng chi tiết doanh thu điện tháng 03/2026'
  }
};

const REPORT_TEMPLATE_SHOWCASE_OPTIONS: ReportTemplateOption[] = [
  {
    value: 'daily-operation',
    label: 'Báo cáo vận hành ngày',
    titlePlaceholder: 'Ví dụ: Báo cáo vận hành ngày 31/03/2026',
    disabled: true
  },
  {
    value: 'grid-incident',
    label: 'Báo cáo sự cố lưới điện',
    titlePlaceholder: 'Ví dụ: Báo cáo sự cố lưới điện khu vực A',
    disabled: true
  },
  {
    value: 'maintenance-plan',
    label: 'Báo cáo kế hoạch bảo trì định kỳ',
    titlePlaceholder: 'Ví dụ: Báo cáo bảo trì định kỳ quý II/2026',
    disabled: true
  },
  {
    value: 'materials-inventory',
    label: 'Báo cáo tồn kho vật tư',
    titlePlaceholder: 'Ví dụ: Báo cáo tồn kho vật tư tháng 03/2026',
    disabled: true
  },
  {
    value: 'customer-service',
    label: 'Báo cáo chăm sóc khách hàng',
    titlePlaceholder: 'Ví dụ: Báo cáo chăm sóc khách hàng tuần 13',
    disabled: true
  },
  {
    value: 'project-progress',
    label: 'Báo cáo tiến độ dự án cải tạo',
    titlePlaceholder: 'Ví dụ: Báo cáo tiến độ dự án trạm biến áp',
    disabled: true
  },
  {
    value: 'safety',
    label: 'Báo cáo an toàn lao động',
    titlePlaceholder: 'Ví dụ: Báo cáo an toàn lao động tháng 03/2026',
    disabled: true
  },
  {
    value: 'fire-safety',
    label: 'Báo cáo PCCC và ứng cứu khẩn cấp',
    titlePlaceholder: 'Ví dụ: Báo cáo kiểm tra PCCC quý I/2026',
    disabled: true
  },
  {
    value: 'power-quality',
    label: 'Báo cáo chất lượng điện áp',
    titlePlaceholder: 'Ví dụ: Báo cáo chất lượng điện áp tháng 03/2026',
    disabled: true
  },
  {
    value: 'debt',
    label: 'Báo cáo công nợ khách hàng',
    titlePlaceholder: 'Ví dụ: Báo cáo công nợ khách hàng tháng 03/2026',
    disabled: true
  },
  {
    value: 'expense',
    label: 'Báo cáo tổng hợp chi phí',
    titlePlaceholder: 'Ví dụ: Báo cáo tổng hợp chi phí quý I/2026',
    disabled: true
  },
  {
    value: 'kpi',
    label: 'Báo cáo đánh giá KPI nhân sự',
    titlePlaceholder: 'Ví dụ: Báo cáo KPI nhân sự quý I/2026',
    disabled: true
  },
  {
    value: 'inspection',
    label: 'Báo cáo kiểm tra thiết bị hiện trường',
    titlePlaceholder: 'Ví dụ: Báo cáo kiểm tra thiết bị đợt 1',
    disabled: true
  },
  {
    value: 'environment',
    label: 'Báo cáo môi trường định kỳ',
    titlePlaceholder: 'Ví dụ: Báo cáo môi trường quý I/2026',
    disabled: true
  },
  {
    value: 'shift-handover',
    label: 'Báo cáo bàn giao ca trực',
    titlePlaceholder: 'Ví dụ: Báo cáo bàn giao ca trực tối',
    disabled: true
  },
  {
    value: 'asset-audit',
    label: 'Báo cáo kiểm kê tài sản',
    titlePlaceholder: 'Ví dụ: Báo cáo kiểm kê tài sản 6 tháng đầu năm',
    disabled: true
  },
  {
    value: 'purchase-request',
    label: 'Báo cáo đề xuất mua sắm',
    titlePlaceholder: 'Ví dụ: Báo cáo đề xuất mua sắm thiết bị văn phòng',
    disabled: true
  },
  {
    value: 'complaint',
    label: 'Báo cáo tiếp nhận và xử lý kiến nghị',
    titlePlaceholder: 'Ví dụ: Báo cáo xử lý kiến nghị tháng 03/2026',
    disabled: true
  }
];

interface TemplateSubmissionOptions {
  actionLabel?: string;
}

export const REPORT_TEMPLATE_OPTIONS: ReportTemplateOption[] = [
  REPORT_TEMPLATE_OPTION_MAP.attendance,
  REPORT_TEMPLATE_OPTION_MAP.electricityRevenue,
  ...REPORT_TEMPLATE_SHOWCASE_OPTIONS
];

export function getTemplateTitlePlaceholder(kind: ReportTemplateKind): string {
  return REPORT_TEMPLATE_OPTION_MAP[kind].titlePlaceholder;
}

export function parseStructuredReportContent(content: string): StructuredReportPreview {
  const attendancePayload = parseAttendanceReportContent(content);
  if (attendancePayload) {
    return { kind: 'attendance', payload: attendancePayload };
  }

  const electricityRevenuePayload = parseElectricityRevenueReportContent(content);
  if (electricityRevenuePayload) {
    return { kind: 'electricityRevenue', payload: electricityRevenuePayload };
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
      error: `Cần ít nhất một dòng chấm công trước khi ${actionLabel}.`
    };
  }

  return {
    submission: {
      content: buildAttendanceReportContent(normalizedAttendancePayload),
      attachment: createAttendanceExcelFile(normalizedAttendancePayload, context.title.trim())
    },
    error: ''
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
      error: `Cần ít nhất một dòng doanh thu điện trước khi ${actionLabel}.`
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
    error: ''
  };
}

export function createTemplateSubmission(
  templateKind: ReportTemplateKind,
  context: TemplateSubmissionContext,
  options: TemplateSubmissionOptions = {}
): TemplateSubmissionResult {
  const actionLabel = options.actionLabel ?? 'gửi báo cáo';

  if (templateKind === 'attendance') {
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
    content: '',
    templateKind: 'attendance',
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
    content: '',
    templateKind: 'electricityRevenue',
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
  const structuredReport = parseStructuredReportContent(report.content);

  if (structuredReport?.kind === 'attendance') {
    return createAttendanceResubmitState(report.title, structuredReport.payload);
  }

  if (structuredReport?.kind === 'electricityRevenue') {
    return createElectricityRevenueResubmitState(report.title, structuredReport.payload);
  }

  return {
    title: report.title,
    content: report.content,
    templateKind: null,
    attendancePayload: null,
    electricityRevenuePayload: null
  };
};
