import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import QuestionContent, { OptionContent } from "../components/QuestionContent";

export default function QuestionBank({ bank }) {
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("All");

  const sources = [...new Map(
    bank.questions.map((question) => {
      const name = String(question.source || question.category || "").trim();
      return [name, { value: name, label: question.category || name }];
    }).filter(([name]) => name)
  ).values()];
  const selectedSource = sources.some((item) => item.value === source)
    ? source
    : sources.find((item) => item.label === source)?.value || "All";

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return bank.questions.filter((q) => {
      const questionSource = String(q.source || q.category || "").trim();
      const matchesSource = selectedSource === "All" || questionSource === selectedSource;
      const haystack = [
        q.question,
        q.category,
        q.source,
        ...q.options.map((option) => option.text)
      ].join(" ").toLowerCase();

      return matchesSource && (!query || haystack.includes(query));
    });
  }, [bank.questions, search, selectedSource]);

  return (
    <div className="container">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Question bank</span>
          <h1>All questions</h1>
          <p>Search and review the imported questions.</p>
        </div>
      </div>

      <div className="filters">
        <div className="search-box">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search questions..."
          />
        </div>

        <div className="select-box">
          <SlidersHorizontal size={17} />
          <select value={selectedSource} onChange={(event) => setSource(event.target.value)}>
            <option value="All">All</option>
            {sources.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
      </div>

      <div className="question-list">
        {filtered.map((question, index) => (
          <article className="bank-question" key={question.id}>
            <div className="bank-question-top">
              <span>#{index + 1}</span>
              <span className="category-pill">{question.category}</span>
              <span className="source-pill">{question.source}</span>
            </div>
            <QuestionContent question={question} className="bank-question-content" as="div" />
            <div className="bank-options">
              {question.options.map((option) => (
                <div className={`bank-option ${option.id === question.correctAnswer ? "is-correct" : ""}`} key={`${question.id}-${option.id}-${index}`}>
                  <strong>{option.id}</strong>
                  <OptionContent option={option} />
                </div>
              ))}
            </div>
          </article>
        ))}

        {!filtered.length && <div className="empty-card">No questions found.</div>}
      </div>
    </div>
  );
}
