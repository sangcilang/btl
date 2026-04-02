import type { ReportStatistics } from "../../types";

interface StatsPanelProps {
  stats: ReportStatistics;
}

export function StatsPanel({ stats }: StatsPanelProps) {
  const cards = [
    { label: "Tổng báo cáo", value: stats.totalReports },
    { label: "Chờ trưởng phòng", value: stats.pendingManager },
    { label: "Chờ giám đốc", value: stats.pendingDirector },
    { label: "Đã trả về", value: stats.returnedReports },
    { label: "Đã duyệt", value: stats.approvedReports }
  ];

  return (
    <section className="panel">
      <h2>Thống kê báo cáo</h2>
      <div className="stats-grid">
        {cards.map((card) => (
          <div className="stat-card" key={card.label}>
            <p className="subtext">{card.label}</p>
            <strong>{card.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
