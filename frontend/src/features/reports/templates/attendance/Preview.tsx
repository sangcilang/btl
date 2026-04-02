import {
  type AttendanceReportPayload,
  downloadAttendanceExcel
} from "./logic";

interface AttendanceReportPreviewProps {
  title: string;
  payload: AttendanceReportPayload;
  emptyMessage?: string;
  showExportButton?: boolean;
}

export function AttendanceReportPreview({
  title,
  payload,
  emptyMessage = "Chưa có dòng chấm công nào.",
  showExportButton = true
}: AttendanceReportPreviewProps) {
  return (
    <div className="report-template-preview">
      <div className="report-template-preview-header">
        <div>
          {payload.reportPeriod ? <p className="subtext">Kỳ chấm công: {payload.reportPeriod}</p> : null}
          {payload.description ? <p className="subtext">{payload.description}</p> : null}
        </div>

        {showExportButton ? (
          <button type="button" className="secondary-button" onClick={() => downloadAttendanceExcel(payload, title)}>
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
              </tr>
            </thead>
            <tbody>
              {payload.rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.employeeCode || "-"}</td>
                  <td>{row.accountName || "-"}</td>
                  <td>{row.workDate || "-"}</td>
                  <td>{row.checkInTime || "-"}</td>
                  <td>{row.checkOutTime || "-"}</td>
                  <td>{row.workUnits || "-"}</td>
                  <td>{row.overtimeHours || "-"}</td>
                  <td>{row.lateDuration || "-"}</td>
                  <td>{row.attendanceStatus || "-"}</td>
                  <td>{row.approvalStatus || "-"}</td>
                  <td>{row.approvedBy || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
