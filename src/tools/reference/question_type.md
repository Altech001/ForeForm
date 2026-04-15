# Survey Question Type Patterns

## 1. Yes/No Consent Tick Box

```javascript
checkboxItem("Yes, I am willing to participate in this study and I understand the information above.")
checkboxItem("No, I do not wish to participate.")
```

---

## 2. Single-Select (Pick One) — Inline

```javascript
inlineCheckboxLine(["Male", "Female", "Prefer not to say"])
```

---

## 3. Multi-Select (Select All That Apply)

```javascript
new Paragraph({ children: [new TextRun({ text: "Select all that apply:", italics: true, size: 21, font: "Times New Roman" })] }),
inlineCheckboxLine(["Option A", "Option B", "Option C", "Other"]),
```

---

## 4. Likert Scale — Inline (simple, no table)

```javascript
// Statement then 1–5 on next line
...likertItem("The platform is easy to use.")
```

---

## 5. Likert Scale — Grid Table (preferred for 3+ items)

```javascript
likertTable([
  "Statement one.",
  "Statement two.",
  "Statement three.",
], 10080) // pass content width
```

---

## 6. Rating Scale (with labels at ends)

```javascript
new Paragraph({
  spacing: { before: 100, after: 20 },
  children: [new TextRun({ text: "How would you rate the service? (1 = Very Poor, 5 = Excellent)", size: 22, font: "Times New Roman" })]
}),
new Paragraph({
  spacing: { before: 0, after: 120 },
  children: [
    new TextRun({ text: "Very Poor  ", size: 20, font: "Times New Roman", italics: true }),
    ...[1,2,3,4,5].flatMap(n => [
      new TextRun({ text: "☐ ", size: 22, font: "Arial" }),
      new TextRun({ text: String(n) + "  ", size: 22, font: "Times New Roman" }),
    ]),
    new TextRun({ text: "  Excellent", size: 20, font: "Times New Roman", italics: true }),
  ]
}),
```

---

## 7. Dropdown (simulated in Word with underline)

Dropdowns aren't reliably cross-platform in docx. Use underlined blank instead:

```javascript
new Paragraph({
  children: [
    new TextRun({ text: "Country: ", size: 22, font: "Times New Roman" }),
    new TextRun({ text: "________________________", size: 22, font: "Times New Roman", underline: {} }),
  ]
}),
```

---

## 8. Open-Ended with Lines

```javascript
...openEndedQuestion("Q1. Describe your experience:", 3)
```

For a large text box feel, use more lines (4–6).

---

## 9. Matrix / Grid Question

Rows = sub-items, columns = scale options. Same as `likertTable()` but with custom column headers:

```javascript
function matrixTable(rowLabels, colLabels, contentWidth = 10080) {
  const colCount = colLabels.length + 1;
  const itemColW = contentWidth - (colCount - 1) * 1200;
  const colWidths = [itemColW, ...Array(colCount - 1).fill(1200)];
  // ... (build header + data rows as in likertTable)
}
```

---

## 10. Ranked Order Question

```javascript
new Paragraph({ children: [new TextRun({ text: "Rank the following from 1 (most important) to 5 (least important):", size: 22, font: "Times New Roman" })] }),
...["Speed of service", "Ease of use", "Cost", "Reliability", "Support"].map((item, i) =>
  new Paragraph({
    indent: { left: 360 },
    spacing: { before: 40, after: 40 },
    children: [
      new TextRun({ text: `Rank: ___ `, size: 22, font: "Times New Roman" }),
      new TextRun({ text: item, size: 22, font: "Times New Roman" }),
    ]
  })
),
```

---

## 11. Date / Text Fill-In

```javascript
new Paragraph({
  children: [
    new TextRun({ text: "Date of interview: ", size: 22, font: "Times New Roman" }),
    new TextRun({ text: "_____ / _____ / _______", size: 22, font: "Times New Roman" }),
  ]
}),
```

---

## 12. Section Progress Indicator (Optional)

```javascript
function progressHint(current, total) {
  return new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { before: 0, after: 80 },
    children: [new TextRun({ text: `Section ${current} of ${total}`, size: 18, font: "Arial", color: "999999", italics: true })]
  });
}
```