// ============================================================
// AuditForge — Risk Control Matrix (RCM) Generator
// DDL Standard: Row 1/Col A spacer, grid off, footer, logo
// Brand: CottageHumble tokens, DDL crimson, copper accents
// ============================================================

const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");

// ── DDL Brand Tokens ───────────────────────────────────────
const BRAND = {
  navy: "0D1B2A",
  card: "10202f",
  cream: "F5F1EB",
  crimson: "B23531",
  copper: "C49A3C",
  slate: "4A5568",
  steel: "6B7B8D",
  // Functional
  headerBg: "0D1B2A",
  headerFont: "F5F1EB",
  altRowBg: "F7F8FA",
  keyControlBg: "FFF8E7",
  borderColor: "D0D5DD",
  // Risk ratings
  riskCritical: "FCA5A5",
  riskHigh: "FECACA",
  riskMedium: "FEF3C7",
  riskLow: "D1FAE5",
  // Effectiveness
  effective: "D1FAE5",
  ineffective: "FECACA",
  notTested: "F3F4F6",
};

const SPACER_WIDTH = 0.75;
const SPACER_HEIGHT = 6;

const RCM_COLUMNS = [
  { header: "Process Area", key: "processArea", width: 18 },
  { header: "Process", key: "processName", width: 20 },
  { header: "Subprocess", key: "subprocessName", width: 20 },
  { header: "Risk ID", key: "riskId", width: 14 },
  { header: "Risk Description", key: "riskDescription", width: 40 },
  { header: "Inherent Risk", key: "inherentRiskRating", width: 14 },
  { header: "Control ID", key: "controlId", width: 14 },
  { header: "Control Description", key: "controlDescription", width: 50 },
  { header: "Type", key: "controlType", width: 12 },
  { header: "Nature", key: "controlNature", width: 18 },
  { header: "Frequency", key: "controlFrequency", width: 14 },
  { header: "Key Control", key: "keyControl", width: 12 },
  { header: "Assertion(s)", key: "assertions", width: 28 },
  { header: "Framework Ref(s)", key: "frameworkRefs", width: 22 },
  { header: "Control Owner", key: "ownerName", width: 18 },
  { header: "Design Eff.", key: "designEffectiveness", width: 14 },
  { header: "Operating Eff.", key: "operatingEffectiveness", width: 14 },
];

// ── DDL Standard: Spacer + Grid Off + Footer ───────────────
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

