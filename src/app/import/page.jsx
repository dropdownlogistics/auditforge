"use client";

import { useState, useRef, useCallback } from "react";

// ── Schema Fields ─────────────────────────────────────────────────────────────

const SCHEMA_FIELDS = [
  { key: "controlId",            label: "Control ID",              required: true,  hint: "e.g. CTRL-AP-001" },
  { key: "description",          label: "Control Description",     required: true,  hint: "Full control description" },
  { key: "controlType",          label: "Control Type",            required: true,  hint: "PREVENTIVE / DETECTIVE / CORRECTIVE" },
  { key: "controlFrequency",     label: "Frequency",               required: true,  hint: "DAILY / WEEKLY / MONTHLY / QUARTERLY / ANNUAL / AD_HOC" },
  { key: "processArea",          label: "Process Area",            required: true,  hint: "e.g. Context Integrity" },
  { key: "processName",          label: "Process Name",            required: false, hint: "e.g. Context Management" },
  { key: "ownerName",            label: "Owner",                   required: false, hint: "e.g. CSO" },
  { key: "controlObjective",     label: "Control Objective",       required: false, hint: "Optional objective statement" },
  { key: "controlNature",        label: "Nature",                  required: false, hint: "MANUAL / AUTOMATED / IT_DEPENDENT_MANUAL" },
  { key: "keyControl",           label: "Key Control",             required: false, hint: "Yes / No / TRUE / FALSE" },
  { key: "designEffectiveness",  label: "Design Effectiveness",    required: false, hint: "EFFECTIVE / INEFFECTIVE / NOT_TESTED" },
  { key: "operatingEffectiveness", label: "Operating Effectiveness", required: false, hint: "EFFECTIVE / INEFFECTIVE / NOT_TESTED" },
  { key: "riskIds",              label: "Risk IDs",                required: false, hint: "RSK-AP-001, RSK-AP-002 (comma-separated)" },
];

const REQUIRED_KEYS = SCHEMA_FIELDS.filter((f) => f.required).map((f) => f.key);

// ── CSV Parser ────────────────────────────────────────────────────────────────

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim());
  const rows = lines.slice(1).map((line) => {
    const values = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        inQuotes = !inQuotes;
      } else if (line[i] === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += line[i];
      }
    }
    values.push(current.trim());
    return headers.reduce((obj, h, i) => ({ ...obj, [h]: values[i] || "" }), {});
  });
  return { headers, rows };
}

// ── Auto-mapping helper ───────────────────────────────────────────────────────

function autoMap(headers) {
  const mapping = {};
  const normalizedHeaders = headers.map((h) => h.toLowerCase().replace(/[\s_-]/g, ""));
  SCHEMA_FIELDS.forEach((field) => {
    const fieldNorm = field.key.toLowerCase();
    const labelNorm = field.label.toLowerCase().replace(/[\s_-]/g, "");
    const idx = normalizedHeaders.findIndex(
      (h) => h === fieldNorm || h === labelNorm ||
             h.includes(fieldNorm) || fieldNorm.includes(h) ||
             h.includes(labelNorm)
    );
    if (idx !== -1) mapping[field.key] = headers[idx];
  });
  return mapping;
}

// ── Validation ────────────────────────────────────────────────────────────────

const CONTROL_ID_RE = /^[A-Z]{2,8}-[A-Z]{2,8}-\d{3,}$/;
const VALID_TYPES    = ["PREVENTIVE", "DETECTIVE", "CORRECTIVE"];
const VALID_FREQS    = ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL", "AD_HOC"];
const VALID_NATURES  = ["MANUAL", "AUTOMATED", "IT_DEPENDENT_MANUAL"];
const VALID_EFF      = ["EFFECTIVE", "INEFFECTIVE", "NOT_TESTED", "PARTIALLY_EFFECTIVE"];

