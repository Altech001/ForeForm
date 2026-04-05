/**
 * Export utilities for form responses: CSV and PDF.
 */

// ─── CSV Export ─────────────────────────────────────────────────────────────
export function exportCSV(form, responses) {
    const questions = form?.questions || [];

    // Header row
    const headers = [
        "Respondent Name",
        "Respondent Email",
        "Submitted At",
        ...questions.map((q) => `"${q.label.replace(/"/g, '""')}"`),
        "GPS Latitude",
        "GPS Longitude",
        "GPS Address",
    ];

    const rows = responses.map((r) => {
        const answerMap = {};
        (r.answers || []).forEach((a) => { answerMap[a.question_id] = a.answer; });

        return [
            `"${(r.respondent_name || "").replace(/"/g, '""')}"`,
            `"${(r.respondent_email || "").replace(/"/g, '""')}"`,
            `"${r.created_date ? new Date(r.created_date).toLocaleString() : ""}"`,
            ...questions.map((q) => `"${(answerMap[q.id] || "").replace(/"/g, '""')}"`),
            r.gps_latitude != null ? r.gps_latitude : "",
            r.gps_longitude != null ? r.gps_longitude : "",
            `"${(r.gps_address || "").replace(/"/g, '""')}"`,
        ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(form?.title || "responses").replace(/[^a-z0-9]/gi, "_")}_responses.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ─── PDF Export (pure HTML→print approach, no extra deps) ───────────────────
export function exportPDF(form, responses) {
    const questions = form?.questions || [];

    const escHtml = (str) =>
        String(str || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

    const rows = responses.map((r, idx) => {
        const answerMap = {};
        (r.answers || []).forEach((a) => { answerMap[a.question_id] = a.answer; });

        const answersHtml = questions
            .map(
                (q) => `
        <tr>
          <td style="padding:6px 10px;color:#6b7280;font-size:12px;border-bottom:1px solid #f3f4f6;width:40%">${escHtml(q.label)}</td>
          <td style="padding:6px 10px;font-size:12px;border-bottom:1px solid #f3f4f6;">${escHtml(answerMap[q.id] || "—")}</td>
        </tr>`
            )
            .join("");

        return `
      <div style="page-break-inside:avoid;margin-bottom:24px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <div style="background:#f9fafb;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;">
          <strong style="font-size:13px">${escHtml(r.respondent_name || "Anonymous")}</strong>
          <span style="color:#6b7280;font-size:11px">${r.created_date ? new Date(r.created_date).toLocaleString() : ""}</span>
        </div>
        ${r.respondent_email ? `<div style="padding:4px 14px;font-size:11px;color:#6b7280;background:#f9fafb;border-bottom:1px solid #e5e7eb;">${escHtml(r.respondent_email)}</div>` : ""}
        <table style="width:100%;border-collapse:collapse;">${answersHtml}</table>
        ${r.gps_latitude != null ? `<div style="padding:6px 14px;font-size:11px;color:#6b7280;border-top:1px solid #f3f4f6;">📍 ${r.gps_latitude.toFixed(5)}, ${r.gps_longitude.toFixed(5)}</div>` : ""}
      </div>`;
    });

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escHtml(form?.title)} — Responses</title>
  <style>body{font-family:Inter,sans-serif;padding:32px;color:#111827;} @media print{body{padding:16px;}}</style>
  </head><body>
  <h1 style="font-size:20px;font-weight:700;margin-bottom:4px;">${escHtml(form?.title || "Form Responses")}</h1>
  <p style="color:#6b7280;font-size:13px;margin-bottom:24px;">${responses.length} response${responses.length !== 1 ? "s" : ""} · Exported ${new Date().toLocaleDateString()}</p>
  ${rows.join("")}
  </body></html>`;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 500);
}