export function shuffle(items) {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

export function createTestBatches(questionBank, count = 50) {
  const batches = [];
  for (let start = 0; start < questionBank.length; start += count) {
    batches.push(questionBank.slice(start, start + count));
  }
  return batches;
}
