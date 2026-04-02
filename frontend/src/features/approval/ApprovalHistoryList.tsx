import type { ReportHistoryItem } from "../../types";

interface ApprovalHistoryListProps {
  title: string;
  history: ReportHistoryItem[];
  emptyMessage: string;
}

export function ApprovalHistoryList({ title, history, emptyMessage }: ApprovalHistoryListProps) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      {history.length === 0 ? <p className="subtext">{emptyMessage}</p> : null}
      <ul className="history-list">
        {history.map((item) => (
          <li key={item.id}>
            [{new Date(item.approvedAt).toLocaleString()}] {item.action} | Báo cáo: {item.reportId} | Ghi chú:{" "}
            {item.comment || "(không có)"} | Vai trò: {item.approverRole}
          </li>
        ))}
      </ul>
    </section>
  );
}
