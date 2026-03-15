// ============================================================
// AuditForge — Master Control List (MCL) Generator
// DDL Standard: Row 1/Col A spacer, grid off, footer, logo
// Brand: CottageHumble tokens, DDL crimson, copper accents
// ============================================================

const ExcelJS = require("exceljs");

// ── DDL Brand Tokens ───────────────────────────────────────
const BRAND = {
  navy: "0D1B2A",
  card: "10202f",
  cream: "F5F1EB",
  crimson: "B23531",
  copper: "C49A3C",
  slate: "4A5568",
  steel: "6B7B8D",
  headerBg: "0D1B2A",
  headerFont: "F5F1EB",
  altRowBg: "F7F8FA",
  borderColor: "D0D5DD",
  statusDraft: "FEF3C7",
  statusPrepared: "DBEAFE",
  statusReviewed: "E0E7FF",
  statusApproved: "D1FAE5",
  effective: "D1FAE5",
  ineffective: "FECACA",
  notTested: "F3F4F6",
};

const SPACER_WIDTH = 0.75;
const SPACER_HEIGHT = 6;

const MCL_COLUMNS = [
  { header: "#", key: "index", width: 5 },
  { header: "Control ID", key: "controlId", width: 14 },
  { header: "Control Description", key: "controlDescription", width: 50 },
  { header: "Control Objective", key: "controlObjective", width: 35 },
  { header: "Type", key: "controlType", width: 12 },
  { header: "Nature", key: "controlNature", width: 18 },
  { header: "Frequency", key: "controlFrequency", width: 14 },
  { header: "Key Control", key: "keyControl", width: 12 },
  { header: "Process Area", key: "processArea", width: 18 },
  { header: "Process", key: "processName", width: 20 },
  { header: "Owner", key: "ownerName", width: 18 },
  { header: "Department", key: "ownerDepartment", width: 16 },
  { header: "Design Eff.", key: "designEffectiveness", width: 14 },
  { header: "Operating Eff.", key: "operatingEffectiveness", width: 14 },
  { header: "Review Status", key: "reviewStatus", width: 14 },
  { header: "Version", key: "version", width: 8 },
];

