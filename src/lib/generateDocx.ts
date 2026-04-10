import { format, isValid } from "date-fns";
import { getDocxTemplate } from "@/templates";

const TEMPLATE_THEME_OVERRIDES: Record<string, { headingFont?: string; bodyFont?: string; titleCase?: "upper" | "normal"; metadataStyle?: "table" | "cards"; coverMode?: "hero" | "simple"; lineColor?: string; mutedColor?: string; }> = {
  alber: {
    headingFont: "Arial",
    bodyFont: "Arial",
    titleCase: "upper",
    metadataStyle: "table",
    coverMode: "hero",
    lineColor: "1E3A8A",
    mutedColor: "475569",
  },
  ani: {
    headingFont: "Aptos",
    bodyFont: "Aptos",
    metadataStyle: "cards",
    coverMode: "hero",
    lineColor: "0891B2",
    mutedColor: "155E75",
  },
  benico: {
    headingFont: "Calibri",
    bodyFont: "Calibri",
    metadataStyle: "cards",
    coverMode: "simple",
    lineColor: "059669",
    mutedColor: "065F46",
  },
  filbert: {
    headingFont: "Georgia",
    bodyFont: "Georgia",
    metadataStyle: "table",
    coverMode: "simple",
    lineColor: "B45309",
    mutedColor: "78350F",
  },
  grac: {
    headingFont: "Georgia",
    bodyFont: "Georgia",
    metadataStyle: "table",
    coverMode: "hero",
    lineColor: "BE185D",
    mutedColor: "881337",
  },
  lil: {
    headingFont: "Calibri",
    bodyFont: "Calibri",
    metadataStyle: "cards",
    coverMode: "simple",
    lineColor: "7C3AED",
    mutedColor: "4C1D95",
  },
};

