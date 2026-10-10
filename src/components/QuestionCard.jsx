import QuestionContent, { OptionContent } from "./QuestionContent";

export default function QuestionCard({
  question,
  selected,
  onSelect,
  showResult = false
}) {
  return (
    <section className="question-card">
      <div className="question-number">
        Question {question.number ?? ""}
      </div>

      <QuestionContent question={question} />

      <div className="options">
        {question.options.map((option, index) => {
          const isSelected = selected === option.id;
          const isCorrect =
            showResult && option.id === question.correctAnswer;
          const isWrong = showResult && isSelected && !isCorrect;

          return (
            <button
              type="button"
              key={`${question.id}-${option.id}-${index}`}
              className={[
                "option",
                isSelected ? "selected" : "",
                isCorrect ? "correct" : "",
                isWrong ? "wrong" : ""
              ].join(" ")}
              onClick={() => !showResult && onSelect(option.id)}
              disabled={showResult}
            >
              <span className="option-key">{option.id}</span>
              <OptionContent option={option} />

              {isCorrect && (
                <span className="answer-badge">Correct</span>
              )}

              {isWrong && (
                <span className="answer-badge">Your answer</span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
