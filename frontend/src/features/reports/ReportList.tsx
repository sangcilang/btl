import { useState } from "react";
import { deleteReport, downloadAttachment, getReportHistory, resubmitReport } from "../../lib/api";
import type { Report, ReportHistoryItem, UserRole } from "../../types";
import {
  createDefaultResubmitForm,
  createTemplateSubmission,
  parseStructuredReport
} from "./reportTemplates";
import type { ResubmitFormState } from "./reportTemplateTypes";
import { AttendanceReportEditor } from "./templates/attendance/Editor";
import { AttendanceReportPreview } from "./templates/attendance/Preview";
import { createEmptyAttendanceReport } from "./templates/attendance/logic";
import { ElectricityRevenueReportEditor } from "./templates/electricity-revenue/Editor";
import { ElectricityRevenueReportPreview } from "./templates/electricity-revenue/Preview";
import { createEmptyElectricityRevenueReport } from "./templates/electricity-revenue/logic";

interface ReportListProps {
  title: string;
  reports: Report[];
  emptyMessage: string;
  currentUserId: number;
  currentUserRole: UserRole;
  onUpdated: () => Promise<void>;
}

export function ReportList({
  title,
  reports,
  emptyMessage,
  currentUserRole,
  onUpdated
}: ReportListProps) {
  const [histories, setHistories] = useState<Record<string, ReportHistoryItem[]>>({});
  const [loadingHistoryReportId, setLoadingHistoryReportId] = useState("");
  const [resubmitForm, setResubmitForm] = useState<Record<string, ResubmitFormState>>({});
  const [activeResubmitId, setActiveResubmitId] = useState("");
  const [activeDeleteId, setActiveDeleteId] = useState("");
  const [error, setError] = useState("");

  function updateResubmitForm(
    report: Report,
    updater: (currentValue: ResubmitFormState) => ResubmitFormState
  ) {
    setResubmitForm((prev) => {
      const currentValue = prev[report.id] ?? createDefaultResubmitForm(report);

      return {
        ...prev,
        [report.id]: updater(currentValue)
      };
    });
  }

  async function handleLoadHistory(reportId: string) {
    try {
      setLoadingHistoryReportId(reportId);
      setError("");
      const data = await getReportHistory(reportId);
      setHistories((prev) => ({ ...prev, [reportId]: data }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không tải được lịch sử.";
      setError(message);
    } finally {
      setLoadingHistoryReportId("");
    }
  }

  async function handleDelete(report: Report) {
    const ok = window.confirm(`Bạn chắc chắn muốn xóa báo cáo "${report.title}"?`);
    if (!ok) {
      return;
    }

    try {
      setActiveDeleteId(report.id);
      setError("");
      await deleteReport(report.id);
      await onUpdated();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Xóa báo cáo thất bại.";
      setError(message);
    } finally {
      setActiveDeleteId("");
    }
  }

  async function handleResubmit(report: Report) {
    const form = resubmitForm[report.id] ?? createDefaultResubmitForm(report);

    if (!form.title.trim()) {
      setError("Nhập đầy đủ tiêu đề để nộp lại.");
      return;
    }

    let nextContent = form.content.trim();
    let nextAttachment = form.attachment;

    if (form.templateKind) {
      const { submission, error: templateError } = createTemplateSubmission(
        form.templateKind,
        {
          title: form.title,
          attendancePayload: form.attendancePayload ?? createEmptyAttendanceReport(),
          electricityRevenuePayload:
            form.electricityRevenuePayload ?? createEmptyElectricityRevenueReport()
        },
        { actionLabel: "nộp lại" }
      );

      if (!submission) {
        setError(templateError);
        return;
      }

      nextContent = submission.content;
      nextAttachment = submission.attachment;
    } else if (!nextContent) {
      setError("Nhập đầy đủ tiêu đề và nội dung để nộp lại.");
      return;
    }

    try {
      setActiveResubmitId(report.id);
      setError("");
      await resubmitReport(report.id, {
        title: form.title.trim(),
        content: nextContent,
        attachment: nextAttachment
      });

      setResubmitForm((prev) => {
        const nextState = { ...prev };
        delete nextState[report.id];
        return nextState;
      });

      await onUpdated();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nộp lại thất bại.";
      setError(message);
    } finally {
      setActiveResubmitId("");
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
      <h2>{title}</h2>
      {error ? <p className="error">{error}</p> : null}
      {reports.length === 0 ? <p className="subtext">{emptyMessage}</p> : null}
      <ul className="report-list">
        {reports.map((report) => {
          const structuredReport = parseStructuredReport(report.content);
          const currentResubmitForm = resubmitForm[report.id] ?? createDefaultResubmitForm(report);

          return (
            <li key={report.id} className="report-item">
              <div className="report-header">
                <strong>{report.title}</strong>
                <span className={report.isApproved ? "badge approved" : "badge pending"}>
                  {report.isApproved ? "Approved" : report.status}
                </span>
              </div>

              {structuredReport?.kind === "attendance" ? (
                <AttendanceReportPreview title={report.title} payload={structuredReport.payload} />
              ) : structuredReport?.kind === "electricityRevenue" ? (
                <ElectricityRevenueReportPreview title={report.title} payload={structuredReport.payload} />
              ) : (
                <p className="report-content">{report.content}</p>
              )}

              {report.returnedReason ? <p className="error">Lý do trả về: {report.returnedReason}</p> : null}
              {report.hasAttachment ? (
                <button type="button" className="link-button" onClick={() => void handleDownload(report)}>
                  Tệp đính kèm: {report.fileOriginalName ?? "Tải tệp"}
                </button>
              ) : (
                <p className="subtext">Không có tệp đính kèm</p>
              )}

              <small>
                Tạo lúc: {new Date(report.createdAt).toLocaleString()} | Người tạo: {report.createdByUserId}
              </small>

              <div className="inline-actions">
                <button type="button" onClick={() => void handleLoadHistory(report.id)}>
                  {loadingHistoryReportId === report.id
                    ? "Đang tải..."
                    : "Xem tiến trình duyệt của báo cáo"}
                </button>
              </div>

              {currentUserRole === "Staff" && report.status === "Returned" ? (
                <div className="resubmit-box">
                  <h4>Nộp lại báo cáo</h4>

                  <label htmlFor={`resubmit-title-${report.id}`}>Tiêu đề</label>
                  <input
                    id={`resubmit-title-${report.id}`}
                    value={currentResubmitForm.title}
                    onChange={(event) =>
                      updateResubmitForm(report, (currentValue) => ({
                        ...currentValue,
                        title: event.target.value
                      }))
                    }
                    placeholder="Tiêu đề mới"
                  />

                  {currentResubmitForm.templateKind === "attendance" && currentResubmitForm.attendancePayload ? (
                    <AttendanceReportEditor
                      title={currentResubmitForm.title}
                      value={currentResubmitForm.attendancePayload}
                      disabled={activeResubmitId === report.id}
                      onChange={(nextValue) =>
                        updateResubmitForm(report, (currentValue) => ({
                          ...currentValue,
                          attendancePayload: nextValue
                        }))
                      }
                    />
                  ) : currentResubmitForm.templateKind === "electricityRevenue" &&
                    currentResubmitForm.electricityRevenuePayload ? (
                    <ElectricityRevenueReportEditor
                      title={currentResubmitForm.title}
                      value={currentResubmitForm.electricityRevenuePayload}
                      disabled={activeResubmitId === report.id}
                      onChange={(nextValue) =>
                        updateResubmitForm(report, (currentValue) => ({
                          ...currentValue,
                          electricityRevenuePayload: nextValue
                        }))
                      }
                    />
                  ) : (
                    <>
                      <label htmlFor={`resubmit-content-${report.id}`}>Nội dung</label>
                      <textarea
                        id={`resubmit-content-${report.id}`}
                        rows={3}
                        value={currentResubmitForm.content}
                        onChange={(event) =>
                          updateResubmitForm(report, (currentValue) => ({
                            ...currentValue,
                            content: event.target.value
                          }))
                        }
                        placeholder="Nội dung bổ sung"
                      />

                      <label htmlFor={`resubmit-file-${report.id}`}>Tệp đính kèm</label>
                      <input
                        id={`resubmit-file-${report.id}`}
                        type="file"
                        accept=".xls,.xlsx,.doc,.docx"
                        onChange={(event) =>
                          updateResubmitForm(report, (currentValue) => ({
                            ...currentValue,
                            attachment: event.target.files?.[0] ?? null
                          }))
                        }
                      />
                    </>
                  )}

                  <button
                    type="button"
                    disabled={activeResubmitId === report.id}
                    onClick={() => void handleResubmit(report)}
                  >
                    {activeResubmitId === report.id ? "Đang nộp lại..." : "Nộp lại"}
                  </button>
                </div>
              ) : null}

              {currentUserRole === "Staff" ? (
                <div className="inline-actions">
                  <button
                    type="button"
                    className="danger-button"
                    disabled={activeDeleteId === report.id}
                    onClick={() => void handleDelete(report)}
                  >
                    {activeDeleteId === report.id ? "Đang xóa..." : "Xóa báo cáo"}
                  </button>
                </div>
              ) : null}

              {histories[report.id]?.length ? (
                <ul className="history-list">
                  {histories[report.id].map((item) => (
                    <li key={item.id}>
                      [{new Date(item.approvedAt).toLocaleString()}] {item.approverRole} ({item.approverUserName}) -{" "}
                      {item.action}: {item.comment || "(không có ghi chú)"}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