// ── DDL Standard ───────────────────────────────────────────
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
    cover.addImage(img, { tl: { col: 1, row: 1.5 }, ext: { width: 140, height: 100 } });
  }

  cover.mergeCells("B8:H8");
  cover.getCell("B8").value = companyName;
  cover.getCell("B8").font = { name: "Space Grotesk", size: 24, bold: true, color: { argb: BRAND.navy } };

  cover.mergeCells("B10:H10");
  cover.getCell("B10").value = "Master Control List";
  cover.getCell("B10").font = { name: "Space Grotesk", size: 18, color: { argb: BRAND.steel } };

  // Copper accent
  cover.mergeCells("B11:D11");
  for (let c = 2; c <= 4; c++) {
    cover.getRow(11).getCell(c).border = { bottom: { style: "medium", color: { argb: BRAND.copper } } };
  }

  const meta = [
    [`Audit Period: ${periodLabel}`, BRAND.navy, 12],
    [`Generated: ${new Date().toISOString().split("T")[0]}`, BRAND.steel, 11],
    ["Template: TPL-MCL-001 v1.0.0", BRAND.slate, 10],
    ["Chaos \u2192 Structured \u2192 Automated", BRAND.copper, 9],
  ];
  meta.forEach(([text, color, size], i) => {
    cover.mergeCells(`B${13 + i}:H${13 + i}`);
    cover.getCell(`B${13 + i}`).value = text;
    cover.getCell(`B${13 + i}`).font = { name: "JetBrains Mono", size, color: { argb: color } };
  });

  // Summary
  cover.getCell("B19").value = "Summary";
  cover.getCell("B19").font = { name: "Space Grotesk", size: 14, bold: true, color: { argb: BRAND.navy } };

  ["Metric", "Value"].forEach((h, i) => {
    const cell = cover.getCell(20, i + 2);
    cell.value = h;
    cell.font = { name: "JetBrains Mono", size: 9, bold: true, color: { argb: BRAND.cream } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND.navy } };
  });

  const stats = [
    ["Total Controls", controls.length],
    ["Key Controls", controls.filter((c) => c.keyControl).length],
    ["Preventive", controls.filter((c) => c.controlType === "PREVENTIVE").length],
    ["Detective", controls.filter((c) => c.controlType === "DETECTIVE").length],
    ["Manual", controls.filter((c) => c.controlNature === "MANUAL").length],
    ["Automated", controls.filter((c) => c.controlNature === "AUTOMATED").length],
    ["IT-Dependent", controls.filter((c) => c.controlNature === "IT_DEPENDENT_MANUAL").length],
  ];
  stats.forEach(([label, value], i) => {
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
}

// ── MCL Listing Sheet ──────────────────────────────────────
function buildListing(workbook, controls) {
  const sheet = workbook.addWorksheet("Master Control List", {
    properties: { tabColor: { argb: BRAND.navy } },
    views: [{ state: "frozen", xSplit: 1, ySplit: 2, showGridLines: false }],
  });
  applyDDLStandard(sheet);

  // Column widths
  MCL_COLUMNS.forEach((col, i) => {
    sheet.getColumn(String.fromCharCode(66 + i)).width = col.width;
  });

  // Header row at row 2
  const headerRow = sheet.getRow(2);
  headerRow.height = 30;
  MCL_COLUMNS.forEach((col, i) => {
    const cell = headerRow.getCell(i + 2);
    cell.value = col.header;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND.headerBg } };
    cell.font = { name: "JetBrains Mono", size: 9, bold: true, color: { argb: BRAND.headerFont } };
    cell.alignment = { vertical: "middle", wrapText: true };
    cell.border = { bottom: { style: "thin", color: { argb: BRAND.copper } } };
  });

  // Sort by control ID
  const sorted = [...controls].sort((a, b) => a.controlId.localeCompare(b.controlId));

  sorted.forEach((ctrl, idx) => {
    const row = sheet.getRow(idx + 3);
    const vals = [
      idx + 1,
      ctrl.controlId,
      ctrl.controlDescription,
      ctrl.controlObjective || "",
      fmtEnum(ctrl.controlType),
      fmtEnum(ctrl.controlNature),
      fmtEnum(ctrl.controlFrequency),
      ctrl.keyControl ? "Yes" : "No",
      ctrl.processArea,
      ctrl.processName,
      ctrl.ownerName,
      ctrl.ownerDepartment || "",
      fmtEnum(ctrl.designEffectiveness),
      fmtEnum(ctrl.operatingEffectiveness),
      fmtEnum(ctrl.reviewStatus),
      ctrl.version,
    ];
    vals.forEach((v, i) => { row.getCell(i + 2).value = v; });

    row.height = 40;
    for (let i = 2; i <= MCL_COLUMNS.length + 1; i++) {
      const cell = row.getCell(i);
      cell.font = { name: "Source Serif 4", size: 9 };
      cell.alignment = { vertical: "top", wrapText: true };
      cell.border = { bottom: { style: "hair", color: { argb: BRAND.borderColor } } };
    }

    // Row number in mono
    row.getCell(2).font = { name: "JetBrains Mono", size: 8, color: { argb: BRAND.slate } };
    row.getCell(2).alignment = { horizontal: "center", vertical: "top" };

    // Control ID in mono bold
    row.getCell(3).font = { name: "JetBrains Mono", size: 9, bold: true, color: { argb: BRAND.navy } };

    // Alt row
    if (idx % 2 === 1) {
      for (let i = 2; i <= MCL_COLUMNS.length + 1; i++) {
        row.getCell(i).fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND.altRowBg } };
      }
    }

    // Key control highlight (index 7 → cell 9)
    if (ctrl.keyControl) {
      row.getCell(9).font = { name: "JetBrains Mono", size: 9, bold: true };
    }

    // Status color (index 14 → cell 16)
    const sc = statusColor(ctrl.reviewStatus);
    if (sc) row.getCell(16).fill = { type: "pattern", pattern: "solid", fgColor: { argb: sc } };

    // Effectiveness colors (design=index 12→cell 14, operating=index 13→cell 15)
    const dc = effColor(ctrl.designEffectiveness);
    if (dc) row.getCell(14).fill = { type: "pattern", pattern: "solid", fgColor: { argb: dc } };
    const oc = effColor(ctrl.operatingEffectiveness);
    if (oc) row.getCell(15).fill = { type: "pattern", pattern: "solid", fgColor: { argb: oc } };

    // Version in mono (index 15 → cell 17)
    row.getCell(17).font = { name: "JetBrains Mono", size: 9 };
    row.getCell(17).alignment = { horizontal: "center", vertical: "top" };
  });

  // Auto-filter
  sheet.autoFilter = { from: { row: 2, column: 2 }, to: { row: sorted.length + 2, column: MCL_COLUMNS.length + 1 } };

  // Print
  sheet.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };

  // Protect
  sheet.protect("auditforge", { selectLockedCells: true, selectUnlockedCells: true, autoFilter: true, sort: true });
}

