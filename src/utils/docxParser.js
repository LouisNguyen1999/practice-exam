import JSZip from "jszip";

const OPTION_RE = /^\s*([A-D])\s*[.、)）\]:-]\s*(.+)$/i;
const NUMBERED_QUESTION_RE = /^\s*(\d+)\s*[.、)）:-]\s*(.+)$/;
const LABELED_QUESTION_RE = /^\s*Câu\s+(\d+)\s*[:.)-]\s*(.*)$/i;
const GREEN_VALUES = new Set(["008000", "00b050", "00ff00", "009900", "00aa00", "00cc00"]);
const ANSWER_COLORS = new Set(["ff0000", "0000ff", "0a22b6", "1d41d5"]);

export async function parseDocx(url, fileName = "document.docx") {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Cannot read ${fileName}: HTTP ${response.status}`);

  const zip = await JSZip.loadAsync(await response.arrayBuffer());
  const documentFile = zip.file("word/document.xml");
  if (!documentFile) throw new Error(`${fileName} does not contain word/document.xml`);

  const xml = new DOMParser().parseFromString(await documentFile.async("text"), "application/xml");
  const paragraphs = [...xml.getElementsByTagName("w:p")]
    .map(parseParagraph)
    .filter((paragraph) => paragraph.text);

  const labeledOptions = paragraphs.some((paragraph) => OPTION_RE.test(paragraph.text));
  const questions = labeledOptions
    ? parseLabeledQuestions(paragraphs, fileName)
    : parseUnlabeledQuestions(paragraphs, fileName);

  return { questions, warnings: [] };
}

function parseLabeledQuestions(paragraphs, fileName) {
  const questions = [];
  let pending = [];
  let current = null;

  const finish = () => {
    if (current) addQuestion(current, questions, fileName);
    current = null;
  };

  for (const paragraph of paragraphs) {
    const optionMatch = paragraph.text.match(OPTION_RE);
    if (optionMatch) {
      if (!current || current.options.length === 0) {
        const text = current
          ? [current.question, ...pending.map((item) => item.text)].filter(Boolean).join(" ")
          : pending.at(-1)?.text || "";
        const labeled = text.match(LABELED_QUESTION_RE);
        const numbered = text.match(NUMBERED_QUESTION_RE);
        current = {
          number: labeled ? Number(labeled[1]) : numbered ? Number(numbered[1]) : questions.length + 1,
          question: (labeled?.[2] || numbered?.[2] || text).trim(),
          options: []
        };
      }
      pending = [];
      current.options.push({
        id: optionMatch[1].toUpperCase(),
        text: optionMatch[2].trim(),
        correct: paragraph.hasAnswerMark
      });
      continue;
    }

    if (current?.options.length >= 2) finish();
    pending.push(paragraph);
  }

  finish();
  return questions;
}

function parseUnlabeledQuestions(paragraphs, fileName) {
  const questions = [];
  let current = null;

  for (const paragraph of paragraphs) {
    const labeled = paragraph.text.match(LABELED_QUESTION_RE);
    if (labeled) {
      if (current) addQuestion(current, questions, fileName);
      current = { number: Number(labeled[1]), question: labeled[2].trim(), options: [] };
      continue;
    }

    if (!current && (paragraph.text.includes("?") || paragraph.text.endsWith(":"))) {
      current = { number: questions.length + 1, question: paragraph.text, options: [] };
      continue;
    }

    if (current && current.options.length < 4) {
      current.options.push({
        id: String.fromCharCode(65 + current.options.length),
        text: paragraph.text,
        correct: paragraph.hasAnswerMark
      });
      if (current.options.length === 4) {
        addQuestion(current, questions, fileName);
        current = null;
      }
    } else if (current) {
      current.question = `${current.question} ${paragraph.text}`.trim();
    }
  }

  if (current) addQuestion(current, questions, fileName);
  return questions;
}

function addQuestion(current, questions, fileName) {
  if (!current.question.trim() || current.options.length < 2) return;
  const correct = current.options.filter((option) => option.correct);
  questions.push({
    id: `${slugify(fileName)}-${current.number}`,
    source: fileName,
    category: humanizeFileName(fileName),
    number: current.number,
    question: current.question.trim(),
    options: current.options.map(({ correct: _correct, ...option }) => option),
    correctAnswer: correct.length === 1 ? correct[0].id : null
  });
}

function parseParagraph(paragraph) {
  const runs = [...paragraph.getElementsByTagName("w:r")];
  let text = "";
  let hasAnswerMark = false;

  for (const run of runs) {
    text += [...run.getElementsByTagName("w:t")].map((node) => node.textContent || "").join("");
    const properties = run.getElementsByTagName("w:rPr")[0];
    if (!properties) continue;
    const color = properties.getElementsByTagName("w:color")[0]?.getAttribute("w:val")?.toLowerCase();
    const highlight = properties.getElementsByTagName("w:highlight")[0]?.getAttribute("w:val")?.toLowerCase();
    if (isAnswerColor(color) || highlight === "yellow") hasAnswerMark = true;
  }

  return { text: normalizeWhitespace(text), hasAnswerMark };
}

function isAnswerColor(value = "") {
  const normalized = value.replace(/^#/, "").toLowerCase();
  if (GREEN_VALUES.has(normalized) || ANSWER_COLORS.has(normalized)) return true;
  const rgb = normalized.slice(0, 6);
  if (!/^[0-9a-f]{6}$/.test(rgb)) return false;
  const r = parseInt(rgb.slice(0, 2), 16);
  const g = parseInt(rgb.slice(2, 4), 16);
  const b = parseInt(rgb.slice(4, 6), 16);
  return g > r * 1.35 && g > b * 1.2 && g >= 80;
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function humanizeFileName(name) {
  return name.replace(/\.docx$/i, "").replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function slugify(value) {
  return String(value).toLowerCase().replace(/\.docx$/i, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
