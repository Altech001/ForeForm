# Academic & Institutional Color Palettes for Survey Documents

Pick a palette based on institution type or branding. Apply to section headings, table headers, and accent borders.

---

## 1. Classic Academic Blue (default — safe choice)

| Role | Hex | Use |
|---|---|---|
| Primary heading | `1F4E79` | Section title text, title block |
| Accent / rule | `2E74B5` | Border-bottom on headings, table header bg |
| Table header fill | `BDD7EE` | Likert table header row |
| Row alt fill | `DEEAF1` | Even rows in tables |
| Callout box fill | `EBF3FB` | Instruction highlight boxes |

---

## 2. Government / Institutional Green

| Role | Hex |
|---|---|
| Primary heading | `1A5632` |
| Accent | `28704A` |
| Table header fill | `C6EFCE` |
| Row alt fill | `E2F0D9` |
| Callout box fill | `F0FFF4` |

---

## 3. Warm Professional (NGO / health sector)

| Role | Hex |
|---|---|
| Primary heading | `7B3F00` |
| Accent | `C0392B` |
| Table header fill | `FADBD8` |
| Row alt fill | `FDF2F0` |
| Callout box fill | `FEF9E7` |

---

## 4. Minimal / Clean (modern, print-friendly)

| Role | Hex |
|---|---|
| Primary heading | `1C1C1C` |
| Accent | `555555` |
| Table header fill | `E8E8E8` |
| Row alt fill | `F5F5F5` |
| Callout box fill | `FAFAFA` |

---

## Usage in Code

```javascript
const palette = {
  heading:     "1F4E79",
  accent:      "2E74B5",
  tableHeader: "BDD7EE",
  rowAlt:      "DEEAF1",
  callout:     "EBF3FB",
};

// In sectionHeading():
border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: palette.accent } }
children: [new TextRun({ text, color: palette.heading, bold: true, size: 24, font: "Arial" })]

// In likertTable() header row:
shading: { fill: palette.tableHeader, type: ShadingType.CLEAR }

// Alternating rows:
fill: si % 2 === 0 ? "FFFFFF" : palette.rowAlt
```