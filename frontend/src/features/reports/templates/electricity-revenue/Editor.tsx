import {
  type ElectricityRevenueReportPayload,
  type ElectricityRevenueReportRow,
  createEmptyElectricityRevenueRow,
  downloadElectricityRevenueExcel
} from "./logic";

interface ElectricityRevenueReportEditorProps {
  title: string;
  value: ElectricityRevenueReportPayload;
  disabled?: boolean;
  onChange: (nextValue: ElectricityRevenueReportPayload) => void;
}

type ElectricityRevenueRowField = Exclude<keyof ElectricityRevenueReportRow, "id">;

export function ElectricityRevenueReportEditor({
  title,
  value,
  disabled = false,
  onChange
}: ElectricityRevenueReportEditorProps) {
  function handleRootChange(field: "billingPeriod" | "description", nextValue: string) {
    onChange({
      ...value,
      [field]: nextValue
    });
  }

  function handleRowChange(rowId: string, field: ElectricityRevenueRowField, nextValue: string) {
    onChange({
      ...value,
      rows: value.rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              [field]: nextValue
            }
          : row
      )
    });
  }

  function handleAddRow() {
    onChange({
      ...value,
      rows: [
        ...value.rows,
        createEmptyElectricityRevenueRow({
          serialNumber: String(value.rows.length + 1)
        })
      ]
    });
  }

  function handleRemoveRow(rowId: string) {
    const nextRows = value.rows.filter((row) => row.id !== rowId);

    onChange({
      ...value,
      rows:
        nextRows.length > 0
          ? nextRows
          : [createEmptyElectricityRevenueRow({ serialNumber: "1" })]
    });
  }

  return (
    <div className="report-template-editor">
      <div className="report-template-editor-top">
        <div className="report-template-editor-fields">
          <label htmlFor="electricity-billing-period">Kỳ doanh thu</label>
          <input
            id="electricity-billing-period"
            value={value.billingPeriod}
            disabled={disabled}
            onChange={(event) => handleRootChange("billingPeriod", event.target.value)}
            placeholder="Ví dụ: Tháng 03/2026"
          />

          <label htmlFor="electricity-description">Ghi chú</label>
          <textarea
            id="electricity-description"
            rows={3}
            value={value.description}
            disabled={disabled}
            onChange={(event) => handleRootChange("description", event.target.value)}
            placeholder="Mô tả thêm cho bảng doanh thu điện nếu cần"
          />
        </div>

        <div className="report-template-toolbar">
          <button type="button" className="secondary-button" disabled={disabled} onClick={handleAddRow}>
            Thêm dòng
          </button>
          <button
            type="button"
            className="secondary-button"
            disabled={disabled}
            onClick={() => downloadElectricityRevenueExcel(value, title || "Bảng chi tiết doanh thu điện")}
          >
            Xuất Excel
          </button>
        </div>
      </div>

      <p className="subtext">
        Bạn có thể nhập trực tiếp từng khách hàng, sửa chỉ số và trạng thái thu tiền ngay trên bảng rồi xuất ra
        Excel.
      </p>

      <div className="report-template-table-wrapper">
        <table className="report-template-table report-template-table-editor">
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
              <th className="report-template-action-header">Xóa dòng</th>
            </tr>
          </thead>
          <tbody>
            {value.rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <input
                    value={row.serialNumber}
                    disabled={disabled}
                    onChange={(event) => handleRowChange(row.id, "serialNumber", event.target.value)}
                    placeholder="1"
                  />
                </td>
                <td>
                  <input
                    value={row.customerCode}
                    disabled={disabled}
                    onChange={(event) => handleRowChange(row.id, "customerCode", event.target.value)}
                    placeholder="KH01"
                  />
                </td>
                <td>
                  <input
                    value={row.customerName}
                    disabled={disabled}
                    onChange={(event) => handleRowChange(row.id, "customerName", event.target.value)}
                    placeholder="Nguyễn Văn A"
                  />
                </td>
                <td>
                  <input
                    value={row.customerType}
                    disabled={disabled}
                    onChange={(event) => handleRowChange(row.id, "customerType", event.target.value)}
                    placeholder="Sinh hoạt"
                  />
                </td>
                <td>
                  <input
                    value={row.previousReading}
                    disabled={disabled}
                    onChange={(event) => handleRowChange(row.id, "previousReading", event.target.value)}
                    placeholder="1200"
                  />
                </td>
                <td>
                  <input
                    value={row.currentReading}
                    disabled={disabled}
                    onChange={(event) => handleRowChange(row.id, "currentReading", event.target.value)}
                    placeholder="1350"
                  />
                </td>
                <td>
                  <input
                    value={row.consumptionKwh}
                    disabled={disabled}
                    onChange={(event) => handleRowChange(row.id, "consumptionKwh", event.target.value)}
                    placeholder="150"
                  />
                </td>
                <td>
                  <input
                    value={row.unitPrice}
                    disabled={disabled}
                    onChange={(event) => handleRowChange(row.id, "unitPrice", event.target.value)}
                    placeholder="2000"
                  />
                </td>
                <td>
                  <input
                    value={row.amount}
                    disabled={disabled}
                    onChange={(event) => handleRowChange(row.id, "amount", event.target.value)}
                    placeholder="300000"
                  />
                </td>
                <td>
                  <input
                    value={row.vatAmount}
                    disabled={disabled}
                    onChange={(event) => handleRowChange(row.id, "vatAmount", event.target.value)}
                    placeholder="30000"
                  />
                </td>
                <td>
                  <input
                    value={row.totalAmount}
                    disabled={disabled}
                    onChange={(event) => handleRowChange(row.id, "totalAmount", event.target.value)}
                    placeholder="330000"
                  />
                </td>
                <td>
                  <input
                    value={row.paymentStatus}
                    disabled={disabled}
                    onChange={(event) => handleRowChange(row.id, "paymentStatus", event.target.value)}
                    placeholder="Đã thu"
                  />
                </td>
                <td className="report-template-action-cell">
                  <button
                    type="button"
                    className="danger-button report-template-row-delete"
                    disabled={disabled}
                    onClick={() => handleRemoveRow(row.id)}
                  >
                    Xóa dòng
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
