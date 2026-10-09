import { parseDocx } from "../utils/docxParser";

// Vite imports every DOCX under this folder as an asset URL.
// Example:
// src/data/documents/acid-uric.docx
const documentModules = import.meta.glob(
  "./documents/**/*.{docx,DOCX}",
  {
    query: "?url",
    import: "default",
    eager: true
  }
);

const sampleQuestions = [
  {
    id: "sample-acid-uric-001",
    source: "sample-acid-uric",
    category: "Acid Uric",
    question: "EDTA được dùng làm chất chống đông cho mẫu định lượng Acid Uric. Nhận định và hướng xử trí phù hợp là gì?",
    options: [
      { id: "A", text: "EDTA làm giảm kết quả khoảng 7%; yêu cầu lấy lại mẫu." },
      { id: "B", text: "EDTA làm tăng kết quả khoảng 7%; trừ 7% trên kết quả máy." },
      { id: "C", text: "EDTA gây ảnh hưởng không rõ; pha loãng bệnh phẩm." },
      { id: "D", text: "EDTA gây can thiệp màu; ly tâm lại ở nhiệt độ phòng." }
    ],
    correctAnswer: "A"
  },
  {
    id: "sample-acid-uric-002",
    source: "sample-acid-uric",
    category: "Acid Uric",
    question: "Mẫu huyết thanh được bảo quản đông ở -20°C trong 3 tháng. Trước khi phân tích cần chuẩn bị thế nào?",
    options: [
      { id: "A", text: "Rã đông ở nhiệt độ phòng, lắc đều và chỉ rã đông một lần." },
      { id: "B", text: "Rã đông 2–8°C trong 5 ngày rồi lắc siêu âm." },
      { id: "C", text: "Đưa ngay mẫu lạnh vào máy và có thể rã đông lặp lại." },
      { id: "D", text: "Rã đông 37°C và bổ sung Heparin." }
    ],
    correctAnswer: "A"
  },
  {
    id: "sample-acid-uric-003",
    source: "sample-acid-uric",
    category: "Acid Uric",
    question: "Trong phương pháp enzyme so màu định lượng Acid Uric, hợp chất màu đỏ được đo ở bước sóng nào?",
    options: [
      { id: "A", text: "546 nm" },
      { id: "B", text: "202 nm" },
      { id: "C", text: "399 nm" },
      { id: "D", text: "620 nm" }
    ],
    correctAnswer: "A"
  }
];

export async function loadQuestionBank() {
  const entries = Object.entries(documentModules);

  if (entries.length === 0) {
    return {
      questions: sampleQuestions,
      sources: [{ name: "Sample question bank", count: sampleQuestions.length }]
    };
  }

  const parsed = [];
  const sourceStats = [];

  for (const [modulePath, url] of entries) {
    const fileName = modulePath.split("/").pop();
    const result = await parseDocx(url, fileName);
    parsed.push(...result.questions);
    sourceStats.push({
      name: fileName,
      count: result.questions.length,
      warnings: result.warnings
    });
  }

  // If a document was not parsed successfully, keeping the app usable is
  // better than crashing the entire question bank.
  if (parsed.length === 0) {
    return {
      questions: sampleQuestions,
      sources: [
        ...sourceStats,
        {
          name: "Sample fallback",
          count: sampleQuestions.length,
          warnings: ["No valid DOCX questions were detected."]
        }
      ]
    };
  }

  return {
    questions: parsed.map((q, index) => ({
      ...q,
      id: q.id || `${slugify(q.source)}-${index + 1}`
    })),
    sources: sourceStats
  };
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/\.docx$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
