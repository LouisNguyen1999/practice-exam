import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, ClipboardCheck, FileText, Trophy } from "lucide-react";
import { getHistory } from "../utils/scoring";
import { createTestBatches } from "../utils/random";

export default function Home({ bank }) {
  const history = getHistory();
  const best = history.length ? Math.max(...history.map((item) => item.score)) : 0;
  const avg = history.length
    ? Math.round(history.reduce((sum, item) => sum + item.score, 0) / history.length)
    : 0;
  const testCount = createTestBatches(bank.questions).length;

  return (
    <div className="container">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="pulse-dot" /> Offline study mode</div>
          <h1>Practice smarter.<br /><span>Master every question.</span></h1>
          <p>
            Study every question in order with complete 50-question tests, then review
            your answers and track your progress.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" to="/test">
              View {testCount} tests <ArrowRight size={18} />
            </Link>
            <Link className="btn btn-secondary" to="/practice">
              Practice questions
            </Link>
          </div>
        </div>

        <div className="hero-card">
          <div className="hero-card-icon"><ClipboardCheck size={25} /></div>
          <strong>Complete question coverage</strong>
          <span>{testCount} ordered tests · {bank.questions.length} questions</span>
          <div className="mini-stat"><CheckCircle2 size={16} /> Instant scoring</div>
          <div className="mini-stat"><Trophy size={16} /> Progress history</div>
        </div>
      </section>

      <section className="stats-grid">
        <Stat icon={<FileText />} value={bank.questions.length} label="Question bank" />
        <Stat icon={<CheckCircle2 />} value={history.length} label="Tests completed" />
        <Stat icon={<Trophy />} value={`${best}%`} label="Best score" />
        <Stat icon={<ClipboardCheck />} value={`${avg}%`} label="Average score" />
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Your question bank</span>
            <h2>Imported documents</h2>
          </div>
          <Link to="/questions" className="text-link">View all <ArrowRight size={15} /></Link>
        </div>

        <div className="source-grid">
          {bank.sources.map((source) => (
            <div className="source-card" key={source.name}>
              <div className="source-icon"><FileText size={20} /></div>
              <div>
                <strong>{source.name}</strong>
                <span>{source.count} questions</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ icon, value, label }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
