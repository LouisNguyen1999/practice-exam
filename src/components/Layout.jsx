import { Link, NavLink } from "react-router-dom";
import { BookOpen, ClipboardCheck, History, Home, ListChecks, Stethoscope } from "lucide-react";

export default function Layout({ children, bankState }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-icon"><Stethoscope size={21} /></span>
          <span>
            <strong>MedQuiz</strong>
            <small>Exam Practice</small>
          </span>
        </Link>

        <nav className="desktop-nav">
          <NavItem to="/" icon={<Home size={17} />} label="Home" />
          <NavItem to="/test" icon={<ClipboardCheck size={17} />} label="Test" />
          <NavItem to="/practice" icon={<BookOpen size={17} />} label="Practice" />
          <NavItem to="/questions" icon={<ListChecks size={17} />} label="Questions" />
          <NavItem to="/history" icon={<History size={17} />} label="History" />
        </nav>

        <div className="header-count">
          <strong>{bankState.questions.length}</strong>
          <span>questions</span>
        </div>
      </header>

      <main className="main-content">{children}</main>

      <footer className="footer">
        <span>MedQuiz • Offline React practice</span>
        <span>Question data stays in your browser.</span>
      </footer>
    </div>
  );
}

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
