# MedQuiz Practice

A React/Vite offline question-practice application.

## Features

- Import every `.docx` under `src/data/documents/`
- Detect the correct answer from green text in Word
- Combine all documents into one question bank
- Random 50-question tests
- Question navigator
- Instant result and answer review
- One-question-at-a-time practice mode
- Search/filter question bank
- Local test history using `localStorage`
- Current test recovery using `sessionStorage`
- Responsive desktop/mobile UI
- No backend and no API

## 1. Install

```bash
npm install
```

## 2. Add Word files

Copy your files into:

```text
src/data/documents/
```

Example:

```text
src/data/documents/
├── acid-uric.docx
├── liver-function.docx
└── blood-test.docx
```

## 3. Start

```bash
npm run dev
```

Open the URL shown by Vite.

## 4. Build

```bash
npm run build
npm run preview
```

## DOCX format expected

```text
1. Question text

A. Answer A
B. Answer B
C. Answer C
D. Answer D
```

The correct answer must have green font in Word.

The parser reads:

```text
word/document.xml
```

inside the DOCX ZIP and checks `w:color`.

## Important note about Word colors

If your Word files use a custom green, inspect the XML value and add it to:

```text
src/utils/docxParser.js
```

The parser already recognizes several common green colors.

## Data architecture

```text
DOCX
  ↓
docxParser.js
  ↓
Question[]
  ↓
questionBank.js
  ↓
React pages
  ├── Home
  ├── Test
  ├── Result
  ├── Practice
  ├── QuestionBank
  └── History
```

Question object:

```js
{
  id: "acid-uric-1",
  source: "acid-uric.docx",
  category: "Acid Uric",
  number: 1,
  question: "...",
  options: [
    { id: "A", text: "..." },
    { id: "B", text: "..." },
    { id: "C", text: "..." },
    { id: "D", text: "..." }
  ],
  correctAnswer: "A"
}
```

## No API

All data remains in the frontend:

- DOCX files are bundled by Vite.
- Tests are generated in browser memory.
- History is stored in browser `localStorage`.
- Current test state is stored in `sessionStorage`.

No server is required.
