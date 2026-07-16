import { useState } from "react";
import { useAuth } from "./context/auth-context";
import Sidebar from "./components/Sidebar";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import QAPage from "./pages/QAPage";
import HistoryPage from "./pages/HistoryPage";
import KnowledgePage from "./pages/KnowledgePage";
import UsersPage from "./pages/UsersPage";

export default function App() {
  const { token } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [activePage, setActivePage] = useState("qa");

  if (!token) {
    return showRegister ? (
      <RegisterPage onToggle={() => setShowRegister(false)} />
    ) : (
      <LoginPage onToggle={() => setShowRegister(true)} />
    );
  }

  const renderPage = () => {
    switch (activePage) {
      case "qa":
        return <QAPage />;
      case "history":
        return <HistoryPage />;
      case "knowledge":
        return <KnowledgePage />;
      case "users":
        return <UsersPage />;
      default:
        return <QAPage />;
    }
  };

  return (
    <div className="app-root">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}
