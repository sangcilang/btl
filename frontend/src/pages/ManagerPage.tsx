import { ApprovalHistoryList } from "../features/approval/ApprovalHistoryList";
import { PendingApprovalList } from "../features/approval/PendingApprovalList";
import { CreateReportForm } from "../features/reports/CreateReportForm";
import { ReportList } from "../features/reports/ReportList";
import { StatsPanel } from "../features/dashboard/StatsPanel";
import { TaskPanel } from "../features/tasks/TaskPanel";
import { DashboardLayout } from "./DashboardLayout";
import type { Report, ReportHistoryItem, ReportStatistics, TaskItem, User } from "../types";

interface ManagerPageProps {
  user: User;
  isLoading: boolean;
  error: string;
  myReports: Report[];
  teamReports: Report[];
  pendingReports: Report[];
  approvalHistory: ReportHistoryItem[];
  stats: ReportStatistics;
  tasks: TaskItem[];
  onRefresh: () => Promise<void>;
  onLogout: () => void;
}

export function ManagerPage({
  user,
  isLoading,
  error,
  myReports,
  teamReports,
  pendingReports,
  approvalHistory,
  stats,
  tasks,
  onRefresh,
  onLogout
}: ManagerPageProps) {
  const menuItems = [
    { id: "tong-quan", label: "Tổng quan" },
    { id: "phe-duyet", label: "Phê duyệt" },
    { id: "cong-viec", label: "Công việc" },
    { id: "bao-cao", label: "Báo cáo" },
    { id: "lich-su", label: "Lịch sử" }
  ];

  return (
    <DashboardLayout user={user} isLoading={isLoading} error={error} onLogout={onLogout} menuItems={menuItems}>
      <div id="tong-quan">
        <CreateReportForm createdByUserId={user.id} onCreated={async () => await onRefresh()} />
      </div>

      <div id="phe-duyet">
        <PendingApprovalList
          approverUserId={user.id}
          approverRole={user.role}
          reports={pendingReports}
          onApproved={onRefresh}
        />
      </div>

      <div>
        <StatsPanel stats={stats} />
      </div>

      <div id="cong-viec">
        <TaskPanel currentUserId={user.id} currentUserRole={user.role} tasks={tasks} onChanged={onRefresh} />
      </div>

      <div id="bao-cao">
        <ReportList
          title="Báo cáo của tôi (xem trên web)"
          reports={myReports}
          emptyMessage="Bạn chưa có báo cáo nào."
          currentUserId={user.id}
          currentUserRole={user.role}
          onUpdated={onRefresh}
        />
      </div>

      <div>
        <ReportList
          title="Báo cáo cấp dưới và tiến trình duyệt"
          reports={teamReports}
          emptyMessage="Chưa có báo cáo cấp dưới."
          currentUserId={user.id}
          currentUserRole={user.role}
          onUpdated={onRefresh}
        />
      </div>

      <div id="lich-su">
        <ApprovalHistoryList
          title="Lịch sử duyệt/trả về của tôi"
          history={approvalHistory}
          emptyMessage="Chưa có lịch sử."
        />
      </div>
    </DashboardLayout>
  );
}
