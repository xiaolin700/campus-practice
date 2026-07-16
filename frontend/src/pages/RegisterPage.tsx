import { type FormEvent, useState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { useAuth } from "../context/auth-context";
import { api } from "../api";
import AuthIllustration from "../components/AuthIllustration";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

interface RegisterPageProps {
  onToggle: () => void;
}

export default function RegisterPage({ onToggle }: RegisterPageProps) {
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setLoading(true);
    try {
      const data = await api.register(name, email, password);
      login(data.token, data.user);
    } catch (err: unknown) {
      setError(errorMessage(err, "注册失败"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-left">
        <div className="auth-left-accent" />
        <div className="auth-left-logo">
          <svg viewBox="0 0 60 60" fill="none" width="60" height="60">
            <rect x="4" y="8" width="20" height="44" rx="4" fill="#ff7a59" />
            <rect x="28" y="4" width="28" height="52" rx="4" fill="#4a5cff" />
            <rect x="34" y="12" width="16" height="6" rx="2" fill="white" opacity="0.5" />
            <rect x="34" y="24" width="16" height="6" rx="2" fill="white" opacity="0.5" />
            <rect x="34" y="36" width="12" height="6" rx="2" fill="white" opacity="0.5" />
          </svg>
        </div>
        <h1 className="auth-left-title">知语校园</h1>
        <p className="auth-left-subtitle">CAMPUS Q&A ASSISTANT</p>
        <div className="auth-left-illust">
          <AuthIllustration />
        </div>
        <p className="auth-left-quote">
          让校园里的每一个问题
          <br />
          都能被快速、准确地解答
        </p>
        <div className="auth-left-badges">
          <span className="auth-left-badge">✓ 7x24 在线</span>
          <span className="auth-left-badge">✓ 知识库驱动</span>
          <span className="auth-left-badge">✓ 管理员统一登录</span>
        </div>
      </section>

      <section className="auth-right">
        <div className="auth-form-card" style={{ height: 620 }}>
          <h2 className="form-title">注册账号</h2>
          <p className="form-subtitle">填写以下信息创建你的管理员账号</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>用户名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入用户名"
                required
                minLength={2}
              />
            </div>
            <div className="form-group">
              <label>邮箱（作为登录账号）</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱"
                required
              />
            </div>
            <div className="form-group">
              <label>密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少6位字符"
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label>确认密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入密码"
                required
                minLength={6}
              />
            </div>
            {error && <div className="form-error">{error}</div>}
            <button
              type="submit"
              className="btn btn-secondary btn-block"
              disabled={loading}
            >
              <UserPlus size={18} />
              {loading ? "注册中..." : "注  册"}
            </button>
          </form>

          <div className="auth-toggle-row">
            <span>已经有账号？</span>
            <button className="btn-link btn-link-register" onClick={onToggle}>
              去登录
            </button>
          </div>

          <p className="form-footer-text">演示系统 · 仅用于前端界面展示</p>
        </div>
      </section>
    </div>
  );
}