// ── Cover Sheet ────────────────────────────────────────────
function buildCover(workbook, companyName, periodLabel, controls) {
  const cover = workbook.addWorksheet("Cover", {
    properties: { tabColor: { argb: BRAND.navy } },
    views: [{ showGridLines: false }],
  });
  applyDDLStandard(cover);

  // DDL Logo
  const logoPath = path.join(__dirname, "ddl_logo.jpg");
  if (fs.existsSync(logoPath)) {
    const img = workbook.addImage({ filename: logoPath, extension: "jpeg" });
    cover.addImage(img, { tl: { col: 1, row: 1.5 }, ext: { width: 140, height: 100 } });
  }

  // Company name
  cover.mergeCells("B8:H8");
  const nameCell = cover.getCell("B8");
  nameCell.value = companyName;
  nameCell.font = { name: "Space Grotesk", size: 24, bold: true, color: { argb: BRAND.navy } };

  // Document type
  cover.mergeCells("B10:H10");
  const typeCell = cover.getCell("B10");
  typeCell.value = "Risk Control Matrix";
  typeCell.font = { name: "Space Grotesk", size: 18, color: { argb: BRAND.steel } };

  // Copper accent line
  cover.mergeCells("B11:D11");
  cover.getCell("B11").border = { bottom: { style: "medium", color: { argb: BRAND.copper } } };
  cover.getCell("C11").border = { bottom: { style: "medium", color: { argb: BRAND.copper } } };
  cover.getCell("D11").border = { bottom: { style: "medium", color: { argb: BRAND.copper } } };

  // Metadata
  const meta = [
    [`Audit Period: ${periodLabel}`, BRAND.navy, 12],
    [`Generated: ${new Date().toISOString().split("T")[0]}`, BRAND.steel, 11],
    ["Template: TPL-RCM-001 v1.0.0", BRAND.slate, 10],
    ["Chaos \u2192 Structured \u2192 Automated", BRAND.copper, 9],
  ];
  meta.forEach(([text, color, size], i) => {
    cover.mergeCells(`B${13 + i}:H${13 + i}`);
    const cell = cover.getCell(`B${13 + i}`);
    cell.value = text;
    cell.font = { name: "JetBrains Mono", size, color: { argb: color } };
  });

  // Summary section
  const totalControls = controls.length;
  const keyControls = controls.filter((c) => c.keyControl).length;
  const uniqueRisks = new Set(controls.map((c) => c.riskId)).size;
  const uniqueProcesses = new Set(controls.map((c) => c.processArea)).size;

  cover.getCell("B19").value = "Summary";
  cover.getCell("B19").font = { name: "Space Grotesk", size: 14, bold: true, color: { argb: BRAND.navy } };

  // Summary table with navy header
  const summaryHeaders = ["Metric", "Value"];
  summaryHeaders.forEach((h, i) => {
    const cell = cover.getCell(20, i + 2);
    cell.value = h;
    cell.font = { name: "JetBrains Mono", size: 9, bold: true, color: { argb: BRAND.cream } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND.navy } };
    cell.alignment = { vertical: "middle" };
  });
  cover.getRow(20).height = 22;

  const summaryData = [
    ["Total Controls", totalControls],
    ["Key Controls", keyControls],
    ["Risks Addressed", uniqueRisks],
    ["Process Areas", uniqueProcesses],
  ];
  summaryData.forEach(([label, value], i) => {
    const r = 21 + i;
    cover.getCell(`B${r}`).value = label;
    cover.getCell(`B${r}`).font = { name: "Source Serif 4", size: 10 };
    cover.getCell(`C${r}`).value = value;
    cover.getCell(`C${r}`).font = { name: "JetBrains Mono", size: 10, bold: true };
    cover.getCell(`C${r}`).alignment = { horizontal: "center" };
    [cover.getCell(`B${r}`), cover.getCell(`C${r}`)].forEach((c) => {
      c.border = { bottom: { style: "hair", color: { argb: BRAND.borderColor } } };
    });
  });

  cover.getColumn("B").width = 22;
  cover.getColumn("C").width = 14;

  return cover;
}

