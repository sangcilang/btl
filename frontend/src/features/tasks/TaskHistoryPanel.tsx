import type { TaskHistoryItem, UserRole } from "../../types";

interface TaskHistoryPanelProps {
  items: TaskHistoryItem[];
  currentUserRole: UserRole;
}

export function TaskHistoryPanel({ items, currentUserRole }: TaskHistoryPanelProps) {
  const title =
    currentUserRole === "Staff"
      ? "Lịch sử nhiệm vụ của tôi"
      : "Lịch sử giao và hoàn thành nhiệm vụ";

  return (
    <section className="panel">
      <h2>{title}</h2>
      {items.length === 0 ? <p className="subtext">Chưa có lịch sử nhiệm vụ.</p> : null}
      <ul className="history-list">
        {items.map((item) => (
          <li key={item.id}>
            [{new Date(item.changedAt).toLocaleString()}] {item.taskTitle} - {item.action} ({item.status}) | Người
            giao: {item.assignedByUserName}
            {item.completedByUserName ? ` | Người hoàn thành: ${item.completedByUserName}` : ""}
            {item.completedAt ? ` | Hoàn thành lúc: ${new Date(item.completedAt).toLocaleString()}` : ""}
          </li>
        ))}
      </ul>
    </section>
  );
}
