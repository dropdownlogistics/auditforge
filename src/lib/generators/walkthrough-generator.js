// ============================================================
// AuditForge — Process Walkthrough Narrative Generator
// DDL Standard: CottageHumble typography, branded footer
// Output: DOCX with narrative, control points, risk summary
// ============================================================

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, LevelFormat,
} = require("docx");

// ── DDL Brand Tokens ───────────────────────────────────────
const BRAND = {
  navy: "0D1B2A",
  cream: "F5F1EB",
  crimson: "B23531",
  copper: "C49A3C",
  slate: "4A5568",
  steel: "6B7B8D",
  borderColor: "D0D5DD",
  headerBg: "0D1B2A",
  lightBg: "F2F4F7",
};

const BORDER = { style: BorderStyle.SINGLE, size: 1, color: BRAND.borderColor };
const BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };
const CELL_MARGINS = { top: 80, bottom: 80, left: 120, right: 120 };

// ── Main Generator ─────────────────────────────────────────
async function generateWalkthrough({
  companyName,
  periodLabel,
  process,
  controls,
  risks,
  preparedBy = "AuditForge",
  outputDir,
}) {
  const today = new Date().toISOString().split("T")[0];

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Source Serif 4", size: 22 } },
      },
      paragraphStyles: [
        {
          id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 36, bold: true, font: "Space Grotesk", color: BRAND.navy },
          paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
        },
        {
          id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 28, bold: true, font: "Space Grotesk", color: BRAND.navy },
          paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 },
        },
        {
          id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 24, bold: true, font: "Space Grotesk", color: BRAND.slate },
          paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 },
        },
      ],
    },
    numbering: {
      config: [{
        reference: "controlSteps",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      }],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: companyName, font: "Space Grotesk", size: 18, bold: true, color: BRAND.navy }),
                new TextRun({ text: `  \u2022  ${periodLabel}`, font: "JetBrains Mono", size: 14, color: BRAND.steel }),
              ],
              border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BRAND.copper, space: 4 } },
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "Dropdown Logistics", font: "JetBrains Mono", size: 14, color: BRAND.steel }),
                new TextRun({ text: "  \u2022  Chaos \u2192 Structured \u2192 Automated  \u2022  ", font: "JetBrains Mono", size: 14, color: BRAND.slate }),
                new TextRun({ text: "Page ", font: "JetBrains Mono", size: 14, color: BRAND.slate }),
                new TextRun({ children: [PageNumber.CURRENT], font: "JetBrains Mono", size: 14, color: BRAND.slate }),
              ],
              border: { top: { style: BorderStyle.SINGLE, size: 4, color: BRAND.copper, space: 4 } },
            }),
          ],
        }),
      },
      children: [
        // ── Title ──
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun("Process Walkthrough Narrative")],
        }),

        // ── Copper accent ──
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: BRAND.copper, space: 2 } },
          spacing: { after: 300 },
          children: [],
        }),

        // ── Document Info Table ──
        buildInfoTable([
          ["Company", companyName],
          ["Process Area", process.processArea],
          ["Process", process.processName],
          ["Subprocess", process.subprocessName || "N/A"],
          ["Process Owner", process.processOwner || "Not Assigned"],
          ["Audit Period", periodLabel],
          ["Prepared By", preparedBy],
          ["Date", today],
          ["Template", "TPL-WLK-001 v1.0.0"],
        ]),

        spacer(),

        // ── Process Overview ──
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun("1. Process Overview")],
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: process.description ||
                `The ${process.processName} process within the ${process.processArea} area encompasses the ${process.subprocessName || "core operational"} activities. This process is owned by ${process.processOwner || "the designated process owner"} and operates within the ${companyName} control environment.`,
              font: "Source Serif 4",
            }),
          ],
        }),

        // ── Control Points ──
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun("2. Key Control Points")],
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: `The following ${controls.length} control(s) operate within this process to mitigate identified risks:`,
              font: "Source Serif 4",
            }),
          ],
        }),

        // Each control as a numbered section
        ...controls.flatMap((ctrl, i) => [
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            children: [new TextRun(`2.${i + 1}  ${ctrl.controlId}`)],
          }),
          buildControlTable([
            ["Control Description", ctrl.controlDescription || ctrl.description],
            ["Control Type", fmtEnum(ctrl.controlType)],
            ["Control Nature", fmtEnum(ctrl.controlNature)],
            ["Frequency", fmtEnum(ctrl.controlFrequency)],
            ["Key Control", ctrl.keyControl ? "Yes" : "No"],
            ["Assertion(s)", (ctrl.assertions || []).join(", ")],
            ["Framework Ref(s)", (ctrl.frameworkRefs || []).join(", ")],
            ["Owner", ctrl.ownerName],
            ["Design Effectiveness", fmtEnum(ctrl.designEffectiveness)],
            ["Operating Effectiveness", fmtEnum(ctrl.operatingEffectiveness)],
          ]),
          spacer(),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "Walkthrough Observation: ", bold: true, font: "Space Grotesk", size: 20 }),
              new TextRun({
                text: ctrl.evidenceDescription ||
                  "[Document observations from walkthrough here. Include: who performs the control, what evidence is retained, what system(s) are used, how exceptions are handled, and where documentation is stored.]",
                italics: !ctrl.evidenceDescription,
                color: ctrl.evidenceDescription ? "000000" : BRAND.steel,
                font: "Source Serif 4",
              }),
            ],
          }),
        ]),

        // ── Risk Summary ──
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun("3. Risk Summary")],
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: `The following ${risks.length} risk(s) have been identified for this process:`,
              font: "Source Serif 4",
            }),
          ],
        }),
        buildRiskTable(risks, controls),

        spacer(),

        // ── Gap Analysis ──
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun("4. Gap Analysis")],
        }),
        ...buildGapAnalysis(risks, controls),

        spacer(),

        // ── Sign-off ──
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun("5. Review and Approval")],
        }),
        buildSignoffTable(),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const companyAbbr = companyName.replace(/[^A-Z]/g, "").substring(0, 6) || "CO";
  const processAbbr = process.processArea.replace(/\s+/g, "").substring(0, 6);
  const fileName = `${companyAbbr}_WLK_${processAbbr}_${periodLabel}_v1.0.docx`;
  fs.writeFileSync(filePath, buffer);
  return { filePath, fileName };
}

