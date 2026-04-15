---
name: fillable-survey-docx
description: >
  Use this skill to create professional academic or institutional survey/questionnaire Word documents (.docx).
  Trigger whenever the user wants to: generate a research questionnaire, survey form, or data-collection instrument
  as a Word/docx file; reproduce or improve an existing survey document; create forms with Likert scales, checkboxes,
  demographic sections, consent blocks, rating grids, or open-ended question lines. Also trigger when the user says
  "make a survey", "create a questionnaire", "build a research form", "generate a fillable Word form", or uploads a
  survey and says "make something like this" or "make it better". Always use this skill for any task that produces a
  structured data-collection document in .docx format — even if the user calls it a "form", "instrument", "template",
  or "data sheet".
---

# Fillable Survey / Questionnaire DOCX Skill

Generate polished, print-ready academic and institutional survey questionnaires as `.docx` files using `docx` (npm).

---

## Overview of Output

A professional survey document typically contains:

| Element | Notes |
|---|---|
| Header / logo area | Institution logo + study title |
| Consent block | Voluntary participation, confidentiality, tick-box |
| Demographic section | Gender, age, education, occupation — checkbox options |
| Rated sections (Likert) | 1–5 checkbox scale per statement |
| Multi-select sections | "Select all that apply" checkbox groups |
| Open-ended lines | Blank lines for free-text answers |
| Footer / closing | Thank-you note, researcher contact |

---

## Setup

```bash
npm install -g docx
node survey.js
```

---

## Core Imports

```javascript
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign,
  LevelFormat, HeadingLevel, PageNumber, PageBreak, Header, Footer,
  TabStopType, TabStopPosition
} = require('docx');
const fs = require('fs');
```

---

## Page Setup

Always use US Letter with 1-inch margins (or A4 for non-US institutions):

```javascript
sections: [{
  properties: {
    page: {
      size: { width: 12240, height: 15840 },        // US Letter
      margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } // 0.75" margins
    }
  },
  children: [ /* all content */ ]
}]
```

Content width at 0.75" margins: **10080 DXA** (12240 − 2×1080).

---

## Building Blocks

### 1. Section Heading

```javascript
function sectionHeading(text, color = "1F4E79") {
  return new Paragraph({
    spacing: { before: 240, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color, space: 4 } },
    children: [
      new TextRun({ text, bold: true, size: 24, color, font: "Arial" })
    ]
  });
}
```

### 2. Sub-heading / Part Label

```javascript
function partHeading(text) {
  return new Paragraph({
    spacing: { before: 160, after: 60 },
    children: [new TextRun({ text, bold: true, size: 22, color: "2E74B5", font: "Arial" })]
  });
}
```

### 3. Body Paragraph (instructions, intro text)

```javascript
function bodyPara(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, size: 22, font: "Times New Roman", ...opts })]
  });
}
```

### 4. Checkbox Row (single or multiple inline options)

Use a table with one row per question / option group. The checkbox `☐` character (U+2610) renders universally in Word.

```javascript
// Single checkbox option (e.g. consent tick box)
function checkboxItem(label, indent = 360) {
  return new Paragraph({
    indent: { left: indent },
    spacing: { before: 40, after: 40 },
    children: [
      new TextRun({ text: "☐  ", size: 22, font: "Arial" }),
      new TextRun({ text: label, size: 22, font: "Times New Roman" })
    ]
  });
}

// Inline checkbox options on one line (e.g. "☐ Male  ☐ Female  ☐ Prefer not to say")
function inlineCheckboxLine(options, label = null) {
  const runs = [];
  if (label) runs.push(new TextRun({ text: label + "   ", size: 22, font: "Times New Roman" }));
  options.forEach((opt, i) => {
    runs.push(new TextRun({ text: "☐ " + opt + (i < options.length - 1 ? "     " : ""), size: 22, font: "Arial" }));
  });
  return new Paragraph({ spacing: { before: 40, after: 80 }, children: runs });
}
```

### 5. Likert Scale Row (statement + 1–5 checkboxes)

Each Likert item = a two-row mini-table: statement on top, scale boxes below. Or use inline checkboxes:

```javascript
function likertItem(statement) {
  return [
    new Paragraph({
      spacing: { before: 100, after: 20 },
      children: [new TextRun({ text: statement, size: 22, font: "Times New Roman" })]
    }),
    new Paragraph({
      spacing: { before: 0, after: 120 },
      children: [1, 2, 3, 4, 5].flatMap(n => [
        new TextRun({ text: "☐ ", size: 22, font: "Arial" }),
        new TextRun({ text: String(n) + "     ", size: 22, font: "Times New Roman" })
      ])
    })
  ];
}
```

