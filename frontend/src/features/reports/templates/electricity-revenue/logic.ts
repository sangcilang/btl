export interface ElectricityRevenueReportRow {
  id: string;
  serialNumber: string;
  customerCode: string;
  customerName: string;
  customerType: string;
  previousReading: string;
  currentReading: string;
  consumptionKwh: string;
  unitPrice: string;
  amount: string;
  vatAmount: string;
  totalAmount: string;
  paymentStatus: string;
}

export interface ElectricityRevenueReportPayload {
  kind: "electricityRevenue";
  version: 1;
  billingPeriod: string;
  description: string;
  rows: ElectricityRevenueReportRow[];
}

const ELECTRICITY_REVENUE_REPORT_PREFIX = "ELECTRICITY_REVENUE_REPORT_V1";

function extractPayloadJson(content: string, prefix: string): string | null {
  const normalizedContent = content.replace(/^\uFEFF/, "");
  const match = normalizedContent.match(new RegExp(`^${prefix}\\r?\\n`));

  if (!match) {
    return null;
  }

  return normalizedContent.slice(match[0].length);
}

function createRowId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `electricity-row-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function cleanValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function createCell(value: string, styleId = "Body"): string {
  return `<Cell ss:StyleID="${styleId}"><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`;
}

function hasMeaningfulRowValue(row: ElectricityRevenueReportRow): boolean {
  return [
    row.serialNumber,
    row.customerCode,
    row.customerName,
    row.customerType,
    row.previousReading,
    row.currentReading,
    row.consumptionKwh,
    row.unitPrice,
    row.amount,
    row.vatAmount,
    row.totalAmount,
    row.paymentStatus
  ].some((value) => cleanValue(value).length > 0);
}

function sanitizeFileNameSegment(value: string): string {
  const sanitized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

  return sanitized || "bao-cao-doanh-thu-dien";
}

function buildWorkbookXml(title: string, payload: ElectricityRevenueReportPayload): string {
  const headers = [
    "STT",
    "Mã KH",
    "Tên khách hàng",
    "Loại KH",
    "Chỉ số đầu",
    "Chỉ số cuối",
    "Sản lượng (kWh)",
    "Đơn giá (VND/kWh)",
    "Thành tiền (VND)",
    "Thuế VAT",
    "Tổng tiền",
    "Trạng thái"
  ];

  const headerRow = `<Row>${headers.map((header) => createCell(header, "Header")).join("")}</Row>`;
  const dataRows = payload.rows
    .map((row) => {
      return `<Row>${
        [
          row.serialNumber || "-",
          row.customerCode || "-",
          row.customerName || "-",
          row.customerType || "-",
          row.previousReading || "-",
          row.currentReading || "-",
          row.consumptionKwh || "-",
          row.unitPrice || "-",
          row.amount || "-",
          row.vatAmount || "-",
          row.totalAmount || "-",
          row.paymentStatus || "-"
        ]
          .map((value) => createCell(value))
          .join("")
      }</Row>`;
    })
    .join("");

  const infoRows = [
    `<Row>${createCell(title || "Bảng chi tiết doanh thu điện", "Title")}</Row>`,
    payload.billingPeriod
      ? `<Row>${createCell(`Kỳ doanh thu: ${payload.billingPeriod}`, "Meta")}</Row>`
      : "",
    payload.description
      ? `<Row>${createCell(`Ghi chú: ${payload.description}`, "Meta")}</Row>`
      : "",
    "<Row/>"
  ].join("");

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
  <Worksheet ss:Name="Doanh thu dien">
    <Table>
      ${infoRows}
      ${headerRow}
      ${dataRows}
    </Table>
  </Worksheet>
</Workbook>`;
}

export function createEmptyElectricityRevenueRow(
  overrides: Partial<ElectricityRevenueReportRow> = {}
): ElectricityRevenueReportRow {
  return {
    id: overrides.id ?? createRowId(),
    serialNumber: overrides.serialNumber ?? "",
    customerCode: overrides.customerCode ?? "",
    customerName: overrides.customerName ?? "",
    customerType: overrides.customerType ?? "",
    previousReading: overrides.previousReading ?? "",
    currentReading: overrides.currentReading ?? "",
    consumptionKwh: overrides.consumptionKwh ?? "",
    unitPrice: overrides.unitPrice ?? "",
    amount: overrides.amount ?? "",
    vatAmount: overrides.vatAmount ?? "",
    totalAmount: overrides.totalAmount ?? "",
    paymentStatus: overrides.paymentStatus ?? ""
  };
}

