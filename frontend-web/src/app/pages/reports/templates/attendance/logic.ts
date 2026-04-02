export interface AttendanceReportRow {
  id: string;
  employeeCode: string;
  accountName: string;
  workDate: string;
  checkInTime: string;
  checkOutTime: string;
  workUnits: string;
  overtimeHours: string;
  lateDuration: string;
  attendanceStatus: string;
  approvalStatus: string;
  approvedBy: string;
}

export interface AttendanceReportPayload {
  kind: 'attendance';
  version: 1;
  reportPeriod: string;
  description: string;
  rows: AttendanceReportRow[];
}

const ATTENDANCE_REPORT_PREFIX = 'ATTENDANCE_REPORT_V1';

function extractPayloadJson(content: string, prefix: string): string | null {
  const normalizedContent = content.replace(/^\uFEFF/, '');
  const match = normalizedContent.match(new RegExp(`^${prefix}\\r?\\n`));

  if (!match) {
    return null;
  }

  return normalizedContent.slice(match[0].length);
}

function createRowId(): string {
  const cryptoObject = typeof crypto !== 'undefined' ? crypto : undefined;
  if (cryptoObject && typeof cryptoObject.randomUUID === 'function') {
    return cryptoObject.randomUUID();
  }

  return `attendance-row-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function cleanValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function createCell(value: string, styleId = 'Body'): string {
  return `<Cell ss:StyleID="${styleId}"><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`;
}

function hasMeaningfulRowValue(row: AttendanceReportRow): boolean {
  return [
    row.employeeCode,
    row.accountName,
    row.workDate,
    row.checkInTime,
    row.checkOutTime,
    row.workUnits,
    row.overtimeHours,
    row.lateDuration,
    row.attendanceStatus,
    row.approvalStatus,
    row.approvedBy
  ].some((value) => cleanValue(value).length > 0);
}

function sanitizeFileNameSegment(value: string): string {
  const sanitized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();

  return sanitized || 'bao-cao-cham-cong';
}

function buildWorkbookXml(title: string, payload: AttendanceReportPayload): string {
  const headers = [
    'Mã NV',
    'Tên tài khoản',
    'Ngày',
    'Giờ vào',
    'Giờ ra',
    'Công',
    'OT',
    'Đi muộn',
    'Trạng thái',
    'Duyệt',
    'Người duyệt'
  ];

  const headerRow = `<Row>${headers.map((header) => createCell(header, 'Header')).join('')}</Row>`;
  const dataRows = payload.rows
    .map((row) => {
      return `<Row>${
        [
          row.employeeCode || '-',
          row.accountName || '-',
          row.workDate || '-',
          row.checkInTime || '-',
          row.checkOutTime || '-',
          row.workUnits || '-',
          row.overtimeHours || '-',
          row.lateDuration || '-',
          row.attendanceStatus || '-',
          row.approvalStatus || '-',
          row.approvedBy || '-'
        ]
          .map((value) => createCell(value))
          .join('')
      }</Row>`;
    })
    .join('');

  const infoRows = [
    `<Row>${createCell(title || 'Báo cáo chấm công', 'Title')}</Row>`,
    payload.reportPeriod
      ? `<Row>${createCell(`Kỳ chấm công: ${payload.reportPeriod}`, 'Meta')}</Row>`
      : '',
    payload.description
      ? `<Row>${createCell(`Ghi chú: ${payload.description}`, 'Meta')}</Row>`
      : '',
    '<Row/>'
  ].join('');

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook
  xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:html="http://www.w3.org/TR/REC-html40">
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Center"/>
      <Borders/>
      <Font ss:FontName="Calibri" ss:Size="11"/>
      <Interior/>
      <NumberFormat/>
      <Protection/>
    </Style>
    <Style ss:ID="Title">
      <Font ss:FontName="Calibri" ss:Size="14" ss:Bold="1"/>
    </Style>
    <Style ss:ID="Meta">
      <Font ss:FontName="Calibri" ss:Size="11"/>
    </Style>
    <Style ss:ID="Header">
      <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/>
      <Interior ss:Color="#D9EAF7" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      </Borders>
    </Style>
    <Style ss:ID="Body">
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
      </Borders>
    </Style>
  </Styles>
  <Worksheet ss:Name="Cham cong">
    <Table>
      ${infoRows}
      ${headerRow}
      ${dataRows}
    </Table>
  </Worksheet>
</Workbook>`;
}