### 6. Likert Scale TABLE (grid format — more compact and professional)

Use a table when you want the scale header to be shared across multiple statements:

```javascript
function likertTable(statements, contentWidth = 10080) {
  const scaleLabels = ["", "1\nStrongly\nDisagree", "2\nDisagree", "3\nNeutral", "4\nAgree", "5\nStrongly\nAgree"];
  const colWidths = [contentWidth - 5 * 1100, 1100, 1100, 1100, 1100, 1100]; // 5 scale cols of 1100 DXA

  const headerRow = new TableRow({
    tableHeader: true,
    children: scaleLabels.map((lbl, i) => new TableCell({
      width: { size: colWidths[i], type: WidthType.DXA },
      shading: { fill: "BDD7EE", type: ShadingType.CLEAR },
      margins: { top: 60, bottom: 60, left: 80, right: 80 },
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: lbl, bold: true, size: 18, font: "Arial" })]
      })]
    }))
  });

  const dataRows = statements.map((stmt, si) => new TableRow({
    children: [
      new TableCell({
        width: { size: colWidths[0], type: WidthType.DXA },
        shading: { fill: si % 2 === 0 ? "FFFFFF" : "F2F2F2", type: ShadingType.CLEAR },
        margins: { top: 60, bottom: 60, left: 120, right: 80 },
        children: [new Paragraph({ children: [new TextRun({ text: stmt, size: 21, font: "Times New Roman" })] })]
      }),
      ...[1,2,3,4,5].map((_, ci) => new TableCell({
        width: { size: colWidths[ci + 1], type: WidthType.DXA },
        shading: { fill: si % 2 === 0 ? "FFFFFF" : "F2F2F2", type: ShadingType.CLEAR },
        margins: { top: 60, bottom: 60, left: 80, right: 80 },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "☐", size: 22, font: "Arial" })]
        })]
      }))
    ]
  }));

  return new Table({
    width: { size: contentWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows]
  });
}
```

### 7. Open-Ended Question with Answer Lines

```javascript
function openEndedQuestion(label, lines = 3) {
  const lineChar = "_".repeat(120);
  return [
    new Paragraph({
      spacing: { before: 120, after: 40 },
      children: [new TextRun({ text: label, bold: true, size: 22, font: "Times New Roman" })]
    }),
    ...Array(lines).fill(null).map(() =>
      new Paragraph({
        spacing: { before: 20, after: 20 },
        children: [new TextRun({ text: lineChar, size: 22, font: "Times New Roman", color: "AAAAAA" })]
      })
    )
  ];
}
```

### 8. Numbered Question Label

```javascript
function questionLabel(num, text) {
  return new Paragraph({
    spacing: { before: 100, after: 40 },
    children: [
      new TextRun({ text: `${num}. `, bold: true, size: 22, font: "Times New Roman" }),
      new TextRun({ text, size: 22, font: "Times New Roman" })
    ]
  });
}
```

---

## Document Structure Template

```javascript
const children = [
  // === TITLE BLOCK ===
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 60 },
    children: [new TextRun({ text: "STUDY TITLE HERE", bold: true, size: 32, font: "Arial", color: "1F4E79" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 240 },
    children: [new TextRun({ text: "Subtitle or institution name", size: 24, font: "Times New Roman", italics: true })] }),

  // === APPENDIX / FORM LABEL ===
  new Paragraph({ spacing: { before: 0, after: 40 },
    children: [new TextRun({ text: "APPENDIX A: RESEARCH QUESTIONNAIRE", bold: true, size: 22, font: "Arial" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 40, after: 240 },
    children: [new TextRun({ text: "QUESTIONNAIRE FOR [TARGET GROUP]", bold: true, size: 24, font: "Arial", color: "1F4E79" })] }),

  // === CONSENT SECTION ===
  sectionHeading("CONSENT TO PARTICIPATE"),
  bodyPara("Dear Respondent, ..."),
  checkboxItem("Yes, I am willing to participate in this study."),
  checkboxItem("No, I do not wish to participate."),

  // === SECTION A: DEMOGRAPHICS ===
  sectionHeading("SECTION A: DEMOGRAPHIC INFORMATION"),
  questionLabel(1, "Gender:"),
  inlineCheckboxLine(["Male", "Female", "Prefer not to say"]),
  questionLabel(2, "Age group:"),
  inlineCheckboxLine(["18–25", "26–35", "36–45", "46–55", "Above 55"]),
  // ... more demographic questions ...

  // === SECTION B: LIKERT SCALE (Grid style) ===
  sectionHeading("SECTION B: PLATFORM QUALITY"),
  bodyPara("Please rate each statement on a scale of 1 to 5, where 1 = Strongly Disagree and 5 = Strongly Agree."),
  partHeading("PART B1: SYSTEM QUALITY"),
  likertTable([
    "The platform is easy to navigate without technical assistance.",
    "The platform loads and responds quickly during peak usage.",
    // ... more statements
  ]),

  // === SECTION J: OPEN-ENDED ===
  sectionHeading("SECTION J: OPEN-ENDED QUESTIONS"),
  ...openEndedQuestion("J1. What specific challenges have you encountered?", 4),
  ...openEndedQuestion("J2. What is the single most important improvement?", 4),

  // === CLOSING ===
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 360, after: 120 },
    children: [new TextRun({ text: "THANK YOU FOR YOUR PARTICIPATION.", bold: true, size: 24, font: "Arial", color: "1F4E79" })] }),
  bodyPara("Your responses are greatly appreciated and will contribute to improving services.", { center: true }),
];
```