// ── Status Breakdown Sheet ─────────────────────────────────
function buildStatusSheet(workbook, controls) {
  const sheet = workbook.addWorksheet("Status Breakdown", {
    properties: { tabColor: { argb: "4A9E6B" } },
    views: [{ showGridLines: false }],
  });
  applyDDLStandard(sheet);

  sheet.getCell("B3").value = "Master Control List — Status Breakdown";
  sheet.getCell("B3").font = { name: "Space Grotesk", size: 16, bold: true, color: { argb: BRAND.navy } };

  sheet.getCell("B4").border = { bottom: { style: "medium", color: { argb: BRAND.copper } } };
  sheet.getCell("C4").border = { bottom: { style: "medium", color: { argb: BRAND.copper } } };

  // By Review Status
  sheet.getCell("B6").value = "By Review Status";
  sheet.getCell("B6").font = { name: "Space Grotesk", size: 12, bold: true };

  ["Status", "Count"].forEach((h, i) => {
    const cell = sheet.getCell(7, i + 2);
    cell.value = h;
    cell.font = { name: "JetBrains Mono", size: 9, bold: true, color: { argb: BRAND.cream } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND.navy } };
  });

  ["DRAFT", "PREPARED", "REVIEWED", "APPROVED"].forEach((status, i) => {
    const r = 8 + i;
    const count = controls.filter((c) => c.reviewStatus === status).length;
    sheet.getCell(`B${r}`).value = fmtEnum(status);
    sheet.getCell(`B${r}`).font = { name: "Source Serif 4", size: 10 };
    sheet.getCell(`C${r}`).value = count;
    sheet.getCell(`C${r}`).font = { name: "JetBrains Mono", size: 10, bold: true };
    sheet.getCell(`C${r}`).alignment = { horizontal: "center" };
    const sc = statusColor(status);
    if (sc) sheet.getCell(`C${r}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: sc } };
    [sheet.getCell(`B${r}`), sheet.getCell(`C${r}`)].forEach((c) => {
      c.border = { bottom: { style: "hair", color: { argb: BRAND.borderColor } } };
    });
  });

  // By Control Type
  sheet.getCell("B14").value = "By Control Type";
  sheet.getCell("B14").font = { name: "Space Grotesk", size: 12, bold: true };

  ["Type", "Count"].forEach((h, i) => {
    const cell = sheet.getCell(15, i + 2);
    cell.value = h;
    cell.font = { name: "JetBrains Mono", size: 9, bold: true, color: { argb: BRAND.cream } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND.navy } };
  });

  ["PREVENTIVE", "DETECTIVE", "CORRECTIVE"].forEach((type, i) => {
    const r = 16 + i;
    const count = controls.filter((c) => c.controlType === type).length;
    sheet.getCell(`B${r}`).value = fmtEnum(type);
    sheet.getCell(`B${r}`).font = { name: "Source Serif 4", size: 10 };
    sheet.getCell(`C${r}`).value = count;
    sheet.getCell(`C${r}`).font = { name: "JetBrains Mono", size: 10, bold: true };
    sheet.getCell(`C${r}`).alignment = { horizontal: "center" };
    [sheet.getCell(`B${r}`), sheet.getCell(`C${r}`)].forEach((c) => {
      c.border = { bottom: { style: "hair", color: { argb: BRAND.borderColor } } };
    });
  });

  // By Nature
  sheet.getCell("B21").value = "By Control Nature";
  sheet.getCell("B21").font = { name: "Space Grotesk", size: 12, bold: true };

  ["Nature", "Count"].forEach((h, i) => {
    const cell = sheet.getCell(22, i + 2);
    cell.value = h;
    cell.font = { name: "JetBrains Mono", size: 9, bold: true, color: { argb: BRAND.cream } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND.navy } };
  });

  ["MANUAL", "AUTOMATED", "IT_DEPENDENT_MANUAL"].forEach((nature, i) => {
    const r = 23 + i;
    const count = controls.filter((c) => c.controlNature === nature).length;
    sheet.getCell(`B${r}`).value = fmtEnum(nature);
    sheet.getCell(`B${r}`).font = { name: "Source Serif 4", size: 10 };
    sheet.getCell(`C${r}`).value = count;
    sheet.getCell(`C${r}`).font = { name: "JetBrains Mono", size: 10, bold: true };
    sheet.getCell(`C${r}`).alignment = { horizontal: "center" };
    [sheet.getCell(`B${r}`), sheet.getCell(`C${r}`)].forEach((c) => {
      c.border = { bottom: { style: "hair", color: { argb: BRAND.borderColor } } };
    });
  });

  sheet.getColumn("B").width = 24;
  sheet.getColumn("C").width = 14;
}

// ── Main Generator ─────────────────────────────────────────
async function generateMCL({ companyName, periodLabel, controls, outputDir }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AuditForge";
  workbook.created = new Date();
  workbook.properties = { company: "Dropdown Logistics" };

  buildCover(workbook, companyName, periodLabel, controls);
  buildListing(workbook, controls);
  buildStatusSheet(workbook, controls);

  const companyAbbr = companyName.replace(/[^A-Z]/g, "").substring(0, 6) || "CO";
  const fileName = `${companyAbbr}_MCL_${periodLabel}_v1.0.xlsx`;
  const buffer = await workbook.xlsx.writeBuffer();
  return { buffer, fileName };
}

// ── Helpers ────────────────────────────────────────────────
function fmtEnum(v) { return v ? v.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()).replace(/It /i, "IT ") : ""; }
function statusColor(s) { return { DRAFT: BRAND.statusDraft, PREPARED: BRAND.statusPrepared, REVIEWED: BRAND.statusReviewed, APPROVED: BRAND.statusApproved }[s] || null; }
function effColor(s) { return { EFFECTIVE: BRAND.effective, INEFFECTIVE: BRAND.ineffective, NOT_TESTED: BRAND.notTested, PARTIALLY_EFFECTIVE: BRAND.riskMedium }[s] || null; }

module.exports = { generateMCL };