export function createEmptyAttendanceRow(
  overrides: Partial<AttendanceReportRow> = {}
): AttendanceReportRow {
  return {
    id: overrides.id ?? createRowId(),
    employeeCode: overrides.employeeCode ?? '',
    accountName: overrides.accountName ?? '',
    workDate: overrides.workDate ?? '',
    checkInTime: overrides.checkInTime ?? '',
    checkOutTime: overrides.checkOutTime ?? '',
    workUnits: overrides.workUnits ?? '',
    overtimeHours: overrides.overtimeHours ?? '',
    lateDuration: overrides.lateDuration ?? '',
    attendanceStatus: overrides.attendanceStatus ?? '',
    approvalStatus: overrides.approvalStatus ?? '',
    approvedBy: overrides.approvedBy ?? ''
  };
}

export function createEmptyAttendanceReport(): AttendanceReportPayload {
  return {
    kind: 'attendance',
    version: 1,
    reportPeriod: '',
    description: '',
    rows: [createEmptyAttendanceRow()]
  };
}

export function normalizeAttendanceReportPayload(
  payload: AttendanceReportPayload
): AttendanceReportPayload {
  return {
    kind: 'attendance',
    version: 1,
    reportPeriod: cleanValue(payload.reportPeriod),
    description: cleanValue(payload.description),
    rows: (payload.rows ?? [])
      .map((row) =>
        createEmptyAttendanceRow({
          id: cleanValue(row.id) || createRowId(),
          employeeCode: cleanValue(row.employeeCode),
          accountName: cleanValue(row.accountName),
          workDate: cleanValue(row.workDate),
          checkInTime: cleanValue(row.checkInTime),
          checkOutTime: cleanValue(row.checkOutTime),
          workUnits: cleanValue(row.workUnits),
          overtimeHours: cleanValue(row.overtimeHours),
          lateDuration: cleanValue(row.lateDuration),
          attendanceStatus: cleanValue(row.attendanceStatus),
          approvalStatus: cleanValue(row.approvalStatus),
          approvedBy: cleanValue(row.approvedBy)
        })
      )
      .filter((row) => hasMeaningfulRowValue(row))
  };
}

export function buildAttendanceReportContent(payload: AttendanceReportPayload): string {
  return `${ATTENDANCE_REPORT_PREFIX}\n${JSON.stringify(normalizeAttendanceReportPayload(payload))}`;
}

export function parseAttendanceReportContent(content: string): AttendanceReportPayload | null {
  const payloadJson = extractPayloadJson(content, ATTENDANCE_REPORT_PREFIX);

  if (!payloadJson) {
    return null;
  }

  try {
    const rawPayload = JSON.parse(payloadJson) as Partial<AttendanceReportPayload> | undefined;

    if (!rawPayload || !Array.isArray(rawPayload.rows)) {
      return createEmptyAttendanceReport();
    }

    return {
      kind: 'attendance',
      version: 1,
      reportPeriod: cleanValue(rawPayload.reportPeriod),
      description: cleanValue(rawPayload.description),
      rows: rawPayload.rows.map((row) => {
        const typedRow = row as Partial<AttendanceReportRow>;
        return createEmptyAttendanceRow({
          id: cleanValue(typedRow.id) || createRowId(),
          employeeCode: cleanValue(typedRow.employeeCode),
          accountName: cleanValue(typedRow.accountName),
          workDate: cleanValue(typedRow.workDate),
          checkInTime: cleanValue(typedRow.checkInTime),
          checkOutTime: cleanValue(typedRow.checkOutTime),
          workUnits: cleanValue(typedRow.workUnits),
          overtimeHours: cleanValue(typedRow.overtimeHours),
          lateDuration: cleanValue(typedRow.lateDuration),
          attendanceStatus: cleanValue(typedRow.attendanceStatus),
          approvalStatus: cleanValue(typedRow.approvalStatus),
          approvedBy: cleanValue(typedRow.approvedBy)
        });
      })
    };
  } catch {
    return null;
  }
}

export function createAttendanceExcelFile(
  payload: AttendanceReportPayload,
  title: string
): File {
  const normalizedPayload = normalizeAttendanceReportPayload(payload);
  const fileName = `${sanitizeFileNameSegment(title)}.xls`;
  const xml = buildWorkbookXml(title, normalizedPayload);

  return new File([`\uFEFF${xml}`], fileName, {
    type: 'application/vnd.ms-excel;charset=utf-8'
  });
}

export function downloadAttendanceExcel(payload: AttendanceReportPayload, title: string): void {
  const file = createAttendanceExcelFile(payload, title);
  const url = URL.createObjectURL(file);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = file.name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
}
