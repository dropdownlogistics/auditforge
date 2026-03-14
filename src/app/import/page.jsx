"use client";

import { useState, useRef, useCallback } from "react";

// ── Schema Definitions ────────────────────────────────────────────────────────

const ENTITY_TYPES = {
  controls: {
    label: "Controls",
    icon: "⬡",
    color: "#6B9DC2",
    apiEndpoint: "/api/import",
    fields: [
      { key: "controlId",              label: "Control ID",              required: true,  hint: "e.g. CTRL-AP-001" },
      { key: "description",            label: "Control Description",     required: true,  hint: "Full control description" },
      { key: "controlType",            label: "Control Type",            required: true,  hint: "PREVENTIVE / DETECTIVE / CORRECTIVE" },
      { key: "controlFrequency",       label: "Frequency",               required: true,  hint: "DAILY / WEEKLY / MONTHLY / QUARTERLY / ANNUAL / AD_HOC" },
      { key: "processArea",            label: "Process Area",            required: true,  hint: "e.g. Context Integrity" },
      { key: "processName",            label: "Process Name",            required: false, hint: "e.g. Context Management" },
      { key: "ownerName",              label: "Owner",                   required: false, hint: "e.g. CSO" },
      { key: "controlNature",          label: "Nature",                  required: false, hint: "MANUAL / AUTOMATED / IT_DEPENDENT_MANUAL" },
      { key: "keyControl",             label: "Key Control",             required: false, hint: "Yes / No / TRUE / FALSE" },
      { key: "designEffectiveness",    label: "Design Effectiveness",    required: false, hint: "EFFECTIVE / INEFFECTIVE / NOT_TESTED" },
      { key: "operatingEffectiveness", label: "Operating Effectiveness", required: false, hint: "EFFECTIVE / INEFFECTIVE / NOT_TESTED" },
      { key: "riskIds",                label: "Risk IDs",                required: false, hint: "RSK-AP-001, RSK-AP-002 (comma-separated)" },
    ],
  },
  risks: {
    label: "Risks",
    icon: "△",
    color: "#B23531",
    apiEndpoint: "/api/import/risks",
    fields: [
      { key: "riskId",             label: "Risk ID",              required: true,  hint: "e.g. RSK-AP-001" },
      { key: "description",        label: "Risk Description",     required: true,  hint: "Full risk description" },
      { key: "category",           label: "Category",             required: false, hint: "OPERATIONAL / FINANCIAL / COMPLIANCE / STRATEGIC / TECHNOLOGY" },
      { key: "likelihood",         label: "Likelihood",           required: false, hint: "CRITICAL / HIGH / MEDIUM / LOW" },
      { key: "impact",             label: "Impact",               required: false, hint: "CRITICAL / HIGH / MEDIUM / LOW" },
      { key: "inherentRiskRating", label: "Inherent Risk Rating", required: false, hint: "CRITICAL / HIGH / MEDIUM / LOW" },
      { key: "residualRiskRating", label: "Residual Risk Rating", required: false, hint: "CRITICAL / HIGH / MEDIUM / LOW" },
      { key: "riskResponse",       label: "Risk Response",        required: false, hint: "Mitigate / Accept / Transfer / Avoid" },
    ],
  },
  processes: {
    label: "Processes",
    icon: "◫",
    color: "#4A9E6B",
    apiEndpoint: "/api/import/processes",
    fields: [
      { key: "processId",      label: "Process ID",      required: true,  hint: "e.g. PROC-001" },
      { key: "processArea",    label: "Process Area",    required: true,  hint: "e.g. Accounts Payable" },
      { key: "processName",    label: "Process Name",    required: true,  hint: "e.g. Invoice Processing" },
      { key: "subprocessName", label: "Subprocess Name", required: false, hint: "e.g. Three-Way Match" },
      { key: "processOwner",   label: "Process Owner",   required: false, hint: "e.g. CFO" },
      { key: "description",    label: "Description",     required: false, hint: "Process description" },
    ],
  },
};

// ── CSV Parser ────────────────────────────────────────────────────────────────

