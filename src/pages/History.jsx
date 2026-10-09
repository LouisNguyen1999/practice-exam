import { Link } from "react-router-dom";
import { CalendarDays, Trash2, Trophy } from "lucide-react";
import { clearHistory, getHistory } from "../utils/scoring";
import { useState } from "react";

export default function History() {
  const [history, setHistory] = useState(getHistory());

  function removeAll() {
    clearHistory();
    setHistory([]);
  }

  return (
    <div className="container">
      <div className="page-heading history-heading">
        <div>
          <span className="eyebrow">Progress</span>
          <h1>Test history</h1>
          <p>Your results are stored locally in this browser.</p>
        </div>
        {history.length > 0 && (
          <button className="btn btn-danger-outline" onClick={removeAll}>
            <Trash2 size={16} /> Clear history
          </button>
        )}
      </div>

      {!history.length ? (
        <div className="empty-card">
          <Trophy size={30} />
          <h2>No tests yet</h2>
          <p>Complete a test and your score will appear here.</p>
          <Link className="btn btn-primary" to="/test">Start a test</Link>
        </div>
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <div className="history-item" key={item.id}>
              <div className="history-icon"><Trophy size={18} /></div>
              <div className="history-main">
                <strong>Practice Test</strong>
                <span><CalendarDays size={14} /> {formatDate(item.date)}</span>
              </div>
              <div className="history-score">
                <strong>{item.score}%</strong>
                <span>{item.correct}/{item.total} correct</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