export async function generateDocxBlob(form: any, response: any) {
  const branding = form?.branding || {};
  const template = getDocxTemplate(branding.docx_template || branding.template_id || "alber");
  const templateStyle = TEMPLATE_THEME_OVERRIDES[template.id] || TEMPLATE_THEME_OVERRIDES.alber;
  const title = form?.title || "Form Response";
  const respondent = response?.respondent_name || "Anonymous";
  const email = response?.respondent_email || "N/A";

  let dateStr = "N/A";
  try {
    const d = response?.created_at || response?.created_date || new Date();
    const dateObj = new Date(d);
    if (isValid(dateObj)) {
      dateStr = format(dateObj, "MMMM d, yyyy 'at' h:mm a");
    }
  } catch {
    dateStr = "N/A";
  }

  const theme = {
    accent: toHex(template.accent),
    surface: toHex(template.surface),
    border: toHex(template.border),
    text: toHex(template.text),
    line: templateStyle.lineColor || toHex(template.accent),
    muted: templateStyle.mutedColor || "475569",
    headingFont: templateStyle.headingFont || "Arial",
    bodyFont: templateStyle.bodyFont || "Arial",
    metadataStyle: templateStyle.metadataStyle || "table",
    coverMode: templateStyle.coverMode || "simple",
    titleCase: templateStyle.titleCase || "normal",
  };

  const questions = form?.questions || [];
  const answers = response?.answers || [];

  const answersXml = buildAnswersXml({
    questions,
    answers,
    theme,
  });

  const gpsXml = buildGpsXml(response, theme);
  const signatureXml = buildSignatureXml(response, dateStr, theme);
  const coverXml = buildCoverXml({ title, branding, template, theme });
  const metadataXml = buildMetadataXml({ respondent, email, dateStr, response, theme });
  const ethicsXml = branding.ethics_statement ? sectionNote("Ethics & Disclosure", branding.ethics_statement, theme) : "";
  const researchPromptXml = template.id === "alber"
    ? buildAlberResearchIntro(branding, form, theme)
    : buildCompactIntro(branding, form, template, theme);

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
  <w:body>
    ${coverXml}
    ${researchPromptXml}
    ${metadataXml}
    ${gpsXml}
    ${sectionHeading("QUESTIONS", theme, 28)}
    ${answersXml}
    ${signatureXml}
    ${ethicsXml}
    <w:sectPr>
        <w:pgSz w:w="12240" w:h="15840"/>
        <w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  let logoBuffer: Uint8Array | null = null;
  try {
    const logoUrl = branding.logo_url || "/letter-m.png";
    const res = await fetch(logoUrl);
    if (res.ok) {
      logoBuffer = new Uint8Array(await res.arrayBuffer());
    }
  } catch (e) {
    console.warn("Failed to fetch logo for docx", e);
  }

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  ${logoBuffer ? '<Default Extension="png" ContentType="image/png"/>' : ''}
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const wordRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${logoBuffer ? '<Relationship Id="rIdLogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo.png"/>' : ''}
</Relationships>`;

  const zippedFiles: Record<string, string | Uint8Array> = {
    "[Content_Types].xml": contentTypesXml,
    "_rels/.rels": relsXml,
    "word/_rels/document.xml.rels": wordRelsXml,
    "word/document.xml": docXml,
  };
  
  if (logoBuffer) {
    zippedFiles["word/media/logo.png"] = logoBuffer;
  }

  return createDocxZip(zippedFiles);
}

function buildCoverXml({ title, branding, template, theme }: any) {
  const org = branding.organization || "";
  const appendix = branding.appendix_label || "";
  const researchTitle = branding.research_title || "";
  const formattedTitle = theme.titleCase === "upper" ? title.toUpperCase() : title;

  // We check if docXml generation included the logo in files
  const logoDrawing = `
    <w:drawing>
      <wp:inline distT="0" distB="0" distL="0" distR="0">
        <wp:extent cx="350000" cy="350000"/>
        <wp:effectExtent l="0" t="0" r="0" b="0"/>
        <wp:docPr id="1" name="Logo"/>
        <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
          <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
            <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
              <pic:nvPicPr><pic:cNvPr id="0" name="Logo.png"/><pic:cNvPicPr/></pic:nvPicPr>
              <pic:blipFill><a:blip r:embed="rIdLogo"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>
              <pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="350000" cy="350000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>
            </pic:pic>
          </a:graphicData>
        </a:graphic>
      </wp:inline>
    </w:drawing>`;

  if (theme.coverMode === "hero") {
    return `
    ${org ? `<w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="920" w:after="140"/></w:pPr>
      <w:r>${logoDrawing}</w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="140"/></w:pPr>
      <w:r><w:rPr><w:b/><w:color w:val="${theme.muted}"/><w:sz w:val="28"/></w:rPr><w:t>${escapeXml(org)}</w:t></w:r>
    </w:p>` : `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="920" w:after="140"/></w:pPr><w:r>${logoDrawing}</w:r></w:p>`}
    ${appendix ? `<w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="100"/></w:pPr>
      <w:r><w:rPr><w:b/><w:color w:val="${theme.accent}"/><w:sz w:val="24"/></w:rPr><w:t>${escapeXml(appendix)}</w:t></w:r>
    </w:p>` : ""}
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="240" w:after="200"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="38"/></w:rPr><w:t>${escapeXml(formattedTitle)}</w:t></w:r>
    </w:p>
    ${researchTitle ? `<w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="260"/></w:pPr>
      <w:r><w:rPr><w:i/><w:color w:val="${theme.muted}"/><w:sz w:val="24"/></w:rPr><w:t>${escapeXml(researchTitle)}</w:t></w:r>
    </w:p>` : ""}
    <w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="10" w:space="1" w:color="${theme.line}"/></w:pBdr></w:pPr></w:p>`;
  }

  return `
  <w:p>
    <w:pPr><w:spacing w:after="60"/></w:pPr>
    <w:r>${logoDrawing}</w:r>
  </w:p>
  ${org ? `<w:p>
    <w:pPr><w:spacing w:after="60"/></w:pPr>
    <w:r><w:rPr><w:b/><w:color w:val="${theme.accent}"/><w:sz w:val="24"/></w:rPr><w:t>${escapeXml(org)}</w:t></w:r>
  </w:p>` : ""}
  ${appendix ? `<w:p>
    <w:pPr><w:spacing w:after="120"/></w:pPr>
    <w:r><w:rPr><w:i/><w:color w:val="${theme.muted}"/><w:sz w:val="20"/></w:rPr><w:t>${escapeXml(appendix)}</w:t></w:r>
  </w:p>` : ""}
  <w:p>
    <w:pPr><w:spacing w:after="220"/></w:pPr>
    <w:r><w:rPr><w:b/><w:sz w:val="34"/></w:rPr><w:t>${escapeXml(formattedTitle)}</w:t></w:r>
  </w:p>`;
}

function buildAlberResearchIntro(branding: any, form: any, theme: any) {
  const introTitle = branding.research_title || "";
  const consent = branding.consent_text || "Participation is voluntary. Responses are used for academic purposes and handled confidentially.";
  const description = form?.description || "";

  let xml = ``;
  if (introTitle) {
    xml += sectionHeading(introTitle, theme, 24);
  }
  if (description) {
    xml += simpleParagraph(description, theme, { after: 120, size: 21, color: theme.muted });
  }
  xml += simpleParagraph("Dear Respondent,", theme, { bold: true, before: 80, after: 80 });
  xml += simpleParagraph(consent, theme, { after: 160 });
  return xml;
}

function buildCompactIntro(branding: any, form: any, _template: any, theme: any) {
  const subtitle = branding.research_title || "";
  const description = form?.description || "";
  if (!subtitle && !description) return ``;
  
  let xml = ``;
  if (subtitle) {
    xml += `
    <w:p>
      <w:pPr><w:spacing w:before="160" w:after="${description ? 80 : 160}"/></w:pPr>
      <w:r><w:rPr><w:i/><w:color w:val="${theme.muted}"/><w:sz w:val="21"/></w:rPr><w:t>${escapeXml(subtitle)}</w:t></w:r>
    </w:p>`;
  }
  if (description) {
    xml += `
    <w:p>
      <w:pPr><w:spacing w:before="${subtitle ? 0 : 160}" w:after="160"/></w:pPr>
      <w:r><w:rPr><w:color w:val="${theme.muted}"/><w:sz w:val="20"/></w:rPr><w:t>${escapeXml(description)}</w:t></w:r>
    </w:p>`;
  }
  return xml;
}

function buildMetadataXml({ respondent, email, dateStr, response, theme }: any) {
  if (theme.metadataStyle === "cards") {
    return `
    ${metaCard("Full Name", respondent, theme)}
    ${metaCard("Email", email, theme)}
    ${metaCard("Submitted", dateStr, theme)}
    ${response?.respondent_phone ? metaCard("Phone", response.respondent_phone, theme) : ""}`;
  }

  return `
  <w:tbl>
    <w:tblPr>
      <w:tblW w:w="5000" w:type="pct"/>
      <w:tblBorders>
        <w:top w:val="single" w:sz="4" w:color="${theme.border}"/>
        <w:left w:val="single" w:sz="4" w:color="${theme.border}"/>
        <w:bottom w:val="single" w:sz="4" w:color="${theme.border}"/>
        <w:right w:val="single" w:sz="4" w:color="${theme.border}"/>
        <w:insideH w:val="single" w:sz="4" w:color="${theme.border}"/>
        <w:insideV w:val="single" w:sz="4" w:color="${theme.border}"/>
      </w:tblBorders>
      <w:shd w:fill="FFFFFF"/>
    </w:tblPr>
    ${metaRow("Full Name", respondent, theme)}
    ${metaRow("Email", email, theme)}
    ${metaRow("Submitted", dateStr, theme)}
    ${response?.respondent_phone ? metaRow("Phone", response.respondent_phone, theme) : ""}
  </w:tbl>`;
}

function buildAnswersXml({ questions, answers, theme }: any) {
  let answersXml = "";

  questions.forEach((q: any, i: number) => {
    const a = answers.find((ans: any) => ans.question_id === q.id || ans.question_label === q.label) ||
      (i < answers.length ? answers[i] : null);

    const label = q.label || a?.question_label || `Question ${i + 1}`;
    const answerText = a?.answer || "";
    const type = q.type || "short_text";

    answersXml += sectionQuestion(label, i + 1, theme);

    if (type === "checkbox") {
      const options = q.options || [];
      const selectedOptions = Array.isArray(answerText)
        ? answerText
        : (answerText ? String(answerText).split(",").map((s) => s.trim()) : []);

      options.forEach((opt: string) => {
        const isSelected = selectedOptions.includes(opt);
        answersXml += optionParagraph(opt, isSelected ? "☒" : "☐", isSelected, theme);
      });
    } else if (type === "multiple_choice" || type === "dropdown") {
      const options = q.options || [];
      options.forEach((opt: string) => {
        const isSelected = answerText === opt;
        answersXml += optionParagraph(opt, isSelected ? "◉" : "○", isSelected, theme);
      });
    } else if (type === "date") {
      let formattedDate = answerText || "—";
      try {
        if (answerText) {
          const d = new Date(answerText);
          if (isValid(d)) formattedDate = format(d, "MMMM d, yyyy");
        }
      } catch {}

      answersXml += answerParagraph(`Selected Date: ${formattedDate}`, theme, true);
    } else if (type === "long_text") {
      answersXml += answerParagraph(answerText || "—", theme, false, true);
    } else {
      answersXml += answerParagraph(answerText || "—", theme);
    }
  });

  if (!questions.length) {
    answersXml += simpleParagraph("No form questions were found for this response.", theme, { italic: true, color: theme.muted });
  }

  return answersXml;
}

function buildGpsXml(response: any, theme: any) {
  if (!(response?.gps_latitude && response?.gps_longitude)) return "";

  const accuracy = response.gps_accuracy ? ` (accuracy: ±${Math.round(response.gps_accuracy)}m)` : "";
  return sectionNote(
    "GPS Location",
    `${response.gps_latitude.toFixed(6)}, ${response.gps_longitude.toFixed(6)}${accuracy}`,
    theme,
  );
}

function buildSignatureXml(response: any, dateStr: string, theme: any) {
  if (!response?.signature_data_url) return "";

  return `
  ${sectionHeading("Respondent Signature", theme, 22)}
  ${simpleParagraph(`[Signature captured electronically on ${dateStr}]`, theme, { italic: true })}`;
}

function sectionHeading(text: string, theme: any, size = 24) {
  return `
  <w:p>
    <w:pPr><w:spacing w:before="260" w:after="100"/><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="${theme.line}"/></w:pBdr></w:pPr>
    <w:r><w:rPr><w:b/><w:color w:val="${theme.accent}"/><w:sz w:val="${size}"/><w:rFonts w:ascii="${theme.headingFont}" w:hAnsi="${theme.headingFont}"/></w:rPr><w:t>${escapeXml(text)}</w:t></w:r>
  </w:p>`;
}

function sectionQuestion(label: string, index: number, theme: any) {
  return `
  <w:p>
    <w:pPr><w:spacing w:before="220" w:after="80"/></w:pPr>
    <w:r><w:rPr><w:b/><w:color w:val="${theme.text}"/><w:sz w:val="22"/><w:rFonts w:ascii="${theme.headingFont}" w:hAnsi="${theme.headingFont}"/></w:rPr><w:t>${escapeXml(`${index}. ${label}`)}</w:t></w:r>
  </w:p>`;
}

function answerParagraph(text: string, theme: any, italic = false, longForm = false) {
  return `
  <w:p>
    <w:pPr><w:ind w:left="420"/><w:spacing w:after="${longForm ? 180 : 120}"/></w:pPr>
    <w:r><w:rPr><w:i w:val="${italic ? "true" : "false"}"/><w:color w:val="${italic ? theme.muted : theme.text}"/><w:sz w:val="21"/><w:rFonts w:ascii="${theme.bodyFont}" w:hAnsi="${theme.bodyFont}"/></w:rPr><w:t>${escapeXml(text)}</w:t></w:r>
  </w:p>`;
}

function optionParagraph(text: string, glyph: string, active: boolean, theme: any) {
  return `
  <w:p>
    <w:pPr><w:ind w:left="560"/><w:spacing w:after="50"/></w:pPr>
    <w:r><w:rPr><w:color w:val="${active ? theme.accent : theme.muted}"/><w:sz w:val="20"/><w:rFonts w:ascii="${theme.bodyFont}" w:hAnsi="${theme.bodyFont}"/></w:rPr><w:t xml:space="preserve">${glyph} </w:t></w:r>
    <w:r><w:rPr><w:color w:val="${active ? theme.text : theme.muted}"/><w:sz w:val="20"/><w:rFonts w:ascii="${theme.bodyFont}" w:hAnsi="${theme.bodyFont}"/></w:rPr><w:t>${escapeXml(text)}</w:t></w:r>
  </w:p>`;
}

function simpleParagraph(text: string, theme: any, options: any = {}) {
  const before = options.before ?? 40;
  const after = options.after ?? 60;
  const color = options.color || theme.text;
  const size = options.size || 21;
  return `
  <w:p>
    <w:pPr><w:spacing w:before="${before}" w:after="${after}"/></w:pPr>
    <w:r><w:rPr><w:b w:val="${options.bold ? "true" : "false"}"/><w:i w:val="${options.italic ? "true" : "false"}"/><w:color w:val="${color}"/><w:sz w:val="${size}"/><w:rFonts w:ascii="${theme.bodyFont}" w:hAnsi="${theme.bodyFont}"/></w:rPr><w:t>${escapeXml(text)}</w:t></w:r>
  </w:p>`;
}

function sectionNote(title: string, value: string, theme: any) {
  return `
  ${sectionHeading(title, theme, 22)}
  ${simpleParagraph(value, theme, { color: theme.muted, after: 120 })}`;
}

function metaCard(label: string, value: string, theme: any) {
  return `
  <w:p>
    <w:pPr><w:spacing w:before="100" w:after="20"/></w:pPr>
    <w:r><w:rPr><w:b/><w:color w:val="${theme.accent}"/><w:sz w:val="19"/></w:rPr><w:t>${escapeXml(label)}</w:t></w:r>
  </w:p>
  <w:p>
    <w:pPr><w:spacing w:after="80"/><w:pBdr><w:bottom w:val="single" w:sz="8" w:space="2" w:color="${theme.border}"/></w:pBdr></w:pPr>
    <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>${escapeXml(value)}</w:t></w:r>
  </w:p>`;
}

function metaRow(label: string, value: string, theme: any) {
  return `
  <w:tr>
    <w:tc>
      <w:tcPr><w:shd w:fill="${theme.surface}"/></w:tcPr>
      <w:p><w:r><w:rPr><w:b/><w:color w:val="${theme.accent}"/></w:rPr><w:t>${escapeXml(label)}</w:t></w:r></w:p>
    </w:tc>
    <w:tc>
      <w:p><w:r><w:t>${escapeXml(value)}</w:t></w:r></w:p>
    </w:tc>
  </w:tr>`;
}

function toHex(value: string) {
  return String(value || "").replace(/^#/, "").toUpperCase();
}

function escapeXml(str: any) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function createDocxZip(files: Record<string, string | Uint8Array>) {
    const encoder = new TextEncoder();
    const parts = [] as BlobPart[];
    const centralDirectory: Uint8Array[] = [];
    let offset = 0;

    for (const [name, content] of Object.entries(files)) {
        const nameBytes = encoder.encode(name);
        const contentBytes = typeof content === "string" ? encoder.encode(content) : content;
        const localHeader = new Uint8Array(30 + nameBytes.length);
        const view = new DataView(localHeader.buffer);
        view.setUint32(0, 0x04034b50, true);
        view.setUint16(4, 20, true);
        view.setUint16(6, 0, true);
        view.setUint16(8, 0, true);
        view.setUint16(10, 0, true);
        view.setUint16(12, 0, true);
        view.setUint32(14, crc32(contentBytes), true);
        view.setUint32(18, contentBytes.length, true);
        view.setUint32(22, contentBytes.length, true);
        view.setUint16(26, nameBytes.length, true);
        view.setUint16(28, 0, true);
        localHeader.set(nameBytes, 30);

        const cdEntry = new Uint8Array(46 + nameBytes.length);
        const cdView = new DataView(cdEntry.buffer);
        cdView.setUint32(0, 0x02014b50, true);
        cdView.setUint16(4, 20, true);
        cdView.setUint16(6, 20, true);
        cdView.setUint16(8, 0, true);
        cdView.setUint16(10, 0, true);
        cdView.setUint16(12, 0, true);
        cdView.setUint16(14, 0, true);
        cdView.setUint32(16, crc32(contentBytes), true);
        cdView.setUint32(20, contentBytes.length, true);
        cdView.setUint32(24, contentBytes.length, true);
        cdView.setUint16(28, nameBytes.length, true);
        cdView.setUint16(30, 0, true);
        cdView.setUint16(32, 0, true);
        cdView.setUint16(34, 0, true);
        cdView.setUint16(36, 0, true);
        cdView.setUint32(38, 0, true);
        cdView.setUint32(42, offset, true);
        cdEntry.set(nameBytes, 46);

        centralDirectory.push(cdEntry);
        parts.push(localHeader as BlobPart, contentBytes as BlobPart);
        offset += localHeader.length + contentBytes.length;
    }

    const cdOffset = offset;
    let cdSize = 0;
    centralDirectory.forEach(cd => { cdSize += cd.length; parts.push(cd as BlobPart); });

    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);
    eocdView.setUint32(0, 0x06054b50, true);
    eocdView.setUint16(4, 0, true);
    eocdView.setUint16(6, 0, true);
    eocdView.setUint16(8, centralDirectory.length, true);
    eocdView.setUint16(10, centralDirectory.length, true);
    eocdView.setUint32(12, cdSize, true);
    eocdView.setUint32(16, cdOffset, true);
    eocdView.setUint16(20, 0, true);
    parts.push(eocd as BlobPart);

    return new Blob(parts, { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}

function crc32(bytes: Uint8Array) {
    let crc = 0xFFFFFFFF;
    const table = getCrc32Table();
    for (let i = 0; i < bytes.length; i++) {
        crc = (crc >>> 8) ^ table[(crc ^ bytes[i]) & 0xFF];
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

let _crc32Table: Uint32Array | null = null;
function getCrc32Table() {
    if (_crc32Table) return _crc32Table;
    _crc32Table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
          c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        _crc32Table[i] = c;
    }
    return _crc32Table;
}

export async function downloadDocx(form: any, response: any) {
    const blob = await generateDocxBlob(form, response);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(form?.title || "response").replace(/[^a-zA-Z0-9]/g, "_")}_${(response?.respondent_name || "anonymous").replace(/\s+/g, "_")}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