// ── RCM Matrix Sheet ───────────────────────────────────────
function buildMatrix(workbook, controls) {
  const matrix = workbook.addWorksheet("RCM", {
    properties: { tabColor: { argb: BRAND.copper } },
    views: [{ state: "frozen", xSplit: 1, ySplit: 2, showGridLines: false }],
  });
  applyDDLStandard(matrix);

  // Column widths (B onward)
  RCM_COLUMNS.forEach((col, i) => {
    matrix.getColumn(String.fromCharCode(66 + i)).width = col.width;
  });

  // Header row at row 2
  const headerRow = matrix.getRow(2);
  headerRow.height = 32;
  RCM_COLUMNS.forEach((col, i) => {
    const cell = headerRow.getCell(i + 2);
    cell.value = col.header;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND.headerBg } };
    cell.font = { name: "JetBrains Mono", size: 9, bold: true, color: { argb: BRAND.headerFont } };
    cell.alignment = { vertical: "middle", wrapText: true };
    cell.border = { bottom: { style: "thin", color: { argb: BRAND.copper } } };
  });

  // Sort by process area → process → control ID
  const sorted = [...controls].sort((a, b) => {
    if (a.processArea !== b.processArea) return a.processArea.localeCompare(b.processArea);
    if (a.processName !== b.processName) return a.processName.localeCompare(b.processName);
    return a.controlId.localeCompare(b.controlId);
  });

  // Data rows starting at row 3
  sorted.forEach((ctrl, idx) => {
    const row = matrix.getRow(idx + 3);
    const vals = [
      ctrl.processArea, ctrl.processName, ctrl.subprocessName || "",
      ctrl.riskId, ctrl.riskDescription, fmtRating(ctrl.inherentRiskRating),
      ctrl.controlId, ctrl.controlDescription,
      fmtEnum(ctrl.controlType), fmtEnum(ctrl.controlNature), fmtEnum(ctrl.controlFrequency),
      ctrl.keyControl ? "Yes" : "No",
      ctrl.assertions.join(", "), ctrl.frameworkRefs.join(", "),
      ctrl.ownerName, fmtEnum(ctrl.designEffectiveness), fmtEnum(ctrl.operatingEffectiveness),
    ];
    vals.forEach((v, i) => { row.getCell(i + 2).value = v; });

    row.height = 45;
    for (let i = 2; i <= RCM_COLUMNS.length + 1; i++) {
      const cell = row.getCell(i);
      cell.font = { name: "Source Serif 4", size: 9 };
      cell.alignment = { vertical: "top", wrapText: true };
      cell.border = { bottom: { style: "hair", color: { argb: BRAND.borderColor } } };
    }

    // Alt row
    if (idx % 2 === 1) {
      for (let i = 2; i <= RCM_COLUMNS.length + 1; i++) {
        row.getCell(i).fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND.altRowBg } };
      }
    }

    // Key control highlight (index 11 → cell 13)
    if (ctrl.keyControl) {
      row.getCell(13).fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND.keyControlBg } };
      row.getCell(13).font = { name: "JetBrains Mono", size: 9, bold: true };
    }

    // Control ID in mono (index 6 → cell 8)
    row.getCell(8).font = { name: "JetBrains Mono", size: 9, bold: true, color: { argb: BRAND.navy } };

    // Risk ID in mono (index 3 → cell 5)
    row.getCell(5).font = { name: "JetBrains Mono", size: 9, color: { argb: BRAND.crimson } };

    // Risk rating color (index 5 → cell 7)
    const rc = riskColor(ctrl.inherentRiskRating);
    if (rc) row.getCell(7).fill = { type: "pattern", pattern: "solid", fgColor: { argb: rc } };

    // Effectiveness colors (design=index 15→cell 17, operating=index 16→cell 18)
    const dc = effColor(ctrl.designEffectiveness);
    if (dc) row.getCell(17).fill = { type: "pattern", pattern: "solid", fgColor: { argb: dc } };
    const oc = effColor(ctrl.operatingEffectiveness);
    if (oc) row.getCell(18).fill = { type: "pattern", pattern: "solid", fgColor: { argb: oc } };
  });

  // Auto-filter
  matrix.autoFilter = { from: { row: 2, column: 2 }, to: { row: sorted.length + 2, column: RCM_COLUMNS.length + 1 } };

  // Print setup
  matrix.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, printArea: `B2:R${sorted.length + 2}` };

  // Sheet protection
  matrix.protect("auditforge", { selectLockedCells: true, selectUnlockedCells: true, autoFilter: true, sort: true });

  return matrix;
}

