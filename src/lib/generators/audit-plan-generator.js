// ============================================================
// AuditForge — Audit Plan Generator
// v0.4 — Planning Layer
// DDL Standard: Row 1/Col A spacer, grid off, footer, brand
// ============================================================

const ExcelJS = require("exceljs");

const BRAND = {
  navy: "0D1B2A",
  cream: "F5F1EB",
  crimson: "B23531",
  copper: "C49A3C",
  slate: "4A5568",
  steel: "6B7B8D",
  headerBg: "0D1B2A",
  headerFont: "F5F1EB",
  altRowBg: "F7F8FA",
  borderColor: "D0D5DD",
  inScope: "D1FAE5",
  outOfScope: "FECACA",
  deferred: "FEF3C7",
};

const SPACER_WIDTH = 0.75;
const SPACER_HEIGHT = 6;

function applyDDLStandard(sheet) {
  sheet.getColumn("A").width = SPACER_WIDTH;
  sheet.getRow(1).height = SPACER_HEIGHT;
  sheet.views = sheet.views || [];
  if (sheet.views.length === 0) sheet.views.push({});
  sheet.views[0].showGridLines = false;
  sheet.headerFooter = {
    oddFooter: "&L&8Dropdown Logistics&C&8Chaos \u2192 Structured \u2192 Automated&R&8Page &P of &N",
  };
}

