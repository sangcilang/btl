import { FormEvent, useState } from "react";
import { createTask, updateTaskStatus } from "../../lib/api";
import type { TaskItem, UserRole } from "../../types";

interface TaskPanelProps {
  currentUserId: number;
  currentUserRole: UserRole;
  tasks: TaskItem[];
  onChanged: () => Promise<void>;
}

export function TaskPanel({ currentUserId, currentUserRole, tasks, onChanged }: TaskPanelProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedToUserId, setAssignedToUserId] = useState("1");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Nhập tiêu đề nhiệm vụ.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await createTask({
        assignedToUserId: Number(assignedToUserId),
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate || null
      });
      setTitle("");
      setDescription("");
      setDueDate("");
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo được nhiệm vụ.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(task: TaskItem, status: "Todo" | "InProgress" | "Done") {
    try {
      setError("");
      await updateTaskStatus(task.id, status);
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không cập nhật được trạng thái.");
    }
  }

  return (
    <section className="panel">
      <h2>Nhiệm vụ</h2>
      {error ? <p className="error">{error}</p> : null}

      {currentUserRole !== "Staff" ? (
        <form onSubmit={handleCreate} className="task-form">
          <h4>Giao việc cho cấp dưới</h4>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề nhiệm vụ" />
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả"
          />
          <label htmlFor="assignee">Người nhận (demo: 1 = nhanvien01)</label>
          <input
            id="assignee"
            value={assignedToUserId}
            onChange={(e) => setAssignedToUserId(e.target.value)}
            placeholder="Nhập user id nhân viên"
          />
          <label htmlFor="dueDate">Hạn hoàn thành</label>
          <input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <button type="submit" disabled={loading}>
            {loading ? "Đang tạo..." : "Tạo nhiệm vụ"}
          </button>
        </form>
      ) : null}

      <ul className="report-list">
        {tasks.map((task) => (
          <li key={task.id} className="report-item">
            <div className="report-header">
              <strong>{task.title}</strong>
              <span className="badge pending">{task.status}</span>
            </div>
            <p>{task.description}</p>
            <small>
              Giao bởi {task.assignedByUserName} - Nhận: {task.assignedToUserName}
            </small>
            {task.dueDate ? <small> | Hạn: {new Date(task.dueDate).toLocaleDateString()}</small> : null}

            {task.assignedToUserId === currentUserId ? (
              <div className="task-actions">
                <button type="button" onClick={() => void handleStatusChange(task, "Todo")}>
                  Todo
                </button>
                <button type="button" onClick={() => void handleStatusChange(task, "InProgress")}>
                  In Progress
                </button>
                <button type="button" onClick={() => void handleStatusChange(task, "Done")}>
                  Done
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
