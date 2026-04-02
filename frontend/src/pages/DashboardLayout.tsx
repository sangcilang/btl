import type { ReactNode } from "react";
import type { User } from "../types";

interface DashboardMenuItem {
  id: string;
  label: string;
}

interface DashboardLayoutProps {
  user: User;
  isLoading: boolean;
  error: string;
  onLogout: () => void;
  menuItems?: DashboardMenuItem[];
  children: ReactNode;
}

export function DashboardLayout({
  user,
  isLoading,
  error,
  onLogout,
  menuItems = [],
  children
}: DashboardLayoutProps) {
  return (
    <main className="container">
      <header className="topbar">
        <div>
          <h1>Report Approval</h1>
          <p className="subtext">
            Xin chào {user.userName} ({user.role})
          </p>
        </div>
        <button onClick={onLogout} type="button">
          Đăng xuất
        </button>
      </header>

      {menuItems.length > 0 ? (
        <nav className="menu-bar" aria-label="Điều hướng bảng điều khiển">
          {menuItems.map((item) => (
            <a key={item.id} href={`#${item.id}`} className="menu-link">
              {item.label}
            </a>
          ))}
        </nav>
      ) : null}

      {error ? <p className="error panel">{error}</p> : null}
      {isLoading ? <p className="panel">Đang tải dữ liệu...</p> : null}

      <section className="grid">{children}</section>
    </main>
  );
}