---

## Enhancements Over a Basic Survey

To produce a document that is *better* than the reference:

| Enhancement | How |
|---|---|
| Grid Likert tables | Use `likertTable()` with shared header row — more compact and scannable |
| Alternating row shading | `fill: si % 2 === 0 ? "FFFFFF" : "F2F2F2"` in table rows |
| Section color rules | `border.bottom` on section headings with brand color |
| Consistent spacing | Use `spacing: { before, after }` on every paragraph — no double-blank lines |
| Page numbers | Footer with `PageNumber.CURRENT` and `PageNumber.TOTAL_PAGES` |
| Progress hint | Small italic note at start of each section: "Section X of Y" |
| Instruction callout box | Shaded `Table` with 1 row/1 cell as a highlighted instruction box |

---

## Adding a Header / Footer

```javascript
const doc = new Document({
  sections: [{
    headers: {
      default: new Header({
        children: [new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "2E74B5" } },
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Study Title — Confidential Research Instrument", size: 18, font: "Arial", color: "666666" })]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Page ", size: 18 }),
            new TextRun({ children: [PageNumber.CURRENT], size: 18 }),
            new TextRun({ text: " of ", size: 18 }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18 }),
          ]
        })]
      })
    },
    children
  }]
});
```

---

## Instruction Callout Box

Use a 1-cell shaded table to highlight an instruction block (like the intro note on scale meaning):

```javascript
function calloutBox(text, fill = "DEEAF1") {
  return new Table({
    width: { size: 10080, type: WidthType.DXA },
    columnWidths: [10080],
    rows: [new TableRow({
      children: [new TableCell({
        shading: { fill, type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 200, right: 200 },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: "2E74B5" },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: "2E74B5" },
          left: { style: BorderStyle.SINGLE, size: 12, color: "2E74B5" },
          right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        },
        children: [new Paragraph({ children: [new TextRun({ text, size: 21, font: "Times New Roman", italics: true })] })]
      })]
    })]
  });
}
```

---

## Validation & Output

```bash
# Validate after generation
python scripts/office/validate.py output_survey.docx

# Copy to outputs
cp output_survey.docx /mnt/user-data/outputs/survey.docx
```

---

## Critical Rules

- **Never use `\n`** — always separate paragraphs with `new Paragraph()`
- **Never use unicode bullets** — use `LevelFormat.BULLET` with numbering config if needed
- **Checkbox char**: use `☐` (U+2610) directly in TextRun — renders correctly in Word
- **Always use `WidthType.DXA`** — never `WidthType.PERCENTAGE` (breaks in Google Docs)
- **Tables need dual widths**: set `columnWidths` array AND `width` on each `TableCell`
- **Use `ShadingType.CLEAR`** — never `SOLID` for table cell backgrounds
- **Justify body text**: `AlignmentType.JUSTIFIED` for paragraph text blocks
- **Times New Roman for body**, **Arial for headings/labels** — matches academic document conventions
- **Spacing discipline**: use `spacing: { before, after }` — never add blank `Paragraph` spacers
- **Page size must be explicit** — docx-js defaults to A4; set US Letter or A4 based on institution country

---

## Reference Files

- See `references/question-types.md` for patterns for all common survey question types
- See `references/academic-color-palettes.md` for branded color schemes for different institution types