function parseCSV(text) {
  const clean = text.replace(/^\uFEFF/, "").trim();
  const lines = clean.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const firstLine = lines[0];
  const delimiter = firstLine.includes("\t") ? "\t" : firstLine.includes(";") ? ";" : ",";
  const headers = firstLine.split(delimiter).map((h) => h.replace(/^"|"$/g, "").trim());
  const rows = lines.slice(1).map((line) => {
    const values = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQuotes = !inQuotes; }
      else if (line[i] === delimiter && !inQuotes) { values.push(current.trim()); current = ""; }
      else { current += line[i]; }
    }
    values.push(current.trim());
    return headers.reduce((obj, h, i) => ({ ...obj, [h]: values[i] || "" }), {});
  });
  return { headers, rows };
}

// ── Auto-mapper ───────────────────────────────────────────────────────────────

function autoMap(headers, fields) {
  const mapping = {};
  const norm = (s) => s.toLowerCase().replace(/[\s_-]/g, "");
  const normHeaders = headers.map(norm);
  fields.forEach((field) => {
    const fk = norm(field.key);
    const fl = norm(field.label);
    const idx = normHeaders.findIndex((h) => h === fk || h === fl || h.includes(fk) || fk.includes(h));
    if (idx !== -1) mapping[field.key] = headers[idx];
  });
  return mapping;
}

// ── Row validator ─────────────────────────────────────────────────────────────

const RISK_ID_RE    = /^[A-Z]{2,8}-[A-Z]{2,8}-\d{3,}$/;
const CTRL_ID_RE    = /^[A-Z]{2,8}-[A-Z]{2,8}-\d{3,}$/;
const PROC_ID_RE    = /^[A-Z]{2,8}-\d{3,}$/;
const VALID_RATINGS = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const VALID_CATS    = ["OPERATIONAL", "FINANCIAL", "COMPLIANCE", "STRATEGIC", "TECHNOLOGY"];
const VALID_TYPES   = ["PREVENTIVE", "DETECTIVE", "CORRECTIVE"];
const VALID_FREQS   = ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL", "AD_HOC"];

function validateRow(row, mapping, entityType) {
  const errors = [];
  const raw = (key) => { const col = mapping[key]; return col ? (row[col] || "").trim() : ""; };
  const up  = (key) => raw(key).toUpperCase();

  if (entityType === "controls") {
    if (!raw("controlId")) errors.push("Control ID required");
    else if (!CTRL_ID_RE.test(raw("controlId"))) errors.push(`Control ID format invalid`);
    if (!raw("description")) errors.push("Description required");
    if (!up("controlType")) errors.push("Control Type required");
    else if (!VALID_TYPES.includes(up("controlType"))) errors.push(`Type must be: ${VALID_TYPES.join(", ")}`);
    if (!up("controlFrequency")) errors.push("Frequency required");
    else if (!VALID_FREQS.includes(up("controlFrequency"))) errors.push(`Frequency must be: ${VALID_FREQS.join(", ")}`);
    if (!raw("processArea")) errors.push("Process Area required");
  }

  if (entityType === "risks") {
    if (!raw("riskId")) errors.push("Risk ID required");
    else if (!RISK_ID_RE.test(raw("riskId"))) errors.push(`Risk ID format invalid (e.g. RSK-AP-001)`);
    if (!raw("description")) errors.push("Description required");
    if (raw("inherentRiskRating") && !VALID_RATINGS.includes(up("inherentRiskRating")))
      errors.push(`Rating must be: ${VALID_RATINGS.join(", ")}`);
    if (raw("category") && !VALID_CATS.includes(up("category")))
      errors.push(`Category must be: ${VALID_CATS.join(", ")}`);
  }

  if (entityType === "processes") {
    if (!raw("processId")) errors.push("Process ID required");
    if (!raw("processArea")) errors.push("Process Area required");
    if (!raw("processName")) errors.push("Process Name required");
  }

  return errors;
}


// ── Template Downloads ────────────────────────────────────────────────────────

