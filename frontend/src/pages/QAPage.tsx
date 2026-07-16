import { useState } from "react";
import { Send, MessageCircle } from "lucide-react";
import PageHeader from "../components/PageHeader";

interface ChatMsg {
  who: string;
  text: string;
  time: string;
  isAi: boolean;
}

const QUICK_QUESTIONS = [
  "图书馆开放时间是？",
  "如何申请助学金？",
  "校园卡丢了怎么办？",
  "选课系统怎么操作？",
  "宿舍报修找谁？",
];

export default function QAPage() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      who: "助手",
      text: "你好！欢迎使用知语校园问答系统。我是你的智能校园助手，可以回答关于课程、考试、校园设施、学生服务等方面的问题。请随时向我提问！",
      time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      isAi: true,
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const now = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [
      ...prev,
      { who: "我", text: trimmed, time: now, isAi: false },
      {
        who: "助手",
        text: `收到你的问题：「${trimmed}」。这是演示界面，当前展示的是前端样式效果，实际问答功能需要对接后端 AI 服务。`,
        time: now,
        isAi: true,
      },
    ]);
    setInput("");
  };

  const handleQuestion = (q: string) => {
    setInput(q);
    const now = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [
      ...prev,
      { who: "我", text: q, time: now, isAi: false },
      {
        who: "助手",
        text: `关于「${q}」的问题，这是演示界面。实际回答需要对接后端知识库服务。`,
        time: now,
        isAi: true,
      },
    ]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <PageHeader
        breadcrumb="01 / Q&A"
        title="智能问答"
        subtitle="向校园助手提问，获取即时解答"
      />

      <div className="qa-body" style={{ padding: "16px 36px 24px", flex: 1, minHeight: 0 }}>
        <div className="qa-chat-panel card">
          <div className="qa-chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className="qa-message">
                <div className="qa-message-header">
                  <span className={`qa-message-who ${msg.isAi ? "ai" : "user"}`}>
                    {msg.who}
                  </span>
                  <span className="qa-message-time">{msg.time}</span>
                </div>
                <div className="qa-message-body">{msg.text}</div>
              </div>
            ))}
          </div>
          <div className="qa-input-bar">
            <input
              className="qa-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="输入你的问题…"
            />
            <button className="qa-send-btn" onClick={handleSend}>
              发送
            </button>
          </div>
        </div>

        <div className="qa-right-panel">
          <div className="qa-illust-card">
            <svg viewBox="0 0 320 170" fill="none" style={{ width: 280, height: 150 }}>
              <ellipse cx="140" cy="80" rx="130" ry="75" fill="#eef0ff" />
              <path d="M80 30 L55 50 L80 70" fill="#eef0ff" />
              <ellipse cx="200" cy="110" rx="100" ry="55" fill="#fff1ec" />
              <path d="M310 80 L325 100 L310 120" fill="#fff1ec" />
              <circle cx="60" cy="95" r="12" fill="#ff7a59" />
              <text x="60" y="99" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">我</text>
              <circle cx="270" cy="40" r="12" fill="#4a5cff" />
              <text x="270" y="44" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">AI</text>
              <line x1="85" y1="65" x2="160" y2="65" stroke="#ff7a59" strokeWidth="3" strokeLinecap="round" />
              <line x1="85" y1="80" x2="130" y2="80" stroke="#ff7a59" strokeWidth="3" strokeLinecap="round" />
              <line x1="155" y1="115" x2="230" y2="115" stroke="#4a5cff" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>

          <h3 className="qa-section-title">常见问题</h3>
          {QUICK_QUESTIONS.map((q) => (
            <div key={q} className="qa-question" onClick={() => handleQuestion(q)}>
              <span className="qa-question-arrow">›</span>
              {q}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
