import PageHeader from "../components/PageHeader";

export default function HistoryPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <PageHeader
        breadcrumb="02 / HISTORY"
        title="提问历史"
        subtitle="查看你最近向助手提出的所有问题记录"
      />

      <div className="page-body" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div className="card card-fill" style={{ alignItems: "center", justifyContent: "center" }}>
          <div className="history-card">
            <svg viewBox="0 0 140 110" fill="none" style={{ width: 140, height: 110 }}>
              <rect x="20" y="15" width="90" height="65" rx="8" fill="#eef0ff" />
              <rect x="20" y="15" width="35" height="12" rx="4" fill="#eef0ff" />
              <circle cx="85" cy="55" r="22" fill="none" stroke="#8b8fa3" strokeWidth="3" />
              <line x1="100" y1="70" x2="115" y2="85" stroke="#8b8fa3" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <span className="history-empty-text">暂无历史记录</span>
          </div>
        </div>
      </div>
    </div>
  );
}