// ── Component Builders ─────────────────────────────────────

function buildInfoTable(rows) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2800, 6560],
    rows: rows.map(([label, value]) =>
      new TableRow({
        children: [
          new TableCell({
            borders: BORDERS, width: { size: 2800, type: WidthType.DXA }, margins: CELL_MARGINS,
            shading: { fill: BRAND.headerBg, type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, font: "JetBrains Mono", size: 18, color: BRAND.cream })] })],
          }),
          new TableCell({
            borders: BORDERS, width: { size: 6560, type: WidthType.DXA }, margins: CELL_MARGINS,
            children: [new Paragraph({ children: [new TextRun({ text: String(value), font: "Source Serif 4", size: 20 })] })],
          }),
        ],
      })
    ),
  });
}

function buildControlTable(rows) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2800, 6560],
    rows: rows.map(([label, value]) =>
      new TableRow({
        children: [
          new TableCell({
            borders: BORDERS, width: { size: 2800, type: WidthType.DXA }, margins: CELL_MARGINS,
            shading: { fill: BRAND.lightBg, type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, font: "JetBrains Mono", size: 18, color: BRAND.navy })] })],
          }),
          new TableCell({
            borders: BORDERS, width: { size: 6560, type: WidthType.DXA }, margins: CELL_MARGINS,
            children: [new Paragraph({ children: [new TextRun({ text: String(value), font: "Source Serif 4", size: 20 })] })],
          }),
        ],
      })
    ),
  });
}

