import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import QuestionCard from "../components/QuestionCard";

export default function Result() {
  const data = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("medquiz-last-result") || "null");
    } catch {
      return null;
    }
  }, []);

  if (!data) {
    return (
      <div className="container narrow">
        <div className="empty-card">
          <h2>No test result found</h2>
          <Link className="btn btn-primary" to="/test">Start a test</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <section className="result-hero">
        <div className="score-circle">
          <strong>{data.score}%</strong>
          <span>score</span>
        </div>
        <div>
          <span className="eyebrow">Test completed</span>
          <h1>{getMessage(data.score)}</h1>
          <p>You answered {data.correct} of {data.total} questions correctly.</p>
        </div>
      </section>

      <div className="result-stats">
        <ResultStat icon={<CheckCircle2 />} value={data.correct} label="Correct" />
        <ResultStat icon={<XCircle />} value={data.wrong} label="Wrong" />
        <ResultStat icon={<span className="question-mark">?</span>} value={data.unanswered} label="Unanswered" />
      </div>

      <div className="section-heading review-heading">
        <div>
          <span className="eyebrow">Review</span>
          <h2>Check your answers</h2>
        </div>
        <Link className="btn btn-primary" to="/test">
          Choose next test <ArrowRight size={17} />
        </Link>
      </div>

      <div className="review-list">
        {data.questions.map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            selected={data.answers[question.id]}
            onSelect={() => {}}
            showResult
          />
        ))}
      </div>

      <Link className="back-link result-back" to="/"><ArrowLeft size={15} /> Back home</Link>
    </div>
  );
}

function ResultStat({ icon, value, label }) {
  return (
    <div className="result-stat">
      <div className="result-stat-icon">{icon}</div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function getMessage(score) {
  if (score >= 90) return "Excellent work! 🎉";
  if (score >= 80) return "Great job! Keep going.";
  if (score >= 70) return "Good progress. Review your mistakes.";
  if (score >= 50) return "Keep practicing. You are getting there.";
  return "Don't give up. Review and try again.";
}
