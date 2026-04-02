import { AdminPanel } from "../features/admin/AdminPanel";
import { ApprovalHistoryList } from "../features/approval/ApprovalHistoryList";
import { ReportList } from "../features/reports/ReportList";
import { StatsPanel } from "../features/dashboard/StatsPanel";
import { TaskHistoryPanel } from "../features/tasks/TaskHistoryPanel";
import { TaskPanel } from "../features/tasks/TaskPanel";
import { DashboardLayout } from "./DashboardLayout";
import type {
  AdminOverview,
  AdminUser,
  Report,
  ReportHistoryItem,
  ReportStatistics,
  TaskHistoryItem,
  TaskItem,
  User
} from "../types";

interface AdminPageProps {
  user: User;
  isLoading: boolean;
  error: string;
  myReports: Report[];
  teamReports: Report[];
  approvalHistory: ReportHistoryItem[];
  stats: ReportStatistics;
  tasks: TaskItem[];
  taskHistory: TaskHistoryItem[];
  adminOverview: AdminOverview;
  adminUsers: AdminUser[];
  adminReports: Report[];
  adminTasks: TaskItem[];
  onRefresh: () => Promise<void>;
  onLogout: () => void;
}

export function AdminPage({
  user,
  isLoading,
  error,
  myReports,
  teamReports,
  approvalHistory,
  stats,
  tasks,
  taskHistory,
  adminOverview,
  adminUsers,
  adminReports,
  adminTasks,
  onRefresh,
  onLogout
}: AdminPageProps) {
  const menuItems = [
    { id: "tong-quan", label: "Tổng quan" },
    { id: "quan-tri", label: "Quản trị" },
    { id: "cong-viec", label: "Nhiệm vụ" },
    { id: "bao-cao", label: "Báo cáo" },
    { id: "lich-su", label: "Lịch sử" }
  ];

  return (
    <DashboardLayout user={user} isLoading={isLoading} error={error} onLogout={onLogout} menuItems={menuItems}>
      <div id="tong-quan">
        <StatsPanel stats={stats} />
      </div>

      <div id="quan-tri">
        <AdminPanel
          adminUserId={user.id}
          overview={adminOverview}
          users={adminUsers}
          reports={adminReports}
          tasks={adminTasks}
          onRefresh={onRefresh}
        />
      </div>

      <div id="cong-viec">
        <TaskPanel currentUserId={user.id} currentUserRole={user.role} tasks={tasks} onChanged={onRefresh} />
      </div>

      <div>
        <TaskHistoryPanel items={taskHistory} currentUserRole={user.role} />
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
