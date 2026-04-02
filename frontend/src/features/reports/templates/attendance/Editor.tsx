import {
  type AttendanceReportPayload,
  type AttendanceReportRow,
  createEmptyAttendanceRow,
  downloadAttendanceExcel
} from "./logic";

interface AttendanceReportEditorProps {
  title: string;
  value: AttendanceReportPayload;
  disabled?: boolean;
  onChange: (nextValue: AttendanceReportPayload) => void;
}

type AttendanceRowField = Exclude<keyof AttendanceReportRow, "id">;

export function AttendanceReportEditor({
  title,
  value,
  disabled = false,
  onChange
}: AttendanceReportEditorProps) {
  function handleRootChange(field: "reportPeriod" | "description", nextValue: string) {
    onChange({
      ...value,
      [field]: nextValue
    });
  }

  function handleRowChange(rowId: string, field: AttendanceRowField, nextValue: string) {
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
      rows: [...value.rows, createEmptyAttendanceRow()]
    });
  }

  function handleRemoveRow(rowId: string) {
    const nextRows = value.rows.filter((row) => row.id !== rowId);

    onChange({
      ...value,
      rows: nextRows.length > 0 ? nextRows : [createEmptyAttendanceRow()]
    });
  }

  return (
    <div className="report-template-editor">
      <div className="report-template-editor-top">
        <div className="report-template-editor-fields">
          <label htmlFor="attendance-period">Kỳ chấm công</label>
          <input
            id="attendance-period"
            value={value.reportPeriod}
            disabled={disabled}
            onChange={(event) => handleRootChange("reportPeriod", event.target.value)}
            placeholder="Ví dụ: Tháng 03/2026"
          />

          <label htmlFor="attendance-description">Ghi chú</label>
          <textarea
            id="attendance-description"
            rows={3}
            value={value.description}
            disabled={disabled}
            onChange={(event) => handleRootChange("description", event.target.value)}
            placeholder="Mô tả thêm cho bảng chấm công nếu cần"
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
            onClick={() => downloadAttendanceExcel(value, title || "Báo cáo chấm công")}
          >
            Xuất Excel
          </button>
        </div>
      </div>

      <p className="subtext">
        Bạn có thể nhập trực tiếp từng dòng chấm công, chỉnh sửa ngay trên bảng và file Excel sẽ được tạo từ dữ liệu
        này khi gửi báo cáo.
      </p>

      <div className="report-template-table-wrapper">
        <table className="report-template-table report-template-table-editor">
          <thead>
            <tr>
              <th>Mã NV</th>
              <th>Tên tài khoản</th>
              <th>Ngày</th>
              <th>Giờ vào</th>
              <th>Giờ ra</th>
              <th>Công</th>
              <th>OT</th>
              <th>Đi muộn</th>
              <th>Trạng thái</th>
              <th>Duyệt</th>
              <th>Người duyệt</th>
              <th className="report-template-action-header">Xóa dòng</th>
            </tr>
          </thead>
          <tbody>
            {value.rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <input
                    value={row.employeeCode}
                    disabled={disabled}
                    onChange={(event) => handleRowChange(row.id, "employeeCode", event.target.value)}
                    placeholder="NV01"
                  />
                </td>
                <td>
                  <input
                    value={row.accountName}
                    disabled={disabled}
                    onChange={(event) => handleRowChange(row.id, "accountName", event.target.value)}
                    placeholder="nguyenvana"
                  />
                </td>
                <td>
                  <input
                    type="date"
                    value={row.workDate}
                    disabled={disabled}
                    onChange={(event) => handleRowChange(row.id, "workDate", event.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="time"
                    value={row.checkInTime}
                    disabled={disabled}
                    onChange={(event) => handleRowChange(row.id, "checkInTime", event.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="time"
                    value={row.checkOutTime}
                    disabled={disabled}
                    onChange={(event) => handleRowChange(row.id, "checkOutTime", event.target.value)}
                  />
                </td>
                <td>
                  <input
                    value={row.workUnits}
                    disabled={disabled}
                    onChange={(event) => handleRowChange(row.id, "workUnits", event.target.value)}
                    placeholder="1.0"
                  />
                </td>
                <td>
                  <input
                    value={row.overtimeHours}
                    disabled={disabled}
                    onChange={(event) => handleRowChange(row.id, "overtimeHours", event.target.value)}
                    placeholder="1h"
                  />
                </td>
                <td>
                  <input
                    value={row.lateDuration}
                    disabled={disabled}
                    onChange={(event) => handleRowChange(row.id, "lateDuration", event.target.value)}
                    placeholder="10p"
                  />
                </td>
                <td>
                  <input
                    value={row.attendanceStatus}
                    disabled={disabled}
                    onChange={(event) => handleRowChange(row.id, "attendanceStatus", event.target.value)}
                    placeholder="Đi làm"
                  />
                </td>
                <td>
                  <input
                    value={row.approvalStatus}
                    disabled={disabled}
                    onChange={(event) => handleRowChange(row.id, "approvalStatus", event.target.value)}
                    placeholder="Chờ"
                  />
                </td>
                <td>
                  <input
                    value={row.approvedBy}
                    disabled={disabled}
                    onChange={(event) => handleRowChange(row.id, "approvedBy", event.target.value)}
                    placeholder="-"
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
