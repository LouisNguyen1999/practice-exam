export default function QuestionNavigator({ questions, answers, current, onJump }) {
  return (
    <div className="navigator-card">
      <div className="navigator-title">
        <strong>Questions</strong>
        <span>{Object.keys(answers).length}/{questions.length}</span>
      </div>

      <div className="question-grid">
        {questions.map((question, index) => (
          <button
            type="button"
            key={question.id}
            className={[
              "question-dot",
              answers[question.id] ? "answered" : "",
              index === current ? "current" : ""
            ].join(" ")}
            onClick={() => onJump(index)}
            aria-label={`Go to question ${index + 1}`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
