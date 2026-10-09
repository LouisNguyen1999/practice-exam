export default function ProgressBar({ current, total }) {
  const value = total ? Math.round(((current + 1) / total) * 100) : 0;

  return (
    <div className="progress-wrap">
      <div className="progress-meta">
        <span>Question {current + 1} of {total}</span>
        <strong>{value}%</strong>
      </div>
      <div className="progress-track">
        <div className="progress-value" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
