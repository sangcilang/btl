import { useState } from "react";
import { approveReport, downloadAttachment, returnReport } from "../../lib/api";
import type { Report, UserRole } from "../../types";
import { parseStructuredReport } from "../reports/reportTemplates";
import { AttendanceReportPreview } from "../reports/templates/attendance/Preview";
import { ElectricityRevenueReportPreview } from "../reports/templates/electricity-revenue/Preview";

interface PendingApprovalListProps {
  approverUserId: number;
  approverRole: UserRole;
  reports: Report[];
  onApproved: () => Promise<void>;
}

export function PendingApprovalList({
  approverRole,
  reports,
  onApproved
}: PendingApprovalListProps) {
  const [activeReportId, setActiveReportId] = useState<string>("");
  const [comments, setComments] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  async function handleApprove(reportId: string) {
    try {
      setActiveReportId(reportId);
      setError("");
      await approveReport(reportId, {
        comment: comments[reportId] ?? ""
      });
      setComments((prev) => ({ ...prev, [reportId]: "" }));
      await onApproved();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Duyệt báo cáo thất bại.";
      setError(message);
    } finally {
      setActiveReportId("");
    }
  }

  async function handleReturn(reportId: string) {
    try {
      setActiveReportId(reportId);
      setError("");
      await returnReport(reportId, {
        comment: comments[reportId] ?? ""
      });
      setComments((prev) => ({ ...prev, [reportId]: "" }));
      await onApproved();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Trả báo cáo thất bại.";
      setError(message);
    } finally {
      setActiveReportId("");
    }
  }

  async function handleDownload(report: Report) {
    try {
      setError("");
      await downloadAttachment(report.id, report.fileOriginalName);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không tải được tệp đính kèm.";
      setError(message);
    }
  }

  return (
    <section className="panel">
      <h2>Danh sách chờ duyệt</h2>
      {error ? <p className="error">{error}</p> : null}
      {reports.length === 0 ? <p className="subtext">Không có báo cáo đang chờ duyệt.</p> : null}
      <ul className="report-list">
        {reports.map((report) => {
          const structuredReport = parseStructuredReport(report.content);

          return (
            <li key={report.id} className="report-item">
              <div className="report-header">
                <strong>{report.title}</strong>
                <span className="badge pending">{report.status}</span>
              </div>

              {structuredReport?.kind === "attendance" ? (
                <AttendanceReportPreview title={report.title} payload={structuredReport.payload} />
              ) : structuredReport?.kind === "electricityRevenue" ? (
                <ElectricityRevenueReportPreview title={report.title} payload={structuredReport.payload} />
              ) : (
                <p className="report-content">{report.content}</p>
              )}

              {report.hasAttachment ? (
                <div className="inline-actions">
                  <button className="link-button" onClick={() => void handleDownload(report)} type="button">
                    Tải tệp đính kèm ({report.fileOriginalName ?? "file"})
                  </button>
                </div>
              ) : (
                <p className="subtext">Không có tệp đính kèm</p>
              )}

              <div className="approve-actions">
                <input
                  value={comments[report.id] ?? ""}
                  onChange={(event) =>
                    setComments((prev) => ({ ...prev, [report.id]: event.target.value }))
                  }
                  placeholder={
                    approverRole === "Manager"
                      ? "Nhập ghi chú duyệt/trả về"
                      : "Nhập ghi chú duyệt (tùy chọn)"
                  }
                />
                <button
                  onClick={() => void handleApprove(report.id)}
                  disabled={activeReportId === report.id}
                  type="button"
                >
                  {activeReportId === report.id ? "Đang xử lý..." : "Duyệt"}
                </button>
                {approverRole === "Manager" || approverRole === "Director" ? (
                  <button
                    className="danger-button"
                    onClick={() => void handleReturn(report.id)}
                    disabled={activeReportId === report.id}
                    type="button"
                  >
                    {activeReportId === report.id
                      ? "Đang xử lý..."
                      : approverRole === "Director"
                        ? "Trả về trưởng phòng"
                        : "Trả về nhân viên"}
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
