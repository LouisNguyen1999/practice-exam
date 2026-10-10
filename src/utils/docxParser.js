import JSZip from "jszip";

const OPTION_RE = /^\s*([A-D])\s*[.、)）\]:]\s*(.+)$/i;
const NUMBERED_QUESTION_RE = /^\s*(\d+)\s*[.、)）:-]\s*(.+)$/;
const LABELED_QUESTION_RE = /^\s*C[âậ]u\s*(\d+)\s*[:.)-]\s*(.*)$/i;
const GREEN_VALUES = new Set(["008000", "00b050", "00ff00", "009900", "00aa00", "00cc00"]);
const ANSWER_COLORS = new Set(["ff0000", "0000ff", "0a22b6", "1d41d5"]);

export async function parseDocx(url, fileName = "document.docx") {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Cannot read ${fileName}: HTTP ${response.status}`);

  const zip = await JSZip.loadAsync(await response.arrayBuffer());
  const documentFile = zip.file("word/document.xml");
  if (!documentFile) throw new Error(`${fileName} does not contain word/document.xml`);

  const xml = new DOMParser().parseFromString(await documentFile.async("text"), "application/xml");
  const imageUrls = await extractImageUrls(zip);
  const body = xml.getElementsByTagName("w:body")[0];
  const items = [...(body?.children || [])]
    .filter((element) => element.tagName === "w:p" || element.tagName === "w:tbl")
    .map((element) => element.tagName === "w:tbl"
      ? { type: "table", table: parseTable(element, imageUrls) }
      : { type: "paragraph", paragraph: parseParagraph(element, imageUrls) })
    .filter((item) => item.type === "table" || item.paragraph.text || item.paragraph.images.length);
  const paragraphs = items
    .filter((item) => item.type === "paragraph")
    .map((item) => item.paragraph);

  const visibleQuestionCount = paragraphs.filter((paragraph) => getVisibleQuestionHeading(paragraph)).length;
  const listQuestionCount = paragraphs.filter((paragraph) => (
    paragraph.numbering?.numId === "11" && paragraph.numbering.level === "0"
  )).length;
  const questions = visibleQuestionCount >= 30
    ? parseQuestionSections(items, fileName, false)
    : listQuestionCount >= 30
      ? parseQuestionSections(items, fileName, true)
    : paragraphs.some((paragraph) => OPTION_RE.test(paragraph.text))
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
    const combinedOptions = splitInlineOptions(paragraph, false, true);
    const foundOptions = combinedOptions.length >= 2
      ? combinedOptions
      : optionMatch
        ? [{ id: optionMatch[1].toUpperCase(), text: optionMatch[2].trim(), correct: paragraph.hasAnswerMark }]
        : [];

    if (foundOptions.length) {
      if (!current || current.options.length === 0) {
        const text = current
          ? [current.question, ...pending.map((item) => item.text)].filter(Boolean).join(" ")
          : pending.map((item) => item.text).filter(Boolean).join(" ");
        const labeled = text.match(LABELED_QUESTION_RE);
        const numbered = text.match(NUMBERED_QUESTION_RE);
        current = {
          number: labeled ? Number(labeled[1]) : numbered ? Number(numbered[1]) : questions.length + 1,
          question: (labeled?.[2] || numbered?.[2] || text).trim(),
          options: []
        };
      }
      pending = [];
      current.options.push(...foundOptions);
      continue;
    }

    if (current?.options.length >= 2) finish();
    pending.push(paragraph);
  }

  finish();
  return questions;
}

function parseUnlabeledQuestions(paragraphs, fileName) {
  return parseQuestionSections(paragraphs.map((paragraph) => ({ type: "paragraph", paragraph })), fileName, false);
}

function parseQuestionSections(items, fileName, useListQuestionMarkers) {
  const questions = [];
  let current = null;

  for (const item of items) {
    if (item.type !== "paragraph") {
      if (current) current.items.push(item);
      continue;
    }
    const paragraph = item.paragraph;
    const heading = getVisibleQuestionHeading(paragraph) || (
      useListQuestionMarkers && paragraph.numbering?.numId === "11" && paragraph.numbering.level === "0"
        ? { question: paragraph.text.trim() }
        : null
    );
    if (heading) {
      if (current) finishSection(current, questions, fileName);
      current = {
        number: heading.number ?? questions.length + 1,
        question: heading.question,
        headingParagraph: paragraph,
        items: []
      };
    } else if (current) {
      current.items.push(item);
    }
  }

  if (current) finishSection(current, questions, fileName);
  return questions;
}

function getVisibleQuestionHeading(paragraph) {
  const labeled = paragraph.text.match(LABELED_QUESTION_RE);
  if (labeled) return { number: Number(labeled[1]), question: labeled[2].trim() };

  // A few questions in QTKT.350 have a missing/incorrect "Câu" prefix.
  const bareNumber = paragraph.text.match(/^\s*(\d+)\s*:\s+(.+)$/);
  if (bareNumber) return { number: Number(bareNumber[1]), question: bareNumber[2].trim() };

  return null;
}

function finishSection(section, questions, fileName) {
  const choices = extractSectionChoices(section.items
    .filter((item) => item.type === "paragraph")
    .map((item) => item.paragraph));
  const firstChoice = choices[0]?.paragraph;
  const questionItems = firstChoice
    ? section.items.slice(0, section.items.findIndex((item) => item.type === "paragraph" && item.paragraph === firstChoice))
    : section.items;
  const questionParts = [section.question, ...questionItems.map(getItemText)].filter(Boolean);
  const richContent = questionItems.some((item) => item.type === "table" || item.paragraph.images.length)
    ? [
        { type: "paragraph", text: section.question, images: section.headingParagraph.images },
        ...questionItems.map((item) => item.type === "table"
          ? item.table
          : { type: "paragraph", text: item.paragraph.text, images: item.paragraph.images })
      ]
    : undefined;
  addQuestion({
    ...section,
    question: normalizeWhitespace(questionParts.join(" ")),
    richContent,
    options: choices.map(({ paragraph, ...choice }) => choice)
  }, questions, fileName);
}

function getItemText(item) {
  if (item.type === "paragraph") return item.paragraph.text;
  return item.table.rows.map((row) => row.map((cell) => cell.text).join(" | ")).join(" ");
}

function extractSectionChoices(paragraphs) {
  const usable = paragraphs.filter((paragraph) => !/^窗体(顶端|底端)$/.test(paragraph.text));

  // Some Word files put all A/B/C/D answers in one paragraph without line breaks.
  for (const paragraph of usable) {
    const inlineOptions = splitInlineOptions(paragraph);
    if (inlineOptions.length >= 2) {
      return inlineOptions.map((option) => ({ ...option, paragraph }));
    }
  }

  const groups = [];
  for (const paragraph of usable) {
    const id = paragraph.numbering?.numId;
    if (!id) continue;
    let group = groups.at(-1);
    if (!group || group.numId !== id) {
      group = { numId: id, paragraphs: [] };
      groups.push(group);
    }
    group.paragraphs.push(paragraph);
  }

  const candidate = groups
    .filter((group) => group.paragraphs.length >= 2)
    .sort((a, b) => {
      const aExact = a.paragraphs.length === 4 ? 1 : 0;
      const bExact = b.paragraphs.length === 4 ? 1 : 0;
      return bExact - aExact || Math.min(b.paragraphs.length, 4) - Math.min(a.paragraphs.length, 4);
    })[0];

  if (candidate) {
    return candidate.paragraphs.slice(0, 4).map((paragraph, index) => ({
      id: String.fromCharCode(65 + index),
      text: paragraph.text,
      images: paragraph.images,
      correct: paragraph.hasAnswerMark,
      paragraph
    }));
  }

  const fallback = usable.slice(0, 4);
  return fallback.map((paragraph, index) => ({
    id: String.fromCharCode(65 + index),
    text: paragraph.text,
    images: paragraph.images,
    correct: paragraph.hasAnswerMark,
    paragraph
  }));
}

function splitInlineOptions(paragraph, inferLeadingA = true, strictBoundary = false) {
  // The document has several places where list labels are concatenated to the
  // previous option (for example "FibrinogenC."). Uppercase labels avoid
  // mistaking Vietnamese words ending in "c." for the option C.
  const marker = strictBoundary
    ? /(?:^|[\s.])([A-D])\s*[.、)）:]\s*/g
    : /([A-D])\s*[.、)）:]\s*/g;
  const sourceText = paragraph.rawText || paragraph.text;
  const matches = [...sourceText.matchAll(marker)];
  if (matches.length < 2) return [];
  const ids = matches.map((match) => match[1].toUpperCase());
  if (ids.some((id, index) => index > 0 && id <= ids[index - 1])) return [];

  const options = matches.map((match, index) => {
    const textStart = match.index + match[0].length;
    const textEnd = matches[index + 1]?.index ?? sourceText.length;
    return {
      id: match[1].toUpperCase(),
      text: normalizeWhitespace(sourceText.slice(textStart, textEnd)),
      correct: paragraphRangeHasAnswer(paragraph, textStart, textEnd)
    };
  }).filter((option) => option.text);

  if (inferLeadingA && ids.join("") === "BCD") {
    options.unshift({
      id: "A",
      text: normalizeWhitespace(sourceText.slice(0, matches[0].index)),
      correct: paragraphRangeHasAnswer(paragraph, 0, matches[0].index)
    });
  }
  return options;
}

function addQuestion(current, questions, fileName) {
  if (!current.question.trim() || current.options.length < 1) return;
  const correct = current.options.filter((option) => option.correct);
  const baseId = `${slugify(fileName)}-${current.number}`;
  const duplicateCount = questions.filter((question) => question.id === baseId).length;
  questions.push({
    id: duplicateCount ? `${baseId}-${duplicateCount + 1}` : baseId,
    source: fileName,
    category: humanizeFileName(fileName),
    number: current.number,
    question: current.question.trim(),
    ...(current.richContent ? { richContent: current.richContent } : {}),
    options: current.options.map(({ correct: _correct, ...option }) => option),
    correctAnswer: correct.length === 1 ? correct[0].id : null
  });
}

async function extractImageUrls(zip) {
  const relationshipsFile = zip.file("word/_rels/document.xml.rels");
  if (!relationshipsFile) return new Map();

  const relationshipsXml = new DOMParser().parseFromString(
    await relationshipsFile.async("text"),
    "application/xml"
  );
  const urlsById = new Map();
  const urlsByTarget = new Map();

  for (const relationship of relationshipsXml.getElementsByTagName("Relationship")) {
    const id = relationship.getAttribute("Id");
    const target = relationship.getAttribute("Target");
    if (!id || !target || !relationship.getAttribute("Type")?.endsWith("/image") ||
      relationship.getAttribute("TargetMode") === "External") continue;

    const path = resolveDocumentTarget(target);
    let url = urlsByTarget.get(path);
    if (!url) {
      const imageFile = zip.file(path);
      if (!imageFile) continue;
      const extension = path.split(".").at(-1).toLowerCase();
      const mimeType = ({
        bmp: "image/bmp",
        gif: "image/gif",
        jpeg: "image/jpeg",
        jpg: "image/jpeg",
        png: "image/png",
        svg: "image/svg+xml",
        tif: "image/tiff",
        tiff: "image/tiff",
        webp: "image/webp"
      })[extension] || "application/octet-stream";
      url = `data:${mimeType};base64,${await imageFile.async("base64")}`;
      urlsByTarget.set(path, url);
    }
    urlsById.set(id, url);
  }

  return urlsById;
}

function resolveDocumentTarget(target) {
  const parts = target.startsWith("/") ? [] : ["word"];
  for (const part of target.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(part);
  }
  return parts.join("/");
}

function parseTable(table, imageUrls) {
  const rows = [...table.children]
    .filter((element) => element.tagName === "w:tr")
    .map((row) => [...row.children]
      .filter((element) => element.tagName === "w:tc")
      .map((cell) => {
        const paragraphs = [...cell.children]
          .filter((element) => element.tagName === "w:p")
          .map((paragraph) => parseParagraph(paragraph, imageUrls));
        return {
          text: normalizeWhitespace(paragraphs.map((paragraph) => paragraph.text).filter(Boolean).join(" ")),
          images: paragraphs.flatMap((paragraph) => paragraph.images)
        };
      }));

  return { type: "table", rows };
}

function parseParagraph(paragraph, imageUrls = new Map()) {
  const runs = [...paragraph.getElementsByTagName("w:r")];
  let text = "";
  let hasAnswerMark = false;
  const markedRanges = [];

  for (const run of runs) {
    const runText = [...run.getElementsByTagName("w:t")].map((node) => node.textContent || "").join("");
    const properties = run.getElementsByTagName("w:rPr")[0];
    const color = properties?.getElementsByTagName("w:color")[0]?.getAttribute("w:val")?.toLowerCase();
    const highlight = properties?.getElementsByTagName("w:highlight")[0]?.getAttribute("w:val")?.toLowerCase();
    const marked = isAnswerColor(color) || highlight === "yellow";
    const start = text.length;
    text += runText;
    if (marked) {
      hasAnswerMark = true;
      markedRanges.push({ start, end: text.length });
    }
  }

  const imageIds = [
    ...[...paragraph.getElementsByTagName("a:blip")].map((node) => node.getAttribute("r:embed")),
    ...[...paragraph.getElementsByTagName("v:imagedata")].map((node) => node.getAttribute("r:id"))
  ].filter(Boolean);
  const numbering = paragraph.getElementsByTagName("w:numId")[0];
  const level = paragraph.getElementsByTagName("w:ilvl")[0];
  return {
    text: normalizeWhitespace(text),
    rawText: text,
    images: imageIds.map((id) => imageUrls.get(id)).filter(Boolean),
    hasAnswerMark,
    markedRanges,
    numbering: numbering ? {
      numId: numbering.getAttribute("w:val"),
      level: level?.getAttribute("w:val") || "0"
    } : null
  };
}

function paragraphRangeHasAnswer(paragraph, start, end) {
  if (!paragraph.markedRanges?.length) return paragraph.hasAnswerMark;
  return paragraph.markedRanges.some((range) => range.start < end && range.end > start);
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