export function createEmptyElectricityRevenueReport(): ElectricityRevenueReportPayload {
  return {
    kind: "electricityRevenue",
    version: 1,
    billingPeriod: "",
    description: "",
    rows: [createEmptyElectricityRevenueRow({ serialNumber: "1" })]
  };
}

export function normalizeElectricityRevenueReportPayload(
  payload: ElectricityRevenueReportPayload
): ElectricityRevenueReportPayload {
  return {
    kind: "electricityRevenue",
    version: 1,
    billingPeriod: cleanValue(payload.billingPeriod),
    description: cleanValue(payload.description),
    rows: (payload.rows ?? [])
      .map((row) =>
        createEmptyElectricityRevenueRow({
          id: cleanValue(row.id) || createRowId(),
          serialNumber: cleanValue(row.serialNumber),
          customerCode: cleanValue(row.customerCode),
          customerName: cleanValue(row.customerName),
          customerType: cleanValue(row.customerType),
          previousReading: cleanValue(row.previousReading),
          currentReading: cleanValue(row.currentReading),
          consumptionKwh: cleanValue(row.consumptionKwh),
          unitPrice: cleanValue(row.unitPrice),
          amount: cleanValue(row.amount),
          vatAmount: cleanValue(row.vatAmount),
          totalAmount: cleanValue(row.totalAmount),
          paymentStatus: cleanValue(row.paymentStatus)
        })
      )
      .filter((row) => hasMeaningfulRowValue(row))
  };
}

export function buildElectricityRevenueReportContent(
  payload: ElectricityRevenueReportPayload
): string {
  return `${ELECTRICITY_REVENUE_REPORT_PREFIX}\n${JSON.stringify(
    normalizeElectricityRevenueReportPayload(payload)
  )}`;
}

export function parseElectricityRevenueReportContent(
  content: string
): ElectricityRevenueReportPayload | null {
  const payloadJson = extractPayloadJson(content, ELECTRICITY_REVENUE_REPORT_PREFIX);

  if (!payloadJson) {
    return null;
  }

  try {
    const rawPayload = JSON.parse(payloadJson) as Partial<ElectricityRevenueReportPayload> | undefined;

    if (!rawPayload || !Array.isArray(rawPayload.rows)) {
      return createEmptyElectricityRevenueReport();
    }

    return {
      kind: "electricityRevenue",
      version: 1,
      billingPeriod: cleanValue(rawPayload.billingPeriod),
      description: cleanValue(rawPayload.description),
      rows: rawPayload.rows.map((row) => {
        const typedRow = row as Partial<ElectricityRevenueReportRow>;
        return createEmptyElectricityRevenueRow({
          id: cleanValue(typedRow.id) || createRowId(),
          serialNumber: cleanValue(typedRow.serialNumber),
          customerCode: cleanValue(typedRow.customerCode),
          customerName: cleanValue(typedRow.customerName),
          customerType: cleanValue(typedRow.customerType),
          previousReading: cleanValue(typedRow.previousReading),
          currentReading: cleanValue(typedRow.currentReading),
          consumptionKwh: cleanValue(typedRow.consumptionKwh),
          unitPrice: cleanValue(typedRow.unitPrice),
          amount: cleanValue(typedRow.amount),
          vatAmount: cleanValue(typedRow.vatAmount),
          totalAmount: cleanValue(typedRow.totalAmount),
          paymentStatus: cleanValue(typedRow.paymentStatus)
        });
      })
    };
  } catch {
    return null;
  }
}

export function createElectricityRevenueExcelFile(
  payload: ElectricityRevenueReportPayload,
  title: string
): File {
  const normalizedPayload = normalizeElectricityRevenueReportPayload(payload);
  const fileName = `${sanitizeFileNameSegment(title)}.xls`;
  const xml = buildWorkbookXml(title, normalizedPayload);

  return new File([`\uFEFF${xml}`], fileName, {
    type: "application/vnd.ms-excel;charset=utf-8"
  });
}

export function downloadElectricityRevenueExcel(
  payload: ElectricityRevenueReportPayload,
  title: string
): void {
  const file = createElectricityRevenueExcelFile(payload, title);
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = file.name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
}
