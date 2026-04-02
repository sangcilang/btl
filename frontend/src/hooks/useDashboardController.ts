import { useEffect, useMemo, useState } from "react";
import {
  getAdminOverview,
  getAdminReports,
  getAdminTasks,
  getAdminUsers,
  getApprovalHistoryByUser,
  getDashboardStats,
  getPendingReports,
  getReportHistory,
  getReports,
  getTaskHistory,
  getTasks
} from "../lib/api";
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

function getApprovalLevel(role: User["role"]): number | null {
  if (role === "Manager") {
    return 1;
  }

  if (role === "Director") {
    return 2;
  }

  return null;
}

async function getStaffApprovalHistory(reports: Report[]): Promise<ReportHistoryItem[]> {
  const historyResults = await Promise.all(reports.map((report) => getReportHistory(report.id)));

  return historyResults
    .flat()
    .sort((left, right) => new Date(right.approvedAt).getTime() - new Date(left.approvedAt).getTime());
}

export function useDashboardController(user: User | null) {
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [teamReports, setTeamReports] = useState<Report[]>([]);
  const [pendingReports, setPendingReports] = useState<Report[]>([]);
  const [approvalHistory, setApprovalHistory] = useState<ReportHistoryItem[]>([]);
  const [stats, setStats] = useState<ReportStatistics>({
    totalReports: 0,
    pendingManager: 0,
    pendingDirector: 0,
    returnedReports: 0,
    approvedReports: 0
  });
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [taskHistory, setTaskHistory] = useState<TaskHistoryItem[]>([]);
  const [adminOverview, setAdminOverview] = useState<AdminOverview>({
    totalUsers: 0,
    totalReports: 0,
    totalTasks: 0,
    pendingReports: 0
  });
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminReports, setAdminReports] = useState<Report[]>([]);
  const [adminTasks, setAdminTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const approvalLevel = useMemo(() => (user ? getApprovalLevel(user.role) : null), [user]);

  async function loadData(currentUser: User) {
    try {
      setIsLoading(true);
      setError("");

      const reportData = await getReports();
      const mine = reportData.filter((x) => x.createdByUserId === currentUser.id);
      const subordinate = reportData.filter((x) => x.createdByUserId !== currentUser.id);

      setMyReports(mine);
      setTeamReports(subordinate);

      if (approvalLevel) {
        const pending = await getPendingReports(approvalLevel);
        setPendingReports(pending);
      } else {
        setPendingReports([]);
      }

      if (currentUser.role === "Manager" || currentUser.role === "Director") {
        const history = await getApprovalHistoryByUser();
        setApprovalHistory(history);
      } else if (currentUser.role === "Staff") {
        const history = await getStaffApprovalHistory(mine);
        setApprovalHistory(history);
      } else {
        setApprovalHistory([]);
      }

      if (currentUser.role !== "Staff") {
        const statData = await getDashboardStats();
        setStats(statData);
      } else {
        setStats({
          totalReports: 0,
          pendingManager: 0,
          pendingDirector: 0,
          returnedReports: 0,
          approvedReports: 0
        });
      }

      const taskData = await getTasks();
      setTasks(taskData);

      if (currentUser.role === "Director" || currentUser.role === "Admin") {
        const taskHistoryData = await getTaskHistory();
        setTaskHistory(taskHistoryData);
      } else {
        setTaskHistory([]);
      }

      if (currentUser.role === "Admin") {
        const [overviewData, usersData, reportsData, tasksData] = await Promise.all([
          getAdminOverview(),
          getAdminUsers(),
          getAdminReports(),
          getAdminTasks()
        ]);
        setAdminOverview(overviewData);
        setAdminUsers(usersData);
        setAdminReports(reportsData);
        setAdminTasks(tasksData);
      } else {
        setAdminUsers([]);
        setAdminReports([]);
        setAdminTasks([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể tải dữ liệu.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!user) {
      return;
    }
    void loadData(user);
  }, [user, approvalLevel]);

  function clearData() {
    setMyReports([]);
    setTeamReports([]);
    setPendingReports([]);
    setApprovalHistory([]);
    setTasks([]);
    setTaskHistory([]);
    setAdminUsers([]);
    setAdminReports([]);
    setAdminTasks([]);
  }

  async function refresh() {
    if (!user) {
      return;
    }
    await loadData(user);
  }

  return {
    approvalLevel,
    myReports,
    teamReports,
    pendingReports,
    approvalHistory,
    stats,
    tasks,
    taskHistory,
    adminOverview,
    adminUsers,
    adminReports,
    adminTasks,
    isLoading,
    error,
    refresh,
    clearData
  };
}
