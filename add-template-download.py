content = open('src/app/import/page.jsx', 'r', encoding='utf-8').read()

# Add template download function after the ENTITY_TYPES definition
template_fn = '''
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

'''

# Insert before the main component
content = content.replace(
    '// ── Main Component ────────────────────────────────────────────────────────────',
    template_fn + '// ── Main Component ────────────────────────────────────────────────────────────'
)

# Add Download Template button to the drop zone section
old_drop = '''          <p style={S.dropSecondary}>or click to browse</p>
          <div style={S.dropHint}>'''

new_drop = '''          <p style={S.dropSecondary}>or click to browse</p>
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
          <div style={S.dropHint}>'''

content = content.replace(old_drop, new_drop, 1)

open('src/app/import/page.jsx', 'w', encoding='utf-8').write(content)
print('done:', 'downloadTemplate' in content)