function validateRow(row, mapping) {
  const errors = [];
  const val = (key) => {
    const col = mapping[key];
    return col ? (row[col] || "").trim().toUpperCase() : "";
  };
  const raw = (key) => {
    const col = mapping[key];
    return col ? (row[col] || "").trim() : "";
  };

  if (!mapping.controlId || !raw("controlId"))
    errors.push("Control ID is required");
  else if (!CONTROL_ID_RE.test(raw("controlId")))
    errors.push(`Control ID "${raw("controlId")}" doesn't match expected pattern (e.g. CTRL-AP-001)`);

  if (!mapping.description || !raw("description"))
    errors.push("Description is required");

  if (!mapping.controlType || !val("controlType"))
    errors.push("Control Type is required");
  else if (!VALID_TYPES.includes(val("controlType")))
    errors.push(`Control Type "${val("controlType")}" must be: ${VALID_TYPES.join(", ")}`);

  if (!mapping.controlFrequency || !val("controlFrequency"))
    errors.push("Frequency is required");
  else if (!VALID_FREQS.includes(val("controlFrequency")))
    errors.push(`Frequency "${val("controlFrequency")}" must be: ${VALID_FREQS.join(", ")}`);

  if (!mapping.processArea || !raw("processArea"))
    errors.push("Process Area is required");

  if (mapping.controlNature && val("controlNature") && !VALID_NATURES.includes(val("controlNature")))
    errors.push(`Nature "${val("controlNature")}" must be: ${VALID_NATURES.join(", ")}`);

  if (mapping.designEffectiveness && val("designEffectiveness") && !VALID_EFF.includes(val("designEffectiveness")))
    errors.push(`Design Effectiveness must be: ${VALID_EFF.join(", ")}`);

  if (mapping.operatingEffectiveness && val("operatingEffectiveness") && !VALID_EFF.includes(val("operatingEffectiveness")))
    errors.push(`Operating Effectiveness must be: ${VALID_EFF.join(", ")}`);

  return errors;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ImportPage() {
  const [step, setStep] = useState(1); // 1=upload 2=map 3=preview 4=done
  const [csvData, setCsvData] = useState(null);
  const [mapping, setMapping] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState(null);
  const [companyId, setCompanyId] = useState("CO-DDL");
  const fileRef = useRef(null);

  // ── Step 1: Upload ──────────────────────────────────────────────────────────

  const handleFile = useCallback((file) => {
    if (!file || !file.name.endsWith(".csv")) {
      alert("Please upload a CSV file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseCSV(e.target.result);
      if (parsed.headers.length === 0) {
        alert("CSV is empty or has no data rows. Add a header row and at least one control.");
        return;
      }
      setCsvData(parsed);
      setMapping(autoMap(parsed.headers));
      setStep(2);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  // ── Step 2: Column Mapping ──────────────────────────────────────────────────

  const setFieldMapping = (fieldKey, csvHeader) => {
    setMapping((prev) => ({ ...prev, [fieldKey]: csvHeader === "__none__" ? undefined : csvHeader }));
  };

  const mappedRequired = REQUIRED_KEYS.filter((k) => mapping[k]);
  const readyToPreview = mappedRequired.length === REQUIRED_KEYS.length;

  // ── Step 3: Preview + Execute ───────────────────────────────────────────────

  const rowErrors = csvData
    ? csvData.rows.map((row) => validateRow(row, mapping))
    : [];
  const validRows  = rowErrors.filter((e) => e.length === 0).length;
  const errorRows  = rowErrors.filter((e) => e.length > 0).length;

  const execute = async () => {
    setExecuting(true);
    try {
      const payload = csvData.rows.map((row) => {
        const get = (key) => {
          const col = mapping[key];
          return col ? (row[col] || "").trim() : "";
        };
        return {
          controlId:              get("controlId"),
          description:            get("description"),
          controlType:            get("controlType").toUpperCase(),
          controlFrequency:       get("controlFrequency").toUpperCase(),
          processArea:            get("processArea"),
          processName:            get("processName"),
          ownerName:              get("ownerName"),
          controlObjective:       get("controlObjective"),
          controlNature:          get("controlNature").toUpperCase() || undefined,
          keyControl:             ["yes","true","1"].includes(get("keyControl").toLowerCase()),
          designEffectiveness:    get("designEffectiveness").toUpperCase() || "NOT_TESTED",
          operatingEffectiveness: get("operatingEffectiveness").toUpperCase() || "NOT_TESTED",
          riskIds:                get("riskIds") ? get("riskIds").split(",").map((r) => r.trim()) : [],
        };
      });

      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, controls: payload, mode: "execute" }),
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

  const reset = () => {
    setStep(1);
    setCsvData(null);
    setMapping({});
    setResult(null);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={styles.page}>

      {/* Back nav */}
      <div style={{ marginBottom: "24px" }}>
        <a href="/" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "#C49A3C", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
          ? AuditForge
        </a>
      </div>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Import Controls</h1>
          <p style={styles.subtitle}>Upload a CSV and map columns to the AuditForge schema</p>
        </div>
        <div style={styles.stepIndicator}>
          {["Upload", "Map", "Preview", "Done"].map((label, i) => (
            <div key={i} style={styles.stepItem}>
              <div style={{
                ...styles.stepDot,
                background: step === i + 1 ? "#C49A3C" :
                            step > i + 1  ? "#4A9E6B" : "#1e3048",
                color: step >= i + 1 ? "#0D1B2A" : "#4a6080",
              }}>
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span style={{ ...styles.stepLabel, color: step === i + 1 ? "#C49A3C" : step > i + 1 ? "#4A9E6B" : "#4a6080" }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Step 1: Upload ── */}
      {step === 1 && (
        <div
          style={{ ...styles.dropZone, ...(isDragging ? styles.dropZoneActive : {}) }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files[0])} />
          <div style={styles.dropIcon}>⬆</div>
          <p style={styles.dropPrimary}>Drop a CSV file here</p>
          <p style={styles.dropSecondary}>or click to browse</p>
          <div style={styles.dropHint}>
            <span style={styles.hintTag}>controlId</span>
            <span style={styles.hintTag}>description</span>
            <span style={styles.hintTag}>controlType</span>
            <span style={styles.hintTag}>frequency</span>
            <span style={styles.hintTag}>processArea</span>
            <span style={{ ...styles.hintTag, opacity: 0.5 }}>+ more</span>
          </div>
        </div>
      )}

      {/* ── Step 2: Column Mapping ── */}
      {step === 2 && csvData && (
        <div>
          <div style={styles.mappingHeader}>
            <div>
              <span style={styles.amber}>{csvData.headers.length} columns detected</span>
              <span style={styles.muted}> · {csvData.rows.length} rows · </span>
              <span style={{ color: readyToPreview ? "#4A9E6B" : "#C49A3C" }}>
                {mappedRequired.length}/{REQUIRED_KEYS.length} required fields mapped
              </span>
            </div>
            <div style={styles.companyRow}>
              <label style={styles.label}>Company ID</label>
              <input
                style={styles.input}
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                placeholder="CO-DDL"
              />
            </div>
          </div>

          <div style={styles.mappingGrid}>
            {SCHEMA_FIELDS.map((field) => (
              <div key={field.key} style={styles.mappingRow}>
                <div style={styles.fieldInfo}>
                  <span style={styles.fieldLabel}>
                    {field.label}
                    {field.required && <span style={styles.required}> *</span>}
                  </span>
                  <span style={styles.fieldHint}>{field.hint}</span>
                </div>
                <div style={styles.arrowCol}>→</div>
                <select
                  style={{
                    ...styles.select,
                    borderColor: field.required && !mapping[field.key] ? "#B23531" :
                                 mapping[field.key] ? "#4A9E6B" : "#1e3048",
                  }}
                  value={mapping[field.key] || "__none__"}
                  onChange={(e) => setFieldMapping(field.key, e.target.value)}
                >
                  <option value="__none__">— not mapped —</option>
                  {csvData.headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                {mapping[field.key] && (
                  <span style={styles.sampleVal}>
                    e.g. {csvData.rows[0]?.[mapping[field.key]] || "—"}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div style={styles.actionRow}>
            <button style={styles.btnSecondary} onClick={reset}>← Back</button>
            <button
              style={{ ...styles.btnPrimary, opacity: readyToPreview ? 1 : 0.4, cursor: readyToPreview ? "pointer" : "not-allowed" }}
              onClick={() => readyToPreview && setStep(3)}
              disabled={!readyToPreview}
            >
              Preview Import →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Preview ── */}
      {step === 3 && csvData && (
        <div>
          <div style={styles.previewStats}>
            <div style={styles.statCard}>
              <div style={styles.statNum}>{csvData.rows.length}</div>
              <div style={styles.statLabel}>Total Rows</div>
            </div>
            <div style={{ ...styles.statCard, borderColor: "#4A9E6B" }}>
              <div style={{ ...styles.statNum, color: "#4A9E6B" }}>{validRows}</div>
              <div style={styles.statLabel}>Valid</div>
            </div>
            <div style={{ ...styles.statCard, borderColor: errorRows > 0 ? "#B23531" : "#1e3048" }}>
              <div style={{ ...styles.statNum, color: errorRows > 0 ? "#B23531" : "#4a6080" }}>{errorRows}</div>
              <div style={styles.statLabel}>Errors</div>
            </div>
          </div>

          {errorRows > 0 && (
            <div style={styles.errorBanner}>
              ⚠ {errorRows} row{errorRows > 1 ? "s" : ""} have validation errors and will be skipped.
              Only valid rows will be imported.
            </div>
          )}

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Control ID</th>
                  <th style={styles.th}>Description</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Frequency</th>
                  <th style={styles.th}>Process Area</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {csvData.rows.map((row, i) => {
                  const errs = rowErrors[i];
                  const hasError = errs.length > 0;
                  const get = (key) => {
                    const col = mapping[key];
                    return col ? (row[col] || "") : "";
                  };
                  return (
                    <tr key={i} style={{ background: hasError ? "rgba(178,53,49,0.08)" : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                      <td style={styles.td}>{i + 1}</td>
                      <td style={{ ...styles.td, fontFamily: "JetBrains Mono, monospace", fontSize: "12px", color: "#C49A3C" }}>
                        {get("controlId") || <span style={{ color: "#B23531" }}>missing</span>}
                      </td>
                      <td style={{ ...styles.td, maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {get("description") || "—"}
                      </td>
                      <td style={styles.td}>{get("controlType") || "—"}</td>
                      <td style={styles.td}>{get("controlFrequency") || "—"}</td>
                      <td style={styles.td}>{get("processArea") || "—"}</td>
                      <td style={styles.td}>
                        {hasError ? (
                          <div title={errs.join("\n")} style={styles.errorBadge}>
                            ✗ {errs.length} error{errs.length > 1 ? "s" : ""}
                          </div>
                        ) : (
                          <div style={styles.validBadge}>✓ Valid</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={styles.actionRow}>
            <button style={styles.btnSecondary} onClick={() => setStep(2)}>← Remap</button>
            <button
              style={{ ...styles.btnPrimary, opacity: executing ? 0.6 : 1 }}
              onClick={execute}
              disabled={executing || validRows === 0}
            >
              {executing ? "Importing..." : `Import ${validRows} Control${validRows !== 1 ? "s" : ""} →`}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Done ── */}
      {step === 4 && result && (
        <div style={styles.donePanel}>
          {result.error ? (
            <>
              <div style={styles.doneIcon}>✗</div>
              <h2 style={{ ...styles.doneTitle, color: "#B23531" }}>Import Failed</h2>
              <p style={styles.doneMsg}>{result.error}</p>
              <button style={styles.btnSecondary} onClick={reset}>Try Again</button>
            </>
          ) : (
            <>
              <div style={{ ...styles.doneIcon, color: "#4A9E6B" }}>✓</div>
              <h2 style={styles.doneTitle}>Import Complete</h2>
              <div style={styles.doneSummary}>
                <div style={styles.doneStatRow}>
                  <span style={styles.muted}>Controls Created</span>
                  <span style={{ color: "#4A9E6B", fontWeight: 700 }}>{result.created ?? "—"}</span>
                </div>
                <div style={styles.doneStatRow}>
                  <span style={styles.muted}>Controls Updated</span>
                  <span style={{ color: "#C49A3C", fontWeight: 700 }}>{result.updated ?? "—"}</span>
                </div>
                <div style={styles.doneStatRow}>
                  <span style={styles.muted}>Skipped (errors)</span>
                  <span style={{ color: "#B23531", fontWeight: 700 }}>{result.skipped ?? "—"}</span>
                </div>
              </div>
              {result.warnings?.length > 0 && (
                <div style={styles.warnList}>
                  {result.warnings.map((w, i) => <div key={i} style={styles.warnItem}>⚠ {w}</div>)}
                </div>
              )}
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <button style={styles.btnSecondary} onClick={reset}>Import More</button>
                <a href="/controls" style={styles.btnPrimary}>View Controls →</a>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = {
  page: {
    background: "#0D1B2A",
    minHeight: "100vh",
    padding: "32px 40px",
    fontFamily: "'Space Grotesk', sans-serif",
    color: "#F5F1EB",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "32px",
    paddingBottom: "24px",
    borderBottom: "1px solid rgba(245,241,235,0.08)",
  },
  title: {
    fontSize: "24px",
    fontWeight: 700,
    margin: 0,
    letterSpacing: "-0.02em",
  },
  subtitle: {
    fontSize: "13px",
    color: "#4a6080",
    margin: "4px 0 0",
    fontFamily: "'JetBrains Mono', monospace",
  },
  stepIndicator: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  stepItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    minWidth: "60px",
  },
  stepDot: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace",
  },
  stepLabel: {
    fontSize: "10px",
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  dropZone: {
    border: "2px dashed rgba(196,154,60,0.3)",
    borderRadius: "12px",
    padding: "64px 40px",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.2s",
    background: "rgba(196,154,60,0.03)",
  },
  dropZoneActive: {
    border: "2px dashed #C49A3C",
    background: "rgba(196,154,60,0.08)",
  },
  dropIcon: {
    fontSize: "40px",
    marginBottom: "16px",
    opacity: 0.6,
  },
  dropPrimary: {
    fontSize: "18px",
    fontWeight: 600,
    margin: "0 0 8px",
  },
  dropSecondary: {
    fontSize: "13px",
    color: "#4a6080",
    margin: "0 0 24px",
  },
  dropHint: {
    display: "flex",
    gap: "8px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  hintTag: {
    background: "#10202f",
    border: "1px solid rgba(245,241,235,0.1)",
    borderRadius: "4px",
    padding: "3px 8px",
    fontSize: "11px",
    fontFamily: "'JetBrains Mono', monospace",
    color: "#C49A3C",
  },
  mappingHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    fontSize: "13px",
  },
  amber: { color: "#C49A3C", fontWeight: 600 },
  muted: { color: "#4a6080" },
  companyRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  label: {
    fontSize: "12px",
    color: "#4a6080",
    fontFamily: "'JetBrains Mono', monospace",
  },
  input: {
    background: "#10202f",
    border: "1px solid rgba(245,241,235,0.12)",
    borderRadius: "6px",
    padding: "6px 12px",
    color: "#F5F1EB",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "12px",
    outline: "none",
    width: "120px",
  },
  mappingGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "24px",
  },
  mappingRow: {
    display: "grid",
    gridTemplateColumns: "260px 24px 240px 1fr",
    alignItems: "center",
    gap: "12px",
    background: "#10202f",
    border: "1px solid rgba(245,241,235,0.06)",
    borderRadius: "8px",
    padding: "12px 16px",
  },
  fieldInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  fieldLabel: {
    fontSize: "13px",
    fontWeight: 600,
  },
  fieldHint: {
    fontSize: "11px",
    color: "#4a6080",
    fontFamily: "'JetBrains Mono', monospace",
  },
  required: {
    color: "#B23531",
  },
  arrowCol: {
    color: "#4a6080",
    textAlign: "center",
  },
  select: {
    background: "#0D1B2A",
    border: "1px solid",
    borderRadius: "6px",
    padding: "7px 12px",
    color: "#F5F1EB",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "12px",
    outline: "none",
    cursor: "pointer",
    width: "100%",
  },
  sampleVal: {
    fontSize: "11px",
    color: "#4a6080",
    fontFamily: "'JetBrains Mono', monospace",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    paddingLeft: "8px",
  },
  actionRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    paddingTop: "24px",
    borderTop: "1px solid rgba(245,241,235,0.08)",
  },
  btnPrimary: {
    background: "#C49A3C",
    color: "#0D1B2A",
    border: "none",
    borderRadius: "8px",
    padding: "10px 24px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'Space Grotesk', sans-serif",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
  },
  btnSecondary: {
    background: "transparent",
    color: "#F5F1EB",
    border: "1px solid rgba(245,241,235,0.2)",
    borderRadius: "8px",
    padding: "10px 24px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'Space Grotesk', sans-serif",
  },
  previewStats: {
    display: "flex",
    gap: "16px",
    marginBottom: "20px",
  },
  statCard: {
    background: "#10202f",
    border: "1px solid rgba(245,241,235,0.08)",
    borderRadius: "10px",
    padding: "16px 24px",
    minWidth: "100px",
    textAlign: "center",
  },
  statNum: {
    fontSize: "28px",
    fontWeight: 700,
    color: "#F5F1EB",
    fontFamily: "'JetBrains Mono', monospace",
  },
  statLabel: {
    fontSize: "11px",
    color: "#4a6080",
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    marginTop: "4px",
  },
  errorBanner: {
    background: "rgba(178,53,49,0.12)",
    border: "1px solid rgba(178,53,49,0.3)",
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "13px",
    color: "#fca5a5",
    marginBottom: "16px",
  },
  tableWrap: {
    border: "1px solid rgba(245,241,235,0.08)",
    borderRadius: "10px",
    overflow: "auto",
    marginBottom: "24px",
    maxHeight: "400px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    background: "#0D1B2A",
    padding: "10px 14px",
    textAlign: "left",
    fontSize: "11px",
    fontWeight: 700,
    color: "#F5F1EB",
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    borderBottom: "1px solid rgba(245,241,235,0.1)",
    position: "sticky",
    top: 0,
    zIndex: 1,
  },
  td: {
    padding: "10px 14px",
    fontSize: "13px",
    color: "#F5F1EB",
    borderBottom: "1px solid rgba(245,241,235,0.05)",
    verticalAlign: "middle",
  },
  errorBadge: {
    background: "rgba(178,53,49,0.2)",
    color: "#fca5a5",
    border: "1px solid rgba(178,53,49,0.4)",
    borderRadius: "5px",
    padding: "3px 8px",
    fontSize: "11px",
    fontFamily: "'JetBrains Mono', monospace",
    cursor: "help",
    whiteSpace: "nowrap",
  },
  validBadge: {
    background: "rgba(74,158,107,0.15)",
    color: "#4A9E6B",
    border: "1px solid rgba(74,158,107,0.3)",
    borderRadius: "5px",
    padding: "3px 8px",
    fontSize: "11px",
    fontFamily: "'JetBrains Mono', monospace",
  },
  donePanel: {
    textAlign: "center",
    padding: "64px 40px",
    background: "#10202f",
    borderRadius: "12px",
    border: "1px solid rgba(245,241,235,0.08)",
  },
  doneIcon: {
    fontSize: "56px",
    color: "#4A9E6B",
    marginBottom: "16px",
  },
  doneTitle: {
    fontSize: "24px",
    fontWeight: 700,
    marginBottom: "24px",
    letterSpacing: "-0.02em",
  },
  doneSummary: {
    display: "inline-flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "28px",
    minWidth: "260px",
    background: "#0D1B2A",
    borderRadius: "10px",
    padding: "20px 28px",
    border: "1px solid rgba(245,241,235,0.08)",
  },
  doneStatRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "14px",
  },
  doneMsg: {
    color: "#4a6080",
    fontSize: "14px",
    marginBottom: "24px",
  },
  warnList: {
    marginBottom: "24px",
    textAlign: "left",
    maxWidth: "480px",
    margin: "0 auto 24px",
  },
  warnItem: {
    background: "rgba(196,154,60,0.08)",
    border: "1px solid rgba(196,154,60,0.2)",
    borderRadius: "6px",
    padding: "8px 12px",
    fontSize: "12px",
    color: "#C49A3C",
    marginBottom: "6px",
    fontFamily: "'JetBrains Mono', monospace",
  },
};


