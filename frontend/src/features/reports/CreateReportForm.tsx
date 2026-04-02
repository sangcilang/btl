import { useState, type FormEvent } from "react";
import { createReport } from "../../lib/api";
import type { Report } from "../../types";
import { createTemplateSubmission, getTemplateTitlePlaceholder, REPORT_TEMPLATE_OPTIONS } from "./reportTemplates";
import type { ReportFormMode, ReportTemplateKind } from "./reportTemplateTypes";
import { AttendanceReportEditor } from "./templates/attendance/Editor";
import { createEmptyAttendanceReport } from "./templates/attendance/logic";
import { ElectricityRevenueReportEditor } from "./templates/electricity-revenue/Editor";
import { createEmptyElectricityRevenueReport } from "./templates/electricity-revenue/logic";

interface CreateReportFormProps {
  createdByUserId: number;
  onCreated: (report: Report) => Promise<void>;
}

export function CreateReportForm({ onCreated }: CreateReportFormProps) {
  const [mode, setMode] = useState<ReportFormMode>("standard");
  const [templateKind, setTemplateKind] = useState<ReportTemplateKind>("attendance");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attendanceReport, setAttendanceReport] = useState(createEmptyAttendanceReport());
  const [electricityRevenueReport, setElectricityRevenueReport] = useState(
    createEmptyElectricityRevenueReport()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const templateTitlePlaceholder = getTemplateTitlePlaceholder(templateKind);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!title.trim()) {
      setError("Tiêu đề là bắt buộc.");
      return;
    }

    let nextContent = content.trim();
    let nextAttachment = attachment;

    if (mode === "standard") {
      if (!nextContent) {
        setError("Nội dung là bắt buộc.");
        return;
      }
    } else {
      const { submission, error: templateError } = createTemplateSubmission(templateKind, {
        title,
        attendancePayload: attendanceReport,
        electricityRevenuePayload: electricityRevenueReport
      });

      if (!submission) {
        setError(templateError);
        return;
      }

      nextContent = submission.content;
      nextAttachment = submission.attachment;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const report = await createReport({
        title: title.trim(),
        content: nextContent,
        attachment: nextAttachment
      });

      setTitle("");
      setContent("");
      setAttachment(null);
      setAttendanceReport(createEmptyAttendanceReport());
      setElectricityRevenueReport(createEmptyElectricityRevenueReport());

      await onCreated(report);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Tạo báo cáo thất bại.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <h2>Tạo báo cáo</h2>

      <div className="report-mode-switch" role="tablist" aria-label="Chọn kiểu tạo báo cáo">
        <button
          type="button"
          className={`secondary-button ${mode === "standard" ? "mode-button-active" : ""}`}
          aria-pressed={mode === "standard"}
          onClick={() => setMode("standard")}
        >
          Nộp báo cáo
        </button>
        <button
          type="button"
          className={`secondary-button ${mode === "template" ? "mode-button-active" : ""}`}
          aria-pressed={mode === "template"}
          onClick={() => setMode("template")}
        >
          Tùy chọn mẫu báo cáo
        </button>
      </div>

      <label htmlFor="report-title">Tiêu đề</label>
      <input
        id="report-title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder={mode === "template" ? templateTitlePlaceholder : "Nhập tiêu đề"}
      />

      {mode === "standard" ? (
        <>
          <label htmlFor="report-content">Nội dung</label>
          <textarea
            id="report-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Nhập nội dung báo cáo"
            rows={4}
          />

          <label htmlFor="report-file">Tệp đính kèm (Excel/Word)</label>
          <input
            id="report-file"
            type="file"
            accept=".xls,.xlsx,.doc,.docx"
            onChange={(event) => setAttachment(event.target.files?.[0] ?? null)}
          />
        </>
      ) : (
        <>
          <label htmlFor="report-template-kind">Mẫu báo cáo</label>
          <select
            id="report-template-kind"
            value={templateKind}
            onChange={(event) => setTemplateKind(event.target.value as ReportTemplateKind)}
          >
            {REPORT_TEMPLATE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {templateKind === "attendance" ? (
            <AttendanceReportEditor title={title} value={attendanceReport} onChange={setAttendanceReport} />
          ) : (
            <ElectricityRevenueReportEditor
              title={title}
              value={electricityRevenueReport}
              onChange={setElectricityRevenueReport}
            />
          )}
        </>
      )}

      {error ? <p className="error">{error}</p> : null}
      <button disabled={isSubmitting} type="submit">
        {isSubmitting ? "Đang tạo..." : "Tạo báo cáo"}
      </button>
    </form>
  );
}
