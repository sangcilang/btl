import { useAuthSession } from "./hooks/useAuthSession";
import { useDashboardController } from "./hooks/useDashboardController";
import { AdminPage } from "./pages/AdminPage";
import { DirectorPage } from "./pages/DirectorPage";
import { LoginPage } from "./pages/LoginPage";
import { ManagerPage } from "./pages/ManagerPage";
import { StaffPage } from "./pages/StaffPage";

export default function App() {
  const { user, login, logout } = useAuthSession();
  const controller = useDashboardController(user);

  function handleLogout() {
    logout();
    controller.clearData();
  }

  if (!user) {
    return <LoginPage onLoginSuccess={login} />;
  }

  if (user.role === "Admin") {
    return (
      <AdminPage
        user={user}
        isLoading={controller.isLoading}
        error={controller.error}
        myReports={controller.myReports}
        teamReports={controller.teamReports}
        approvalHistory={controller.approvalHistory}
        stats={controller.stats}
        tasks={controller.tasks}
        taskHistory={controller.taskHistory}
        adminOverview={controller.adminOverview}
        adminUsers={controller.adminUsers}
        adminReports={controller.adminReports}
        adminTasks={controller.adminTasks}
        onRefresh={controller.refresh}
        onLogout={handleLogout}
      />
    );
  }

  if (user.role === "Director") {
    return (
      <DirectorPage
        user={user}
        isLoading={controller.isLoading}
        error={controller.error}
        myReports={controller.myReports}
        teamReports={controller.teamReports}
        pendingReports={controller.pendingReports}
        approvalHistory={controller.approvalHistory}
        stats={controller.stats}
        tasks={controller.tasks}
        taskHistory={controller.taskHistory}
        onRefresh={controller.refresh}
        onLogout={handleLogout}
      />
    );
  }

  if (user.role === "Manager") {
    return (
      <ManagerPage
        user={user}
        isLoading={controller.isLoading}
        error={controller.error}
        myReports={controller.myReports}
        teamReports={controller.teamReports}
        pendingReports={controller.pendingReports}
        approvalHistory={controller.approvalHistory}
        stats={controller.stats}
        tasks={controller.tasks}
        onRefresh={controller.refresh}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <StaffPage
      user={user}
      isLoading={controller.isLoading}
      error={controller.error}
      myReports={controller.myReports}
      approvalHistory={controller.approvalHistory}
      tasks={controller.tasks}
      onRefresh={controller.refresh}
      onLogout={handleLogout}
    />
  );
}
