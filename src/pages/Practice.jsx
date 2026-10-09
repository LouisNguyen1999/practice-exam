import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Shuffle } from "lucide-react";
import QuestionCard from "../components/QuestionCard";
import { shuffle } from "../utils/random";

export default function Practice({ bank }) {
  const [questions, setQuestions] = useState(() => shuffle(bank.questions));
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showAnswer, setShowAnswer] = useState(false);

  const question = questions[current];

  function newQuestion() {
    setQuestions((prev) => {
      const next = shuffle(prev);
      return next;
    });
    setCurrent(0);
    setAnswers({});
    setShowAnswer(false);
  }

  function selectAnswer(option) {
    setAnswers((prev) => ({ ...prev, [question.id]: option }));
    setShowAnswer(true);
  }

  const progress = useMemo(
    () => `${current + 1} / ${questions.length}`,
    [current, questions.length]
  );

  if (!question) return null;

  return (
    <div className="container practice-container">
      <div className="page-heading practice-heading">
        <div>
          <span className="eyebrow">Practice mode</span>
          <h1>One question at a time</h1>
          <p>{progress}</p>
        </div>
        <button className="btn btn-secondary" onClick={newQuestion}>
          <Shuffle size={17} /> Shuffle
        </button>
      </div>

      <QuestionCard
        question={question}
        selected={answers[question.id]}
        onSelect={selectAnswer}
        showResult={showAnswer}
      />

      <div className="test-navigation">
        <button
          className="btn btn-secondary"
          disabled={current === 0}
          onClick={() => {
            setCurrent((value) => value - 1);
            setShowAnswer(Boolean(answers[questions[current - 1]?.id]));
          }}
        >
          <ArrowLeft size={17} /> Previous
        </button>

        <button
          className="btn btn-primary"
          disabled={current === questions.length - 1}
          onClick={() => {
            setCurrent((value) => value + 1);
            setShowAnswer(Boolean(answers[questions[current + 1]?.id]));
          }}
        >
          Next <ArrowRight size={17} />
        </button>
      </div>
    </div>
  );
}
