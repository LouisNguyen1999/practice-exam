import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, ClipboardCheck, Send } from "lucide-react";
import QuestionCard from "../components/QuestionCard";
import QuestionNavigator from "../components/QuestionNavigator";
import ProgressBar from "../components/ProgressBar";
import { createTestBatches } from "../utils/random";
import { calculateResult, getHistory, saveHistory } from "../utils/scoring";

const TEST_SIZE = 50;
const SESSION_KEY = "medquiz-current-test-v2";

export default function Test({ bank }) {
  const navigate = useNavigate();
  const batches = useMemo(() => createTestBatches(bank.questions, TEST_SIZE), [bank.questions]);
  const [batchIndex, setBatchIndex] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
      const batch = batches[stored?.batchIndex];
      const matchesBatch = batch && JSON.stringify(batch.map((q) => q.id)) === JSON.stringify(stored.questionIds);
      if (matchesBatch) {
        setBatchIndex(stored.batchIndex);
        setQuestions(batch);
        setAnswers(stored.answers || {});
        setCurrent(Math.min(stored.current || 0, batch.length - 1));
        setStarted(true);
      } else {
        sessionStorage.removeItem(SESSION_KEY);
      }
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, [batches]);

  useEffect(() => {
    if (started) {
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ batchIndex, questionIds: questions.map((q) => q.id), answers, current })
      );
    }
  }, [started, batchIndex, questions, answers, current]);

  const answered = useMemo(() => Object.keys(answers).length, [answers]);
  const completedBatches = useMemo(
    () => new Set(getHistory().map((item) => item.batchIndex).filter(Number.isInteger)),
    [started]
  );

  function startTest(index) {
    const next = batches[index] || [];
    setBatchIndex(index);
    setQuestions(next);
    setAnswers({});
    setCurrent(0);
    setStarted(true);
    sessionStorage.removeItem(SESSION_KEY);
  }

  function selectAnswer(optionId) {
    setAnswers((prev) => ({ ...prev, [questions[current].id]: optionId }));
  }

  function submit() {
    const result = calculateResult(questions, answers);
    const historyItem = saveHistory({
      ...result,
      batchIndex,
      answers,
      questions: questions.map((q) => q.id)
    });

    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.setItem(
      "medquiz-last-result",
      JSON.stringify({ ...historyItem, questions, answers })
    );
    navigate("/result");
  }

  if (!started) {
    return (
      <div className="container narrow">
        <div className="page-heading">
          <div>
            <span className="eyebrow">Sequential tests</span>
            <h1>Choose a test</h1>
            <p>{bank.questions.length} questions split in source order into {batches.length} tests.</p>
          </div>
        </div>
        {!batches.length ? (
          <div className="empty-card"><h2>No questions available</h2></div>
        ) : (
          <div className="batch-list">
            {batches.map((batch, index) => (
              <article className="batch-card" key={index}>
                <div className="setup-icon"><ClipboardCheck size={24} /></div>
                <div className="batch-details">
                  <strong>Test {index + 1}</strong>
                  <span>Questions {index * TEST_SIZE + 1}–{index * TEST_SIZE + batch.length} · {batch.length} questions</span>
                </div>
                {completedBatches.has(index) && <span className="batch-completed">Completed</span>}
                <button className="btn btn-primary" onClick={() => startTest(index)}>
                  {completedBatches.has(index) ? "Retake" : "Start"} <ArrowRight size={17} />
                </button>
              </article>
            ))}
          </div>
        )}
        <Link className="back-link" to="/"><ArrowLeft size={15} /> Back home</Link>
      </div>
    );
  }

  const question = questions[current];
  const isLast = current === questions.length - 1;

  return (
    <div className="container test-container">
      <div className="test-top">
        <div>
          <button className="back-link test-exit" onClick={() => setStarted(false)}><ArrowLeft size={15} /> All tests</button>
          <h1>Test {batchIndex + 1}</h1>
        </div>
        <div className="answered-count">{answered}/{questions.length} answered</div>
      </div>

      <ProgressBar current={current} total={questions.length} />

      <div className="test-layout">
        <QuestionNavigator questions={questions} answers={answers} current={current} onJump={setCurrent} />
        <div className="test-main">
          <QuestionCard question={question} selected={answers[question.id]} onSelect={selectAnswer} />
          <div className="test-navigation">
            <button className="btn btn-secondary" disabled={current === 0} onClick={() => setCurrent((value) => value - 1)}>
              <ArrowLeft size={17} /> Previous
            </button>
            {!isLast ? (
              <button className="btn btn-primary" onClick={() => setCurrent((value) => value + 1)}>
                Next <ArrowRight size={17} />
              </button>
            ) : (
              <button className="btn btn-success" onClick={submit}>
                Submit test <Send size={17} />
              </button>
            )}
          </div>
          {isLast && answered < questions.length && (
            <p className="submit-hint"><Check size={15} /> {questions.length - answered} unanswered question(s). You can still submit.</p>
          )}
        </div>
      </div>
    </div>
  );
}
