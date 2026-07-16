import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useAuth } from "../context/auth-context";
import { api, type ApiUser } from "../api";
import { Loader, Search, Trash2, UserPlus, X } from "lucide-react";
import PageHeader from "../components/PageHeader";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function CreateUserModal({
  token,
  onClose,
  onCreated,
}: {
  token: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.users.create(token, name, email, password, role);
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(errorMessage(err, "创建失败"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><UserPlus size={16} /> 新建用户</h3>
          <button onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>姓名</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入姓名" required minLength={2} />
          </div>
          <div className="form-group">
            <label>邮箱</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="请输入邮箱" required />
          </div>
          <div className="form-group">
            <label>密码</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="至少6位字符" required minLength={6} />
          </div>
          <div className="form-group">
            <label>角色</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="STUDENT">学生 (STUDENT)</option>
              <option value="ADMIN">管理员 (ADMIN)</option>
            </select>
          </div>
          {error && <div className="form-error">{error}</div>}
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "创建中..." : "创建用户"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { token, user, isAdmin } = useAuth();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const loadUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.users.list(token);
      setUsers(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRoleChange = async (target: ApiUser, newRole: string) => {
    if (!token || newRole === target.role) return;
    try {
      await api.users.update(token, target.id, { role: newRole });
      await loadUsers();
    } catch {
      // ignore
    }
  };

  const toggleActive = async (target: ApiUser) => {
    if (!token) return;
    if (target.id === user?.id) return;
    try {
      await api.users.update(token, target.id, { is_active: !target.is_active });
      await loadUsers();
    } catch {
      // ignore
    }
  };

  const handleDelete = async (target: ApiUser) => {
    if (!token) return;
    if (target.id === user?.id) return;
    if (!confirm(`确定要删除用户「${target.name}」吗？此操作不可恢复。`)) return;
    try {
      await api.users.delete(token, target.id);
      await loadUsers();
    } catch {
      // ignore
    }
  };

  const visibleUsers = users.filter((u) =>
    `${u.name} ${u.email}`.toLowerCase().includes(query.toLowerCase()),
  );

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="users-page-inner">
      <div className="users-page-header">
        <div className="users-breadcrumb-title">
          <span className="page-header-breadcrumb">04 / USERS</span>
          <h1 className="page-header-title">用户与权限</h1>
          <p className="page-header-subtitle">系统当前只有管理员账号可以管理用户信息</p>
        </div>
        <div className="users-pill">
          <span className="pill pill-success">管理操作仅限管理员可见</span>
        </div>
      </div>
      <div className="page-header-divider" />

      <div className="page-body" style={{ display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
        <label className="kb-search" style={{ maxWidth: 300, background: "white" }}>
          <Search size={14} style={{ color: "var(--color-text-gray)", marginRight: 6 }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索姓名或邮箱"
            style={{ border: "none", outline: "none", background: "transparent", flex: 1, fontSize: 14, color: "var(--color-text-dark)" }}
          />
        </label>
        {isAdmin() && (
          <button className="users-add-btn" onClick={() => setShowCreate(true)}>
            <UserPlus size={14} /> 添加用户
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading">
          <Loader size={24} className="spin" /> 加载中...
        </div>
      ) : (
        <div className="page-body" style={{ flex: 1, paddingTop: 0, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div className="card card-fill">
            <div className="users-table-header">
              <span className="users-table-header-cell">用户</span>
              <span className="users-table-header-cell">角色</span>
              <span className="users-table-header-cell">状态</span>
              <span className="users-table-header-cell">注册时间</span>
              <span className="users-table-header-cell">操作</span>
            </div>
            <div className="users-table-divider" />
            <div className="users-table-body">
              {visibleUsers.length === 0 && (
                <div style={{ textAlign: "center", padding: 40, color: "var(--color-text-gray)", fontSize: 13 }}>
                  暂无用户
                </div>
              )}
              {visibleUsers.map((u) => {
                const initials = u.name.charAt(0).toUpperCase();
                const isSelf = u.id === user?.id;
                return (
                  <div key={u.id} className="users-row">
                    <div className="users-cell">
                      <div className="users-cell-avatar">
                        <div className="users-cell-avatar-inner">{initials}</div>
                      </div>
                      <div className="users-cell-info">
                        <span className="users-cell-name">
                          {u.name}{isSelf ? "（你）" : ""}
                        </span>
                        <span className="users-cell-email">{u.email}</span>
                      </div>
                    </div>
                    <div>
                      {isAdmin() && u.id !== user?.id ? (
                        <select
                          className="users-role-select"
                          value={u.role}
                          onChange={(e) => handleRoleChange(u, e.target.value)}
                        >
                          <option value="STUDENT">学生</option>
                          <option value="ADMIN">管理员</option>
                        </select>
                      ) : (
                        <span style={{ fontSize: 13, color: "var(--color-text-gray)" }}>
                          {u.role === "ADMIN" ? "管理员" : "学生"}
                        </span>
                      )}
                    </div>
                    <div>
                      {u.id !== user?.id ? (
                        <span
                          className={`users-status ${u.is_active ? "active" : "inactive"}`}
                          onClick={() => toggleActive(u)}
                        >
                          {u.is_active ? "● 启用" : "○ 停用"}
                        </span>
                      ) : (
                        <span className="users-status active">● 启用</span>
                      )}
                    </div>
                    <div className="users-time">{formatTime(u.created_at)}</div>
                    <div>
                      {isAdmin() && u.id !== user?.id && (
                        <button
                          className="users-delete-btn"
                          onClick={() => handleDelete(u)}
                          title="删除用户"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showCreate && isAdmin() && token && (
        <CreateUserModal
          token={token}
          onClose={() => setShowCreate(false)}
          onCreated={loadUsers}
        />
      )}
    </div>
  );
}