// ── Summary Sheet ──────────────────────────────────────────
function buildSummary(workbook, controls) {
  const summary = workbook.addWorksheet("Summary", {
    properties: { tabColor: { argb: "4A9E6B" } },
    views: [{ showGridLines: false }],
  });
  applyDDLStandard(summary);

  summary.getCell("B3").value = "Control Coverage Summary";
  summary.getCell("B3").font = { name: "Space Grotesk", size: 16, bold: true, color: { argb: BRAND.navy } };

  // Copper accent
  summary.getCell("B4").border = { bottom: { style: "medium", color: { argb: BRAND.copper } } };
  summary.getCell("C4").border = { bottom: { style: "medium", color: { argb: BRAND.copper } } };

  summary.getCell("B6").value = "Controls by Process Area";
  summary.getCell("B6").font = { name: "Space Grotesk", size: 12, bold: true, color: { argb: BRAND.navy } };

  // Table header
  ["Process Area", "Total Controls", "Key Controls"].forEach((label, i) => {
    const cell = summary.getCell(7, i + 2);
    cell.value = label;
    cell.font = { name: "JetBrains Mono", size: 9, bold: true, color: { argb: BRAND.cream } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND.navy } };
    cell.alignment = { vertical: "middle" };
  });
  summary.getRow(7).height = 24;

  const byArea = {};
  controls.forEach((c) => {
    if (!byArea[c.processArea]) byArea[c.processArea] = { total: 0, key: 0 };
    byArea[c.processArea].total++;
    if (c.keyControl) byArea[c.processArea].key++;
  });

  Object.entries(byArea).forEach(([area, counts], i) => {
    const r = 8 + i;
    summary.getCell(`B${r}`).value = area;
    summary.getCell(`B${r}`).font = { name: "Source Serif 4", size: 10 };
    summary.getCell(`C${r}`).value = counts.total;
    summary.getCell(`C${r}`).font = { name: "JetBrains Mono", size: 10, bold: true };
    summary.getCell(`C${r}`).alignment = { horizontal: "center" };
    summary.getCell(`D${r}`).value = counts.key;
    summary.getCell(`D${r}`).font = { name: "JetBrains Mono", size: 10, bold: true };
    summary.getCell(`D${r}`).alignment = { horizontal: "center" };
    for (let c = 2; c <= 4; c++) {
      summary.getRow(r).getCell(c).border = { bottom: { style: "hair", color: { argb: BRAND.borderColor } } };
    }
  });

  // Totals row
  const totalRow = 8 + Object.keys(byArea).length;
  summary.getCell(`B${totalRow}`).value = "TOTAL";
  summary.getCell(`B${totalRow}`).font = { name: "JetBrains Mono", size: 10, bold: true, color: { argb: BRAND.navy } };
  summary.getCell(`C${totalRow}`).value = controls.length;
  summary.getCell(`C${totalRow}`).font = { name: "JetBrains Mono", size: 10, bold: true };
  summary.getCell(`C${totalRow}`).alignment = { horizontal: "center" };
  summary.getCell(`D${totalRow}`).value = controls.filter((c) => c.keyControl).length;
  summary.getCell(`D${totalRow}`).font = { name: "JetBrains Mono", size: 10, bold: true };
  summary.getCell(`D${totalRow}`).alignment = { horizontal: "center" };
  for (let c = 2; c <= 4; c++) {
    summary.getRow(totalRow).getCell(c).border = {
      top: { style: "thin", color: { argb: BRAND.navy } },
      bottom: { style: "double", color: { argb: BRAND.navy } },
    };
  }

  summary.getColumn("B").width = 28;
  summary.getColumn("C").width = 16;
  summary.getColumn("D").width = 16;

  return summary;
}

// ── Main Generator ─────────────────────────────────────────
async function generateRCM({ companyName, periodLabel, controls, outputDir }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AuditForge";
  workbook.created = new Date();
  workbook.properties = { company: "Dropdown Logistics" };

  buildCover(workbook, companyName, periodLabel, controls);
  buildMatrix(workbook, controls);
  buildSummary(workbook, controls);

  const companyAbbr = companyName.replace(/[^A-Z]/g, "").substring(0, 6) || "CO";
  const fileName = `${companyAbbr}_RCM_${periodLabel}_v1.0.xlsx`;
  const filePath = path.join(outputDir, fileName);
  await workbook.xlsx.writeFile(filePath);
  return { filePath, fileName };
}

// ── Helpers ────────────────────────────────────────────────
function fmtEnum(v) { return v ? v.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()).replace(/It /i, "IT ") : ""; }
function fmtRating(v) { return v ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() : ""; }
function riskColor(r) { return { CRITICAL: BRAND.riskCritical, HIGH: BRAND.riskHigh, MEDIUM: BRAND.riskMedium, LOW: BRAND.riskLow }[r] || null; }
function effColor(s) { return { EFFECTIVE: BRAND.effective, INEFFECTIVE: BRAND.ineffective, NOT_TESTED: BRAND.notTested, PARTIALLY_EFFECTIVE: BRAND.riskMedium }[s] || null; }

module.exports = { generateRCM };