function buildRiskTable(risks, controls) {
  const colWidths = [1200, 4000, 1200, 2960];
  const headerRow = new TableRow({
    children: ["Risk ID", "Risk Description", "Rating", "Mapped Controls"].map((text, i) =>
      new TableCell({
        borders: BORDERS, width: { size: colWidths[i], type: WidthType.DXA }, margins: CELL_MARGINS,
        shading: { fill: BRAND.headerBg, type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text, bold: true, font: "JetBrains Mono", size: 16, color: BRAND.cream })] })],
      })
    ),
  });

  const dataRows = risks.map((risk) =>
    new TableRow({
      children: [
        risk.riskId,
        risk.description,
        fmtEnum(risk.inherentRiskRating),
        controls
          .filter((c) => c.riskIds && c.riskIds.includes(risk.riskId))
          .map((c) => c.controlId)
          .join(", ") || "None",
      ].map((text, i) =>
        new TableCell({
          borders: BORDERS, width: { size: colWidths[i], type: WidthType.DXA }, margins: CELL_MARGINS,
          children: [new Paragraph({ children: [
            new TextRun({
              text: String(text),
              font: i === 0 || i === 3 ? "JetBrains Mono" : "Source Serif 4",
              size: 18,
              color: i === 0 ? BRAND.crimson : undefined,
              bold: i === 0,
            }),
          ] })],
        })
      ),
    })
  );

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows],
  });
}

function buildGapAnalysis(risks, controls) {
  const unmappedRisks = risks.filter(
    (r) => !controls.some((c) => c.riskIds && c.riskIds.includes(r.riskId))
  );

  if (unmappedRisks.length === 0) {
    return [
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({ text: "\u2713 ", font: "Source Serif 4", color: "059669", bold: true }),
          new TextRun({ text: "All identified risks have at least one mapped control. No coverage gaps detected.", font: "Source Serif 4" }),
        ],
      }),
    ];
  }

  return [
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({ text: `\u26A0 ${unmappedRisks.length} risk(s) do not have mapped controls:`, bold: true, color: BRAND.crimson, font: "Space Grotesk" }),
      ],
    }),
    ...unmappedRisks.map((r) =>
      new Paragraph({
        spacing: { after: 100 },
        indent: { left: 720 },
        children: [
          new TextRun({ text: `${r.riskId}: `, bold: true, font: "JetBrains Mono", size: 20, color: BRAND.crimson }),
          new TextRun({ text: r.description, font: "Source Serif 4", size: 20 }),
        ],
      })
    ),
  ];
}

function buildSignoffTable() {
  const colWidths = [2400, 3480, 1200, 2280];
  const rows = ["Prepared By", "Reviewed By", "Approved By"].map((label) =>
    new TableRow({
      height: { value: 600, rule: "atLeast" },
      children: [
        new TableCell({
          borders: BORDERS, width: { size: 2400, type: WidthType.DXA }, margins: CELL_MARGINS,
          shading: { fill: BRAND.headerBg, type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, font: "JetBrains Mono", size: 18, color: BRAND.cream })] })],
        }),
        new TableCell({
          borders: BORDERS, width: { size: 3480, type: WidthType.DXA }, margins: CELL_MARGINS,
          children: [new Paragraph({ children: [new TextRun({ text: "", font: "Source Serif 4", size: 20 })] })],
        }),
        new TableCell({
          borders: BORDERS, width: { size: 1200, type: WidthType.DXA }, margins: CELL_MARGINS,
          shading: { fill: BRAND.lightBg, type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: "Date", bold: true, font: "JetBrains Mono", size: 18 })] })],
        }),
        new TableCell({
          borders: BORDERS, width: { size: 2280, type: WidthType.DXA }, margins: CELL_MARGINS,
          children: [new Paragraph({ children: [new TextRun({ text: "", font: "Source Serif 4", size: 20 })] })],
        }),
      ],
    })
  );

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: colWidths,
    rows,
  });
}

function spacer() {
  return new Paragraph({ spacing: { after: 200 }, children: [] });
}

function fmtEnum(v) {
  return v ? v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).replace(/It /i, "IT ") : "";
}

module.exports = { generateWalkthrough };
