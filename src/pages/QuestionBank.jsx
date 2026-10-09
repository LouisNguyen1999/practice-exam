import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

export default function QuestionBank({ bank }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const categories = ["All", ...new Set(bank.questions.map((q) => q.category))];

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return bank.questions.filter((q) => {
      const matchesCategory = category === "All" || q.category === category;
      const haystack = [
        q.question,
        q.category,
        q.source,
        ...q.options.map((option) => option.text)
      ].join(" ").toLowerCase();

      return matchesCategory && (!query || haystack.includes(query));
    });
  }, [bank.questions, search, category]);

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
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((item) => <option key={item}>{item}</option>)}
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
            <h3>{question.question}</h3>
            <div className="bank-options">
              {question.options.map((option) => (
                <div className={`bank-option ${option.id === question.correctAnswer ? "is-correct" : ""}`} key={`${question.id}-${option.id}-${index}`}>
                  <strong>{option.id}</strong>
                  <span>{option.text}</span>
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
