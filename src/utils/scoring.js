export function calculateResult(questions, answers) {
  let correct = 0;
  let unanswered = 0;

  questions.forEach((question) => {
    const answer = answers[question.id];

    if (!answer) {
      unanswered += 1;
    } else if (answer === question.correctAnswer) {
      correct += 1;
    }
  });

  const total = questions.length;
  const wrong = total - correct - unanswered;
  const score = total ? Math.round((correct / total) * 100) : 0;

  return {
    total,
    correct,
    wrong,
    unanswered,
    score
  };
}

export function saveHistory(result) {
  const history = getHistory();

  const item = {
    id: crypto.randomUUID?.() || `${Date.now()}`,
    date: new Date().toISOString(),
    ...result
  };

  localStorage.setItem(
    "medquiz-history",
    JSON.stringify([item, ...history].slice(0, 100))
  );

  return item;
}

export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem("medquiz-history") || "[]");
  } catch {
    return [];
  }
}

export function clearHistory() {
  localStorage.removeItem("medquiz-history");
}
