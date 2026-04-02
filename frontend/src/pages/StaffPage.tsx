import { ApprovalHistoryList } from "../features/approval/ApprovalHistoryList";
import { CreateReportForm } from "../features/reports/CreateReportForm";
import { ReportList } from "../features/reports/ReportList";
import { TaskPanel } from "../features/tasks/TaskPanel";
import { DashboardLayout } from "./DashboardLayout";
import type { Report, ReportHistoryItem, TaskItem, User } from "../types";

interface StaffPageProps {
  user: User;
  isLoading: boolean;
  error: string;
  myReports: Report[];
  approvalHistory: ReportHistoryItem[];
  tasks: TaskItem[];
  onRefresh: () => Promise<void>;
  onLogout: () => void;
}

export function StaffPage({
  user,
  isLoading,
  error,
  myReports,
  approvalHistory,
  tasks,
  onRefresh,
  onLogout
}: StaffPageProps) {
  const menuItems = [
    { id: "tao-bao-cao", label: "Tạo báo cáo" },
    { id: "cong-viec", label: "Nhiệm vụ" },
    { id: "bao-cao-cua-toi", label: "Báo cáo của tôi" },
    { id: "lich-su", label: "Lịch sử" }
  ];

  return (
    <DashboardLayout user={user} isLoading={isLoading} error={error} onLogout={onLogout} menuItems={menuItems}>
      <div id="tao-bao-cao">
        <CreateReportForm createdByUserId={user.id} onCreated={async () => await onRefresh()} />
      </div>

      <div id="cong-viec">
        <TaskPanel currentUserId={user.id} currentUserRole={user.role} tasks={tasks} onChanged={onRefresh} />
      </div>

      <div id="bao-cao-cua-toi">
        <ReportList
          title="Báo cáo của tôi (xem trên web)"
          reports={myReports}
          emptyMessage="Bạn chưa có báo cáo nào."
          currentUserId={user.id}
          currentUserRole={user.role}
          onUpdated={onRefresh}
        />
      </div>

      <div id="lich-su">
        <ApprovalHistoryList
          title="Lịch sử gửi báo cáo của tôi"
          history={approvalHistory}
          emptyMessage="Chưa có lịch sử."
        />
      </div>
    </DashboardLayout>
  );
}
