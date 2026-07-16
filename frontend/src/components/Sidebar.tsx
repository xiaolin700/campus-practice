import {
  BookOpen,
  Clock,
  LogOut,
  MessageCircle,
  Users,
} from "lucide-react";
import { useAuth } from "../context/auth-context";

interface NavItem {
  id: string;
  number: string;
  icon: React.ReactNode;
  label: string;
}

const navItems: NavItem[] = [
  { id: "qa", number: "01", icon: <MessageCircle size={14} />, label: "问答" },
  { id: "history", number: "02", icon: <Clock size={14} />, label: "历史" },
  { id: "knowledge", number: "03", icon: <BookOpen size={14} />, label: "知识库" },
  { id: "users", number: "04", icon: <Users size={14} />, label: "用户" },
];

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const { user, logout, isAdmin } = useAuth();
  const initials = user?.name?.charAt(0)?.toUpperCase() || "?";

  return (
    <aside className="sidebar">
      <div className="sidebar-top-accent" />

      <div className="sidebar-header">
        <div className="sidebar-logo">
          <svg viewBox="0 0 30 30" fill="none">
            <rect x="2" y="4" width="10" height="22" rx="2" fill="#ff7a59" />
            <rect x="14" y="2" width="14" height="26" rx="2" fill="#4a5cff" />
            <rect x="17" y="6" width="8" height="3" rx="1" fill="white" opacity="0.5" />
            <rect x="17" y="12" width="8" height="3" rx="1" fill="white" opacity="0.5" />
            <rect x="17" y="18" width="6" height="3" rx="1" fill="white" opacity="0.5" />
          </svg>
        </div>
        <div className="sidebar-title-group">
          <span className="sidebar-title">知语校园</span>
          <span className="sidebar-subtitle">CAMPUS Q&A</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <div
            key={item.id}
            className={`sidebar-nav-item${activePage === item.id ? " active" : ""}`}
            onClick={() => onNavigate(item.id)}
          >
            <div className="nav-marker" />
            <span className="nav-number">{item.number}</span>
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-divider" />
        <div className="sidebar-footer-inner">
          <div className="sidebar-user-row">
            <div className="sidebar-user-avatar">
              <div className="sidebar-avatar-ring">
                <div className="sidebar-avatar-inner">{initials}</div>
              </div>
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.name || "用户"}</span>
              <span className="sidebar-user-role">
                {isAdmin() ? "管理员" : "用户"}
              </span>
            </div>
          </div>
          <button className="sidebar-logout-btn" onClick={logout}>
            <LogOut size={14} />
            退出登录
          </button>
        </div>
      </div>
    </aside>
  );
}