async function generateAuditPlan({ audit, scope, companyName, periodLabel, outputDir }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AuditForge";
  workbook.created = new Date();
  workbook.properties = { company: "Dropdown Logistics" };

  // ── Cover Sheet ──
  const cover = workbook.addWorksheet("Cover", {
    properties: { tabColor: { argb: BRAND.navy } },
    views: [{ showGridLines: false }],
  });
  applyDDLStandard(cover);

  cover.mergeCells("B8:H8");
  cover.getCell("B8").value = companyName;
  cover.getCell("B8").font = { name: "Space Grotesk", size: 24, bold: true, color: { argb: BRAND.navy } };

  cover.mergeCells("B10:H10");
  cover.getCell("B10").value = "Audit Plan";
  cover.getCell("B10").font = { name: "Space Grotesk", size: 18, color: { argb: BRAND.steel } };

  for (let c = 2; c <= 4; c++) {
    cover.getRow(11).getCell(c).border = { bottom: { style: "medium", color: { argb: BRAND.copper } } };
  }

  const meta = [
    [`Audit: ${audit.auditId} — ${audit.auditName}`, BRAND.navy, 12],
    [`Type: ${fmtEnum(audit.auditType)}`, BRAND.navy, 11],
    [`Status: ${fmtEnum(audit.status)}`, BRAND.copper, 11],
    [`Lead Auditor: ${audit.leadAuditorName}`, BRAND.navy, 11],
    [`Period: ${periodLabel}`, BRAND.steel, 11],
    [`Generated: ${new Date().toISOString().split("T")[0]}`, BRAND.steel, 10],
    ["Template: TPL-ADP-001 v1.0.0", BRAND.slate, 10],
    ["Chaos \u2192 Structured \u2192 Automated", BRAND.copper, 9],
  ];
  meta.forEach(([text, color, size], i) => {
    cover.mergeCells(`B${13 + i}:H${13 + i}`);
    cover.getCell(`B${13 + i}`).value = text;
    cover.getCell(`B${13 + i}`).font = { name: "JetBrains Mono", size, color: { argb: color } };
  });

  // Summary
  const inScope = scope.filter((s) => s.inScope);
  const outScope = scope.filter((s) => !s.inScope);

  cover.getCell("B23").value = "Scope Summary";
  cover.getCell("B23").font = { name: "Space Grotesk", size: 14, bold: true, color: { argb: BRAND.navy } };

  ["Metric", "Value"].forEach((h, i) => {
    const cell = cover.getCell(24, i + 2);
    cell.value = h;
    cell.font = { name: "JetBrains Mono", size: 9, bold: true, color: { argb: BRAND.cream } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND.navy } };
  });

  const stats = [
    ["Controls In Scope", inScope.length],
    ["Controls Out of Scope", outScope.length],
    ["Key Controls In Scope", inScope.filter((s) => s.control?.keyControl).length],
    ["Process Areas Covered", [...new Set(inScope.map((s) => s.control?.process?.processArea).filter(Boolean))].length],
    ["Unique Auditors Assigned", [...new Set(inScope.map((s) => s.assignedTo?.auditorId).filter(Boolean))].length],
  ];
  stats.forEach(([label, value], i) => {
    const r = 25 + i;
    cover.getCell(`B${r}`).value = label;
    cover.getCell(`B${r}`).font = { name: "Source Serif 4", size: 10 };
    cover.getCell(`C${r}`).value = value;
    cover.getCell(`C${r}`).font = { name: "JetBrains Mono", size: 10, bold: true };
    cover.getCell(`C${r}`).alignment = { horizontal: "center" };
    [cover.getCell(`B${r}`), cover.getCell(`C${r}`)].forEach((c) => {
      c.border = { bottom: { style: "hair", color: { argb: BRAND.borderColor } } };
    });
  });

  cover.getColumn("B").width = 28;
  cover.getColumn("C").width = 14;

  // Methodology
  if (audit.methodology) {
    const methRow = 25 + stats.length + 2;
    cover.getCell(`B${methRow}`).value = "Methodology";
    cover.getCell(`B${methRow}`).font = { name: "Space Grotesk", size: 14, bold: true, color: { argb: BRAND.navy } };
    cover.mergeCells(`B${methRow + 1}:H${methRow + 3}`);
    cover.getCell(`B${methRow + 1}`).value = audit.methodology;
    cover.getCell(`B${methRow + 1}`).font = { name: "Source Serif 4", size: 10, color: { argb: BRAND.steel } };
    cover.getCell(`B${methRow + 1}`).alignment = { wrapText: true, vertical: "top" };
  }

  // Disclaimer
  const discRow = 38;
  cover.mergeCells(`B${discRow}:H${discRow}`);
  cover.getCell(`B${discRow}`).value = "All classifications, assessments, and conclusions reflect the professional judgment of the assigned auditor and are not system-generated or system-validated.";
  cover.getCell(`B${discRow}`).font = { name: "JetBrains Mono", size: 8, italic: true, color: { argb: BRAND.slate } };
  cover.getCell(`B${discRow}`).alignment = { wrapText: true };

  // ── Scope Matrix Sheet ──
  const matrix = workbook.addWorksheet("Scope Matrix", {
    properties: { tabColor: { argb: BRAND.copper } },
    views: [{ state: "frozen", xSplit: 1, ySplit: 2, showGridLines: false }],
  });
  applyDDLStandard(matrix);

  const COLS = [
    { header: "Control ID", width: 14 },
    { header: "Description", width: 45 },
    { header: "Process Area", width: 18 },
    { header: "Type", width: 12 },
    { header: "Key Control", width: 12 },
    { header: "Scope Decision", width: 14 },
    { header: "Scope Rationale", width: 30 },
    { header: "Assigned To", width: 18 },
    { header: "Target Date", width: 14 },
    { header: "Review Status", width: 14 },
    { header: "Mapped Risks", width: 24 },
  ];

  COLS.forEach((col, i) => {
    matrix.getColumn(String.fromCharCode(66 + i)).width = col.width;
  });

  // Header at row 2
  const headerRow = matrix.getRow(2);
  headerRow.height = 30;
  COLS.forEach((col, i) => {
    const cell = headerRow.getCell(i + 2);
    cell.value = col.header;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND.headerBg } };
    cell.font = { name: "JetBrains Mono", size: 9, bold: true, color: { argb: BRAND.headerFont } };
    cell.alignment = { vertical: "middle", wrapText: true };
    cell.border = { bottom: { style: "thin", color: { argb: BRAND.copper } } };
  });

  // Sort scope by process area → control ID
  const sorted = [...scope].sort((a, b) => {
    const aArea = a.control?.process?.processArea || "";
    const bArea = b.control?.process?.processArea || "";
    if (aArea !== bArea) return aArea.localeCompare(bArea);
    return (a.control?.controlId || "").localeCompare(b.control?.controlId || "");
  });

  sorted.forEach((s, idx) => {
    const row = matrix.getRow(idx + 3);
    const ctrl = s.control || {};
    const vals = [
      ctrl.controlId || "—",
      ctrl.description || "",
      ctrl.process?.processArea || "",
      fmtEnum(ctrl.controlType),
      ctrl.keyControl ? "Yes" : "No",
      fmtEnum(s.scopeDecision),
      s.scopeRationale || "",
      s.assignedTo?.auditorName || "Unassigned",
      s.targetDate ? new Date(s.targetDate).toISOString().split("T")[0] : "",
      fmtEnum(ctrl.reviewStatus),
      (ctrl.risks || []).map((r) => r.risk?.riskId).filter(Boolean).join(", ") || "—",
    ];
    vals.forEach((v, i) => { row.getCell(i + 2).value = v; });

    row.height = 40;
    for (let i = 2; i <= COLS.length + 1; i++) {
      const cell = row.getCell(i);
      cell.font = { name: "Source Serif 4", size: 9 };
      cell.alignment = { vertical: "top", wrapText: true };
      cell.border = { bottom: { style: "hair", color: { argb: BRAND.borderColor } } };
    }

    // Control ID in mono
    row.getCell(2).font = { name: "JetBrains Mono", size: 9, bold: true, color: { argb: BRAND.navy } };

    // Scope decision color
    const scopeColor = { IN_SCOPE: BRAND.inScope, OUT_OF_SCOPE: BRAND.outOfScope, DEFERRED: BRAND.deferred }[s.scopeDecision];
    if (scopeColor) row.getCell(7).fill = { type: "pattern", pattern: "solid", fgColor: { argb: scopeColor } };

    // Alt row
    if (idx % 2 === 1) {
      for (let i = 2; i <= COLS.length + 1; i++) {
        if (!row.getCell(i).fill?.fgColor) {
          row.getCell(i).fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND.altRowBg } };
        }
      }
    }

    // Risk IDs in crimson mono
    row.getCell(12).font = { name: "JetBrains Mono", size: 9, color: { argb: BRAND.crimson } };
  });

  // Auto-filter
  matrix.autoFilter = { from: { row: 2, column: 2 }, to: { row: sorted.length + 2, column: COLS.length + 1 } };
  matrix.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
  matrix.protect("auditforge", { selectLockedCells: true, selectUnlockedCells: true, autoFilter: true, sort: true });

  // ── Timeline Sheet ──
  const timeline = workbook.addWorksheet("Timeline", {
    properties: { tabColor: { argb: "4A9E6B" } },
    views: [{ showGridLines: false }],
  });
  applyDDLStandard(timeline);

  timeline.getCell("B3").value = "Audit Timeline";
  timeline.getCell("B3").font = { name: "Space Grotesk", size: 16, bold: true, color: { argb: BRAND.navy } };
  for (let c = 2; c <= 3; c++) {
    timeline.getRow(4).getCell(c).border = { bottom: { style: "medium", color: { argb: BRAND.copper } } };
  }

  ["Phase", "Target"].forEach((h, i) => {
    const cell = timeline.getCell(6, i + 2);
    cell.value = h;
    cell.font = { name: "JetBrains Mono", size: 9, bold: true, color: { argb: BRAND.cream } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND.navy } };
  });

  const phases = [
    ["Planning", audit.startDate ? new Date(audit.startDate).toISOString().split("T")[0] : "TBD"],
    ["Fieldwork", "Per scope matrix target dates"],
    ["Reporting", "30 days after fieldwork completion"],
    ["Completion", audit.endDate ? new Date(audit.endDate).toISOString().split("T")[0] : "TBD"],
  ];
  phases.forEach(([phase, target], i) => {
    const r = 7 + i;
    timeline.getCell(`B${r}`).value = phase;
    timeline.getCell(`B${r}`).font = { name: "Source Serif 4", size: 10, bold: true };
    timeline.getCell(`C${r}`).value = target;
    timeline.getCell(`C${r}`).font = { name: "JetBrains Mono", size: 10 };
    [timeline.getCell(`B${r}`), timeline.getCell(`C${r}`)].forEach((c) => {
      c.border = { bottom: { style: "hair", color: { argb: BRAND.borderColor } } };
    });
  });

  // By area breakdown
  timeline.getCell("B13").value = "Controls by Process Area";
  timeline.getCell("B13").font = { name: "Space Grotesk", size: 12, bold: true, color: { argb: BRAND.navy } };

  ["Process Area", "In Scope", "Key"].forEach((h, i) => {
    const cell = timeline.getCell(14, i + 2);
    cell.value = h;
    cell.font = { name: "JetBrains Mono", size: 9, bold: true, color: { argb: BRAND.cream } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND.navy } };
  });

  const byArea = {};
  inScope.forEach((s) => {
    const area = s.control?.process?.processArea || "Unknown";
    if (!byArea[area]) byArea[area] = { total: 0, key: 0 };
    byArea[area].total++;
    if (s.control?.keyControl) byArea[area].key++;
  });

  Object.entries(byArea).forEach(([area, counts], i) => {
    const r = 15 + i;
    timeline.getCell(`B${r}`).value = area;
    timeline.getCell(`B${r}`).font = { name: "Source Serif 4", size: 10 };
    timeline.getCell(`C${r}`).value = counts.total;
    timeline.getCell(`C${r}`).font = { name: "JetBrains Mono", size: 10, bold: true };
    timeline.getCell(`C${r}`).alignment = { horizontal: "center" };
    timeline.getCell(`D${r}`).value = counts.key;
    timeline.getCell(`D${r}`).font = { name: "JetBrains Mono", size: 10, bold: true };
    timeline.getCell(`D${r}`).alignment = { horizontal: "center" };
  });

  timeline.getColumn("B").width = 28;
  timeline.getColumn("C").width = 16;
  timeline.getColumn("D").width = 12;

  // ── Write ──
  const companyAbbr = companyName.replace(/[^A-Z]/g, "").substring(0, 6) || "CO";
  const fileName = `${companyAbbr}_ADP_${audit.auditId}_${periodLabel}_v1.0.xlsx`;
  const buffer = await workbook.xlsx.writeBuffer();
  return { buffer, fileName };
}

function fmtEnum(v) { return v ? v.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : ""; }

module.exports = { generateAuditPlan };
