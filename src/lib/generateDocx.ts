import { format, isValid } from "date-fns";

export async function generateDocxBlob(form, response) {
    const branding = form?.branding || {};
    const title = form?.title || "Form Response";
    const respondent = response.respondent_name || "Anonymous";
    const email = response.respondent_email || "N/A";
    
    let dateStr = "N/A";
    try {
        const d = response.created_at || response.created_date || new Date();
        const dateObj = new Date(d);
        if (isValid(dateObj)) {
            dateStr = format(dateObj, "MMMM d, yyyy 'at' h:mm a");
        }
    } catch (e) {
        dateStr = "N/A";
    }

    let answersXml = "";
    const questions = form?.questions || [];
    const answers = response?.answers || [];

    // Map answers by question label or id if possible, otherwise use index
    questions.forEach((q, i) => {
        const a = answers.find(ans => ans.question_id === q.id || ans.question_label === q.label) || 
                 (i < answers.length ? answers[i] : null);
        
        const label = q.label || a?.question_label || `Question ${i + 1}`;
        const answerText = a?.answer || "";
        const type = q.type || "short_text";

        // Question Title
        answersXml += `
      <w:p>
        <w:pPr><w:spacing w:before="240" w:after="80"/></w:pPr>
        <w:r><w:rPr><w:b/><w:color w:val="2D1D6E"/><w:sz w:val="22"/></w:rPr><w:t>${escapeXml(`${i + 1}. ${label}`)}</w:t></w:r>
      </w:p>`;

        // Render based on type
        if (type === "checkbox") {
            const options = q.options || [];
            const selectedOptions = Array.isArray(answerText) ? answerText : (answerText ? answerText.split(",").map(s => s.trim()) : []);
            
            options.forEach(opt => {
                const isSelected = selectedOptions.includes(opt);
                answersXml += `
                <w:p>
                    <w:pPr><w:ind w:left="480"/><w:spacing w:after="40"/></w:pPr>
                    <w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">${isSelected ? "☒ " : "☐ "}</w:t></w:r>
                    <w:r><w:rPr><w:sz w:val="20"/><w:color w:val="${isSelected ? "000000" : "666666"}"/></w:rPr><w:t>${escapeXml(opt)}</w:t></w:r>
                </w:p>`;
            });
        } else if (type === "multiple_choice" || type === "dropdown") {
            const options = q.options || [];
            options.forEach(opt => {
                const isSelected = answerText === opt;
                answersXml += `
                <w:p>
                    <w:pPr><w:ind w:left="480"/><w:spacing w:after="40"/></w:pPr>
                    <w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">${isSelected ? "🔘 " : "⚪ "}</w:t></w:r>
                    <w:r><w:rPr><w:sz w:val="20"/><w:color w:val="${isSelected ? "000000" : "666666"}"/></w:rPr><w:t>${escapeXml(opt)}</w:t></w:r>
                </w:p>`;
            });
        } else if (type === "date") {
            let formattedDate = answerText || "—";
            try {
                if (answerText) {
                    const d = new Date(answerText);
                    if (isValid(d)) formattedDate = format(d, "MMMM d, yyyy");
                }
            } catch(e) {}
            
            answersXml += `
            <w:p>
                <w:pPr><w:ind w:left="480"/><w:spacing w:after="120"/></w:pPr>
                <w:r><w:rPr><w:i/><w:color w:val="444444"/></w:rPr><w:t>Selected Date: </w:t></w:r>
                <w:r><w:t>${escapeXml(formattedDate)}</w:t></w:r>
            </w:p>`;
        } else {
            // Default text rendering
            answersXml += `
            <w:p>
                <w:pPr><w:ind w:left="480"/><w:spacing w:after="120"/></w:pPr>
                <w:r><w:t>${escapeXml(answerText || "—")}</w:t></w:r>
            </w:p>`;
        }
    });

    // GPS section
    const gpsXml = (response.gps_latitude && response.gps_longitude) ? `
    <w:p>
      <w:pPr><w:spacing w:before="300" w:after="80"/><w:pBdr><w:top w:val="single" w:sz="2" w:space="4" w:color="EEEEEE"/></w:pBdr></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="18"/></w:rPr><w:t>GPS Location: </w:t></w:r>
      <w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>${escapeXml(`${response.gps_latitude.toFixed(6)}, ${response.gps_longitude.toFixed(6)}`)}</w:t></w:r>
      ${response.gps_accuracy ? `<w:r><w:rPr><w:color w:val="888888"/><w:sz w:val="16"/></w:rPr><w:t xml:space="preserve"> (accuracy: ±${Math.round(response.gps_accuracy)}m)</w:t></w:r>` : ""}
    </w:p>` : "";

    // Signature section
    const sigXml = response.signature_data_url ? `
    <w:p>
      <w:pPr><w:spacing w:before="400" w:after="80"/></w:pPr>
      <w:r><w:rPr><w:b/><w:u w:val="single"/></w:rPr><w:t>Respondent Signature:</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>[Signature captured electronically on ${dateStr}]</w:t></w:r>
    </w:p>` : "";

    const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${branding.organization ? `
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="60"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="2D1D6E"/></w:rPr><w:t>${escapeXml(branding.organization)}</w:t></w:r>
    </w:p>` : ""}

    ${branding.appendix_label ? `
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="60"/></w:pPr>
      <w:r><w:rPr><w:i/><w:color w:val="666666"/><w:sz w:val="20"/></w:rPr><w:t>${escapeXml(branding.appendix_label)}</w:t></w:r>
    </w:p>` : ""}

    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="240" w:after="160"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="48"/><w:u w:val="single"/></w:rPr><w:t>${escapeXml(title)}</w:t></w:r>
    </w:p>

    ${branding.research_title ? `
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="300"/></w:pPr>
      <w:r><w:rPr><w:i/><w:color w:val="444444"/><w:sz w:val="24"/></w:rPr><w:t>${escapeXml(branding.research_title)}</w:t></w:r>
    </w:p>` : ""}

    <w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="8" w:space="1" w:color="2D1D6E"/></w:pBdr></w:pPr></w:p>

    <w:tbl>
        <w:tblPr>
            <w:tblW w:w="5000" w:type="pct"/>
            <w:tblInd w:w="0" w:type="dxa"/>
            <w:tblBorders>
                <w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/><w:insideH w:val="none"/><w:insideV w:val="none"/>
            </w:tblBorders>
        </w:tblPr>
        <w:tr>
            <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Respondent:</w:t></w:r></w:p></tc>
            <w:tc><w:p><w:r><w:t>${escapeXml(respondent)}</w:t></w:r></w:p></tc>
        </w:tr>
        <w:tr>
            <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Email:</w:t></w:r></w:p></tc>
            <w:tc><w:p><w:r><w:t>${escapeXml(email)}</w:t></w:r></w:p></tc>
        </w:tr>
        <w:tr>
            <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Submitted:</w:t></w:r></w:p></tc>
            <w:tc><w:p><w:r><w:t>${escapeXml(dateStr)}</w:t></w:r></w:p></tc>
        </w:tr>
    </w:tbl>

    ${gpsXml}

    <w:p><w:pPr><w:spacing w:before="360" w:after="120"/><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="2D1D6E"/></w:pBdr></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="30"/><w:color w:val="2D1D6E"/></w:rPr><w:t>Data Collection Report</w:t></w:r>
    </w:p>

    ${answersXml}

    ${sigXml}

    ${branding.ethics_statement ? `
    <w:p><w:pPr><w:spacing w:before="600" w:after="120"/><w:pBdr><w:top w:val="single" w:sz="6" w:space="1" w:color="DDDDDD"/></w:pBdr></w:pPr>
      <w:r><w:rPr><w:b/><w:color w:val="666666"/><w:sz w:val="20"/></w:rPr><w:t>Ethics &amp; Disclosure</w:t></w:r>
    </w:p>
    <w:p><w:pPr><w:spacing w:after="120"/><w:jc w:val="both"/></w:pPr>
      <w:r><w:rPr><w:color w:val="666666"/><w:sz w:val="18"/></w:rPr><w:t>${escapeXml(branding.ethics_statement)}</w:t></w:r>
    </w:p>` : ""}

    <w:sectPr>
        <w:pgSz w:w="11906" w:h="16838"/>
        <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

    const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

    const wordRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`;

    return createDocxZip({
        "[Content_Types].xml": contentTypesXml,
        "_rels/.rels": relsXml,
        "word/_rels/document.xml.rels": wordRelsXml,
        "word/document.xml": docXml,
    });
}

function escapeXml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

async function createDocxZip(files: Record<string, string>) {
    const encoder = new TextEncoder();
    const parts = [];
    const centralDirectory = [];
    let offset = 0;

    for (const [name, content] of Object.entries(files)) {
        const nameBytes = encoder.encode(name);
        const contentBytes = encoder.encode(content as string);
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
        parts.push(localHeader, contentBytes);
        offset += localHeader.length + contentBytes.length;
    }

    const cdOffset = offset;
    let cdSize = 0;
    centralDirectory.forEach(cd => { cdSize += cd.length; parts.push(cd); });

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
    parts.push(eocd);

    return new Blob(parts, { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}

function crc32(bytes) {
    let crc = 0xFFFFFFFF;
    const table = getCrc32Table();
    for (let i = 0; i < bytes.length; i++) {
        crc = (crc >>> 8) ^ table[(crc ^ bytes[i]) & 0xFF];
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

let _crc32Table = null;
function getCrc32Table() {
    if (_crc32Table) return _crc32Table;
    _crc32Table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) { c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); }
        _crc32Table[i] = c;
    }
    return _crc32Table;
}

export async function downloadDocx(form, response) {
    const blob = await generateDocxBlob(form, response);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(form?.title || "response").replace(/[^a-zA-Z0-9]/g, "_")}_${(response.respondent_name || "anonymous").replace(/\s+/g, "_")}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}