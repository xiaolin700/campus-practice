import { useState } from "react";
import { Search, Plus, GraduationCap, Home, Wallet, Building, Globe, HelpCircle } from "lucide-react";
import PageHeader from "../components/PageHeader";

interface Category {
  name: string;
  count: number;
  color: string;
  icon: React.ReactNode;
}

const CATEGORIES: Category[] = [
  { name: "教务管理", count: 128, color: "#ff7a59", icon: <GraduationCap size={17} /> },
  { name: "学生生活", count: 76, color: "#4a5cff", icon: <Home size={17} /> },
  { name: "财务与奖助学金", count: 42, color: "#33b679", icon: <Wallet size={17} /> },
  { name: "校园设施", count: 59, color: "#ffb020", icon: <Building size={17} /> },
  { name: "网络与信息化", count: 31, color: "#a259ff", icon: <Globe size={17} /> },
  { name: "常见问题 FAQ", count: 95, color: "#ff5c7a", icon: <HelpCircle size={17} /> },
];

export default function KnowledgePage() {
  const [search, setSearch] = useState("");

  const filtered = CATEGORIES.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <PageHeader
        breadcrumb="03 / KNOWLEDGE BASE"
        title="知识库"
        subtitle="管理与浏览校园问答系统知识库分类"
      />

      <div className="kb-toolbar">
        <label className="kb-search">
          <Search size={14} style={{ color: "var(--color-text-gray)", marginRight: 6 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索知识库文章…"
            style={{ border: "none", outline: "none", background: "transparent", flex: 1, fontSize: 11, color: "var(--color-text-dark)" }}
          />
        </label>
        <button
          className="kb-add-btn"
          onClick={() => alert("演示界面，暂未实现")}
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="kb-grid">
        {filtered.map((cat) => (
          <div key={cat.name} className="kb-card card">
            <div className="kb-card-icon" style={{ background: cat.color }}>
              {cat.icon}
            </div>
            <div className="kb-card-name">{cat.name}</div>
            <div className="kb-card-count">{cat.count} 篇</div>
          </div>
        ))}
      </div>
    </div>
  );
}
