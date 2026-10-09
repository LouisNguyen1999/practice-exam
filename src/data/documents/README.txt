PUT YOUR WORD FILES HERE

Example:
  acid-uric.docx
  liver-function.docx
  blood-test.docx

The app automatically imports every .docx in this folder through Vite.

IMPORTANT:
- Each question should start with a number: "1. Question text"
- Each answer should start with A/B/C/D: "A. Answer text"
- The correct answer must be formatted with green font in Microsoft Word.
- The parser supports common green values such as #008000 and #00B050.
- If your Word template uses a different green color, update GREEN_VALUES / isGreenColor
  in src/utils/docxParser.js.

The application does not upload these files anywhere. They are bundled into the frontend.