const TEMPLATES = {
  controls: {
    filename: "auditforge-controls-template.csv",
    content: `controlId,description,controlType,controlFrequency,processArea,processName,ownerName,controlNature,keyControl,designEffectiveness,operatingEffectiveness,riskIds
CTRL-AP-001,All vendor invoices are matched to approved purchase orders before payment is authorized. Three-way match required for invoices over $5000.,PREVENTIVE,MONTHLY,Accounts Payable,Invoice Processing,CFO,MANUAL,Yes,NOT_TESTED,NOT_TESTED,RSK-AP-001
CTRL-IT-001,System access rights are reviewed quarterly by department managers. Terminated employees are removed within 24 hours.,DETECTIVE,QUARTERLY,IT Security,Access Management,CTO,IT_DEPENDENT_MANUAL,Yes,NOT_TESTED,NOT_TESTED,RSK-IT-001`,
  },
  risks: {
    filename: "auditforge-risks-template.csv",
    content: `riskId,description,category,likelihood,impact,inherentRiskRating,residualRiskRating,riskResponse
RSK-AP-001,Invoices are paid without matching purchase orders allowing unauthorized or duplicate payments.,FINANCIAL,MEDIUM,HIGH,HIGH,MEDIUM,Mitigate
RSK-IT-001,Unauthorized users retain system access after termination creating data integrity and security exposure.,COMPLIANCE,LOW,HIGH,HIGH,LOW,Mitigate`,
  },
  processes: {
    filename: "auditforge-processes-template.csv",
    content: `processId,processArea,processName,subprocessName,processOwner,description
PROC-001,Accounts Payable,Invoice Processing,Three-Way Match,CFO,End-to-end processing of vendor invoices from receipt through payment authorization and disbursement.
PROC-002,IT Security,Access Management,User Provisioning,CTO,Management of user access rights including provisioning review and termination across all systems.`,
  },
};

