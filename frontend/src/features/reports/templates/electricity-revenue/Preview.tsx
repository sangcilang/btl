import {
  type ElectricityRevenueReportPayload,
  downloadElectricityRevenueExcel
} from "./logic";

interface ElectricityRevenueReportPreviewProps {
  title: string;
  payload: ElectricityRevenueReportPayload;
  emptyMessage?: string;
  showExportButton?: boolean;
}

export function ElectricityRevenueReportPreview({
  title,
  payload,
  emptyMessage = "Chưa có dòng doanh thu điện nào.",
  showExportButton = true
}: ElectricityRevenueReportPreviewProps) {
  return (
    <div className="report-template-preview">
      <div className="report-template-preview-header">
        <div>
          {payload.billingPeriod ? <p className="subtext">Kỳ doanh thu: {payload.billingPeriod}</p> : null}
          {payload.description ? <p className="subtext">{payload.description}</p> : null}
        </div>

        {showExportButton ? (
          <button
            type="button"
            className="secondary-button"
            onClick={() => downloadElectricityRevenueExcel(payload, title)}
          >
            Xuất Excel
          </button>
        ) : null}
      </div>

      {payload.rows.length === 0 ? (
        <p className="subtext">{emptyMessage}</p>
      ) : (
        <div className="report-template-table-wrapper">
          <table className="report-template-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Mã KH</th>
                <th>Tên khách hàng</th>
                <th>Loại KH</th>
                <th>Chỉ số đầu</th>
                <th>Chỉ số cuối</th>
                <th>Sản lượng (kWh)</th>
                <th>Đơn giá (VND/kWh)</th>
                <th>Thành tiền (VND)</th>
                <th>Thuế VAT</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {payload.rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.serialNumber || "-"}</td>
                  <td>{row.customerCode || "-"}</td>
                  <td>{row.customerName || "-"}</td>
                  <td>{row.customerType || "-"}</td>
                  <td>{row.previousReading || "-"}</td>
                  <td>{row.currentReading || "-"}</td>
                  <td>{row.consumptionKwh || "-"}</td>
                  <td>{row.unitPrice || "-"}</td>
                  <td>{row.amount || "-"}</td>
                  <td>{row.vatAmount || "-"}</td>
                  <td>{row.totalAmount || "-"}</td>
                  <td>{row.paymentStatus || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