function downloadTemplate(entityType) {
  const tmpl = TEMPLATES[entityType];
  if (!tmpl) return;
  const blob = new Blob([tmpl.content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = tmpl.filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ImportPage() {
  const [entityType, setEntityType] = useState("controls");
  const [step, setStep]             = useState(1);
  const [csvData, setCsvData]       = useState(null);
  const [mapping, setMapping]       = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [executing, setExecuting]   = useState(false);
  const [result, setResult]         = useState(null);
  const [companyId, setCompanyId]   = useState("CO-DDL");
  const fileRef = useRef(null);

  const config       = ENTITY_TYPES[entityType];
  const fields       = config.fields;
  const requiredKeys = fields.filter((f) => f.required).map((f) => f.key);

  // Reset when entity type changes
  const switchType = (type) => {
    setEntityType(type);
    setStep(1);
    setCsvData(null);
    setMapping({});
    setResult(null);
  };

  const handleFile = useCallback((file) => {
    if (!file || !file.name.endsWith(".csv")) { alert("Please upload a CSV file."); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseCSV(e.target.result);
      if (parsed.headers.length === 0) {
        alert("CSV is empty or has no data rows. Add a header row and at least one record.");
        return;
      }
      setCsvData(parsed);
      setMapping(autoMap(parsed.headers, fields));
      setStep(2);
    };
    reader.readAsText(file);
  }, [fields]);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const setFieldMapping = (key, val) =>
    setMapping((prev) => ({ ...prev, [key]: val === "__none__" ? undefined : val }));

  const mappedRequired  = requiredKeys.filter((k) => mapping[k]);
  const readyToPreview  = mappedRequired.length === requiredKeys.length;

  const rowErrors = csvData
    ? csvData.rows.map((row) => validateRow(row, mapping, entityType))
    : [];
  const validRows  = rowErrors.filter((e) => e.length === 0).length;
  const errorRows  = rowErrors.filter((e) => e.length > 0).length;

  const execute = async () => {
    setExecuting(true);
    try {
      const raw = (row, key) => { const col = mapping[key]; return col ? (row[col] || "").trim() : ""; };
      const up  = (row, key) => raw(row, key).toUpperCase();

      let payload;
      if (entityType === "controls") {
        payload = csvData.rows.map((row) => ({
          controlId:              raw(row, "controlId"),
          description:            raw(row, "description"),
          controlType:            up(row, "controlType"),
          controlFrequency:       up(row, "controlFrequency"),
          processArea:            raw(row, "processArea"),
          processName:            raw(row, "processName") || undefined,
          ownerName:              raw(row, "ownerName") || undefined,
          controlNature:          up(row, "controlNature") || undefined,
          keyControl:             ["yes","true","1"].includes(raw(row, "keyControl").toLowerCase()),
          designEffectiveness:    up(row, "designEffectiveness") || "NOT_TESTED",
          operatingEffectiveness: up(row, "operatingEffectiveness") || "NOT_TESTED",
          riskIds:                raw(row, "riskIds") ? raw(row, "riskIds").split(",").map((r) => r.trim()) : [],
        }));
      } else if (entityType === "risks") {
        payload = csvData.rows.map((row) => ({
          riskId:             raw(row, "riskId"),
          description:        raw(row, "description"),
          category:           up(row, "category") || "OPERATIONAL",
          likelihood:         up(row, "likelihood") || "MEDIUM",
          impact:             up(row, "impact") || "MEDIUM",
          inherentRiskRating: up(row, "inherentRiskRating") || "MEDIUM",
          residualRiskRating: up(row, "residualRiskRating") || undefined,
          riskResponse:       raw(row, "riskResponse") || undefined,
        }));
      } else {
        payload = csvData.rows.map((row) => ({
          processId:      raw(row, "processId"),
          processArea:    raw(row, "processArea"),
          processName:    raw(row, "processName"),
          subprocessName: raw(row, "subprocessName") || undefined,
          processOwner:   raw(row, "processOwner") || undefined,
          description:    raw(row, "description") || undefined,
        }));
      }

      const res = await fetch(config.apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, [entityType]: payload, mode: "execute" }),
      });
      const data = await res.json();
      setResult(data);
      setStep(4);
    } catch (err) {
      setResult({ error: err.message });
      setStep(4);
    } finally {
      setExecuting(false);
    }
  };

  const reset = () => { setStep(1); setCsvData(null); setMapping({}); setResult(null); };

  // Preview table columns by entity type
  const previewCols = {
    controls:  ["controlId", "controlType", "controlFrequency", "processArea"],
    risks:     ["riskId", "inherentRiskRating", "category"],
    processes: ["processId", "processArea", "processName"],
  }[entityType];

  return (
    <div style={S.page}>
      {/* Back */}
      <div style={{ marginBottom: 24 }}>
        <a href="/" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#C49A3C", textDecoration: "none" }}>
          ← AuditForge
        </a>
      </div>

      {/* Header */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Import Data</h1>
          <p style={S.subtitle}>Upload a CSV and map columns to the AuditForge schema</p>
        </div>
        <div style={S.stepIndicator}>
          {["Upload", "Map", "Preview", "Done"].map((label, i) => (
            <div key={i} style={S.stepItem}>
              <div style={{ ...S.stepDot, background: step === i+1 ? "#C49A3C" : step > i+1 ? "#4A9E6B" : "#1e3048", color: step >= i+1 ? "#0D1B2A" : "#4a6080" }}>
                {step > i+1 ? "✓" : i+1}
              </div>
              <span style={{ ...S.stepLabel, color: step === i+1 ? "#C49A3C" : step > i+1 ? "#4A9E6B" : "#4a6080" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Entity type selector */}
      <div style={S.typeSelector}>
        {Object.entries(ENTITY_TYPES).map(([key, cfg]) => (
          <div
            key={key}
            onClick={() => switchType(key)}
            style={{
              ...S.typeBtn,
              borderColor: entityType === key ? cfg.color : "rgba(245,241,235,0.08)",
              background:  entityType === key ? `${cfg.color}15` : "transparent",
              color:       entityType === key ? cfg.color : "#4a6080",
            }}
          >
            <span style={{ fontSize: 16 }}>{cfg.icon}</span>
            {cfg.label}
          </div>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <label style={S.label}>Company ID</label>
          <input style={S.input} value={companyId} onChange={(e) => setCompanyId(e.target.value)} placeholder="CO-DDL" />
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div
          style={{ ...S.dropZone, ...(isDragging ? S.dropZoneActive : {}) }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
          <div style={S.dropIcon}>⬆</div>
          <p style={S.dropPrimary}>Drop a {config.label} CSV here</p>
          <p style={S.dropSecondary}>or click to browse</p>
          <div style={{ marginBottom: 20 }}>
            <button
              onClick={(e) => { e.stopPropagation(); downloadTemplate(entityType); }}
              style={{
                background: "transparent",
                border: "1px solid rgba(196,154,60,0.4)",
                borderRadius: 6,
                padding: "6px 14px",
                color: "#C49A3C",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              ↓ Download Template CSV
            </button>
          </div>
          <div style={S.dropHint}>
            {fields.filter((f) => f.required).map((f) => (
              <span key={f.key} style={{ ...S.hintTag, borderColor: config.color, color: config.color }}>{f.key}</span>
            ))}
            <span style={{ ...S.hintTag, opacity: 0.4 }}>+ optional fields</span>
          </div>
        </div>
      )}

      {/* Step 2: Map */}
      {step === 2 && csvData && (
        <div>
          <div style={S.mappingHeader}>
            <span style={{ color: config.color, fontWeight: 600 }}>{csvData.headers.length} columns</span>
            <span style={{ color: "#4a6080" }}> · {csvData.rows.length} rows · </span>
            <span style={{ color: readyToPreview ? "#4A9E6B" : "#C49A3C" }}>
              {mappedRequired.length}/{requiredKeys.length} required mapped
            </span>
          </div>
          <div style={S.mappingGrid}>
            {fields.map((field) => (
              <div key={field.key} style={S.mappingRow}>
                <div style={S.fieldInfo}>
                  <span style={S.fieldLabel}>{field.label}{field.required && <span style={{ color: "#B23531" }}> *</span>}</span>
                  <span style={S.fieldHint}>{field.hint}</span>
                </div>
                <div style={{ color: "#4a6080", textAlign: "center" }}>→</div>
                <select
                  style={{ ...S.select, borderColor: field.required && !mapping[field.key] ? "#B23531" : mapping[field.key] ? "#4A9E6B" : "#1e3048" }}
                  value={mapping[field.key] || "__none__"}
                  onChange={(e) => setFieldMapping(field.key, e.target.value)}
                >
                  <option value="__none__">— not mapped —</option>
                  {csvData.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
                {mapping[field.key] && (
                  <span style={S.sampleVal}>e.g. {csvData.rows[0]?.[mapping[field.key]] || "—"}</span>
                )}
              </div>
            ))}
          </div>
          <div style={S.actionRow}>
            <button style={S.btnSecondary} onClick={reset}>← Back</button>
            <button
              style={{ ...S.btnPrimary, background: config.color, opacity: readyToPreview ? 1 : 0.4, cursor: readyToPreview ? "pointer" : "not-allowed" }}
              onClick={() => readyToPreview && setStep(3)}
              disabled={!readyToPreview}
            >Preview Import →</button>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 3 && csvData && (
        <div>
          <div style={S.previewStats}>
            <div style={S.statCard}><div style={S.statNum}>{csvData.rows.length}</div><div style={S.statLabel}>Total</div></div>
            <div style={{ ...S.statCard, borderColor: "#4A9E6B" }}><div style={{ ...S.statNum, color: "#4A9E6B" }}>{validRows}</div><div style={S.statLabel}>Valid</div></div>
            <div style={{ ...S.statCard, borderColor: errorRows > 0 ? "#B23531" : "#1e3048" }}><div style={{ ...S.statNum, color: errorRows > 0 ? "#B23531" : "#4a6080" }}>{errorRows}</div><div style={S.statLabel}>Errors</div></div>
          </div>
          {errorRows > 0 && <div style={S.errorBanner}>⚠ {errorRows} row{errorRows > 1 ? "s" : ""} have errors and will be skipped.</div>}
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>#</th>
                  {previewCols.map((c) => <th key={c} style={S.th}>{c}</th>)}
                  <th style={S.th}>Description</th>
                  <th style={S.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {csvData.rows.map((row, i) => {
                  const errs   = rowErrors[i];
                  const hasErr = errs.length > 0;
                  const get    = (key) => { const col = mapping[key]; return col ? (row[col] || "") : ""; };
                  return (
                    <tr key={i} style={{ background: hasErr ? "rgba(178,53,49,0.08)" : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                      <td style={S.td}>{i + 1}</td>
                      {previewCols.map((c) => (
                        <td key={c} style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: config.color }}>{get(c) || "—"}</td>
                      ))}
                      <td style={{ ...S.td, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{get("description") || "—"}</td>
                      <td style={S.td}>
                        {hasErr
                          ? <div title={errs.join("\n")} style={S.errorBadge}>✗ {errs.length} error{errs.length > 1 ? "s" : ""}</div>
                          : <div style={S.validBadge}>✓ Valid</div>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={S.actionRow}>
            <button style={S.btnSecondary} onClick={() => setStep(2)}>← Remap</button>
            <button
              style={{ ...S.btnPrimary, background: config.color, opacity: executing ? 0.6 : 1 }}
              onClick={execute}
              disabled={executing || validRows === 0}
            >
              {executing ? "Importing..." : `Import ${validRows} ${config.label} →`}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Done */}
      {step === 4 && result && (
        <div style={S.donePanel}>
          {result.error ? (
            <>
              <div style={{ fontSize: 56, color: "#B23531", marginBottom: 16 }}>✗</div>
              <h2 style={{ ...S.doneTitle, color: "#B23531" }}>Import Failed</h2>
              <p style={S.doneMsg}>{result.error}</p>
              <button style={S.btnSecondary} onClick={reset}>Try Again</button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 56, color: "#4A9E6B", marginBottom: 16 }}>✓</div>
              <h2 style={S.doneTitle}>Import Complete</h2>
              <div style={S.doneSummary}>
                <div style={S.doneStatRow}><span style={{ color: "#4a6080" }}>Created</span><span style={{ color: "#4A9E6B", fontWeight: 700 }}>{result.created ?? "—"}</span></div>
                <div style={S.doneStatRow}><span style={{ color: "#4a6080" }}>Updated</span><span style={{ color: "#C49A3C", fontWeight: 700 }}>{result.updated ?? "—"}</span></div>
                <div style={S.doneStatRow}><span style={{ color: "#4a6080" }}>Skipped</span><span style={{ color: "#B23531", fontWeight: 700 }}>{result.skipped ?? "—"}</span></div>
              </div>
              {result.warnings?.length > 0 && (
                <div style={S.warnList}>
                  {result.warnings.slice(0, 5).map((w, i) => <div key={i} style={S.warnItem}>⚠ {w}</div>)}
                  {result.warnings.length > 5 && <div style={S.warnItem}>+ {result.warnings.length - 5} more</div>}
                </div>
              )}
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button style={S.btnSecondary} onClick={reset}>Import More</button>
                <a href="/" style={{ ...S.btnPrimary, background: config.color }}>View {config.label} →</a>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S = {
  page:         { background: "#0D1B2A", minHeight: "100vh", padding: "32px 40px", fontFamily: "'Space Grotesk', sans-serif", color: "#F5F1EB" },
  header:       { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid rgba(245,241,235,0.08)" },
  title:        { fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" },
  subtitle:     { fontSize: 13, color: "#4a6080", margin: "4px 0 0", fontFamily: "'JetBrains Mono', monospace" },
  stepIndicator:{ display: "flex", gap: 8, alignItems: "center" },
  stepItem:     { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 60 },
  stepDot:      { width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" },
  stepLabel:    { fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em", textTransform: "uppercase" },
  typeSelector: { display: "flex", gap: 8, marginBottom: 28, alignItems: "center", flexWrap: "wrap" },
  typeBtn:      { display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 8, border: "1px solid", cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, transition: "all 0.15s" },
  dropZone:     { border: "2px dashed rgba(196,154,60,0.3)", borderRadius: 12, padding: "64px 40px", textAlign: "center", cursor: "pointer", background: "rgba(196,154,60,0.03)" },
  dropZoneActive:{ border: "2px dashed #C49A3C", background: "rgba(196,154,60,0.08)" },
  dropIcon:     { fontSize: 40, marginBottom: 16, opacity: 0.6 },
  dropPrimary:  { fontSize: 18, fontWeight: 600, margin: "0 0 8px" },
  dropSecondary:{ fontSize: 13, color: "#4a6080", margin: "0 0 24px" },
  dropHint:     { display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" },
  hintTag:      { background: "#10202f", border: "1px solid", borderRadius: 4, padding: "3px 8px", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" },
  mappingHeader:{ fontSize: 13, marginBottom: 16 },
  mappingGrid:  { display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 },
  mappingRow:   { display: "grid", gridTemplateColumns: "260px 24px 240px 1fr", alignItems: "center", gap: 12, background: "#10202f", border: "1px solid rgba(245,241,235,0.06)", borderRadius: 8, padding: "12px 16px" },
  fieldInfo:    { display: "flex", flexDirection: "column", gap: 2 },
  fieldLabel:   { fontSize: 13, fontWeight: 600 },
  fieldHint:    { fontSize: 11, color: "#4a6080", fontFamily: "'JetBrains Mono', monospace" },
  select:       { background: "#0D1B2A", border: "1px solid", borderRadius: 6, padding: "7px 12px", color: "#F5F1EB", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, outline: "none", cursor: "pointer", width: "100%" },
  sampleVal:    { fontSize: 11, color: "#4a6080", fontFamily: "'JetBrains Mono', monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingLeft: 8 },
  label:        { fontSize: 12, color: "#4a6080", fontFamily: "'JetBrains Mono', monospace" },
  input:        { background: "#10202f", border: "1px solid rgba(245,241,235,0.12)", borderRadius: 6, padding: "6px 12px", color: "#F5F1EB", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, outline: "none", width: 120 },
  actionRow:    { display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 24, borderTop: "1px solid rgba(245,241,235,0.08)" },
  btnPrimary:   { background: "#C49A3C", color: "#0D1B2A", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", textDecoration: "none", display: "inline-flex", alignItems: "center" },
  btnSecondary: { background: "transparent", color: "#F5F1EB", border: "1px solid rgba(245,241,235,0.2)", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif" },
  previewStats: { display: "flex", gap: 16, marginBottom: 20 },
  statCard:     { background: "#10202f", border: "1px solid rgba(245,241,235,0.08)", borderRadius: 10, padding: "16px 24px", minWidth: 100, textAlign: "center" },
  statNum:      { fontSize: 28, fontWeight: 700, color: "#F5F1EB", fontFamily: "'JetBrains Mono', monospace" },
  statLabel:    { fontSize: 11, color: "#4a6080", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em", textTransform: "uppercase", marginTop: 4 },
  errorBanner:  { background: "rgba(178,53,49,0.12)", border: "1px solid rgba(178,53,49,0.3)", borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "#fca5a5", marginBottom: 16 },
  tableWrap:    { border: "1px solid rgba(245,241,235,0.08)", borderRadius: 10, overflow: "auto", marginBottom: 24, maxHeight: 400 },
  table:        { width: "100%", borderCollapse: "collapse" },
  th:           { background: "#0D1B2A", padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#F5F1EB", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em", textTransform: "uppercase", borderBottom: "1px solid rgba(245,241,235,0.1)", position: "sticky", top: 0 },
  td:           { padding: "10px 14px", fontSize: 13, color: "#F5F1EB", borderBottom: "1px solid rgba(245,241,235,0.05)", verticalAlign: "middle" },
  errorBadge:   { background: "rgba(178,53,49,0.2)", color: "#fca5a5", border: "1px solid rgba(178,53,49,0.4)", borderRadius: 5, padding: "3px 8px", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", cursor: "help", whiteSpace: "nowrap" },
  validBadge:   { background: "rgba(74,158,107,0.15)", color: "#4A9E6B", border: "1px solid rgba(74,158,107,0.3)", borderRadius: 5, padding: "3px 8px", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" },
  donePanel:    { textAlign: "center", padding: "64px 40px", background: "#10202f", borderRadius: 12, border: "1px solid rgba(245,241,235,0.08)" },
  doneTitle:    { fontSize: 24, fontWeight: 700, marginBottom: 24, letterSpacing: "-0.02em" },
  doneSummary:  { display: "inline-flex", flexDirection: "column", gap: 12, marginBottom: 28, minWidth: 260, background: "#0D1B2A", borderRadius: 10, padding: "20px 28px", border: "1px solid rgba(245,241,235,0.08)" },
  doneStatRow:  { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14 },
  doneMsg:      { color: "#4a6080", fontSize: 14, marginBottom: 24 },
  warnList:     { marginBottom: 24, textAlign: "left", maxWidth: 480, margin: "0 auto 24px" },
  warnItem:     { background: "rgba(196,154,60,0.08)", border: "1px solid rgba(196,154,60,0.2)", borderRadius: 6, padding: "8px 12px", fontSize: 12, color: "#C49A3C", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" },
};
