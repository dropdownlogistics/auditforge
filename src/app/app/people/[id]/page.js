'use client';
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

// ── CottageHumble Tokens ──
const C = {
  navy: "#0D1B2A", card: "#10202f", cream: "#F5F1EB", copper: "#C49A3C",
  crimson: "#B23531", green: "#4A9E6B", blue: "#6B9DC2", slate: "#4A5568",
  steel: "#6B7B8D", border: "rgba(245,241,235,0.06)", borderLight: "rgba(245,241,235,0.04)",
  violet: "#8a6cc9",
};

const ROLE_BG = { PARTNER: "#FECACA", DIRECTOR: "#FED7AA", MANAGER: "#DBEAFE", SENIOR: "#D1FAE5", STAFF: "#E5E7EB" };
const AUDIT_BG = { PLANNING: "#DBEAFE", FIELDWORK: "#FEF3C7", REPORTING: "#E0E7FF", COMPLETED: "#D1FAE5", CANCELLED: "#FECACA" };

function Badge({ children, bg }) {
  return <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 500, background: bg || "#F3F4F6", color: "#0D1B2A" }}>{children}</span>;
}

function fmtEnum(v) { return v ? v.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : ""; }

export default function PersonalDashboard() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedAudit, setExpandedAudit] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/employees/${params.id}/dashboard`);
        if (!res.ok) throw new Error("Not found");
        setData(await res.json());
      } catch (e) { console.error("Dashboard load failed:", e); }
      setLoading(false);
    }
    load();
  }, [params.id]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.navy, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.steel }}>Loading dashboard...</div>
    </div>
  );

  if (!data) return (
    <div style={{ minHeight: "100vh", background: C.navy, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.crimson }}>Employee not found</div>
    </div>
  );

  const { employee, profile, dimRole, dimStatus, audits, scope, timeEntries, tokens, compChanges } = data;
  const name = employee.firstName && employee.lastName ? `${employee.firstName} ${employee.lastName}` : employee.auditorName;
  const yearsAtFirm = employee.hireDate ? Math.floor((Date.now() - new Date(employee.hireDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;
  const totalHours = timeEntries.reduce((s, t) => s + t.hours, 0);
  const initials = (employee.firstName?.[0] || "") + (employee.lastName?.[0] || employee.auditorName?.[0] || "");

  // Process area breakdown from scope
  const byArea = {};
  for (const s of scope) {
    const area = s.control?.process?.processArea || "Unassigned";
    byArea[area] = (byArea[area] || 0) + 1;
  }
  const areaEntries = Object.entries(byArea).sort((a, b) => b[1] - a[1]);

  // Engagement role breakdown
  let leadCount = 0, teamCount = 0;
  for (const a of audits) {
    if (a.audit.leadAuditorId === employee.id) leadCount++;
    else teamCount++;
  }

  // Token profile
  const strTokens = tokens.filter(t => t.token?.polarity === "STRENGTH").sort((a, b) => b.score - a.score);
  const gapTokens = tokens.filter(t => t.token?.polarity === "GAP").sort((a, b) => b.score - a.score);
  const maxScore = Math.max(1, ...tokens.map(t => t.score));

  // Heatmap data — last 2 years of time entries by week
  const heatmapData = buildHeatmap(timeEntries);

  // This week in history
  const historyItems = buildThisWeekHistory(audits);

  return (
    <div style={{ minHeight: "100vh", background: C.navy, fontFamily: "'Source Serif 4', serif" }}>
      {/* Back button */}
      <div style={{ padding: "16px 32px", borderBottom: `1px solid ${C.border}` }}>
        <button
          onClick={() => router.push("/app")}
          style={{
            background: "none", border: "none", color: C.steel, cursor: "pointer",
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11, padding: 0,
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          <span style={{ fontSize: 14 }}>&larr;</span> People
        </button>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 32px 64px" }}>

        {/* ═══ SECTION 1 — IDENTITY HEADER ═══ */}
        <div style={{ padding: "48px 0", display: "flex", gap: 28, alignItems: "center", position: "relative" }}>
          {/* Lockup — top right */}
          <div style={{ position: "absolute", top: 48, right: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, textAlign: "right" }}>
            AuditForge · Dropdown Logistics
          </div>
          {/* Photo / Monogram */}
          {profile?.photoUrl ? (
            <img
              src={profile.photoUrl}
              alt={name}
              style={{
                width: 120, height: 120, borderRadius: "50%",
                border: `2.5px solid ${C.crimson}`, objectFit: "cover",
              }}
            />
          ) : (
            <div style={{
              width: 120, height: 120, borderRadius: "50%",
              border: `2.5px solid ${C.crimson}`,
              background: C.crimson, display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Space Grotesk', sans-serif", fontSize: 40, fontWeight: 700, color: C.cream,
            }}>
              {initials}
            </div>
          )}
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 34, fontWeight: 700, color: C.cream, lineHeight: 1.15 }}>
              {name}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, marginTop: 8, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <span>{employee.auditorId}</span>
              {dimRole && <Badge bg={ROLE_BG[dimRole.label] || "#E5E7EB"}>{dimRole.label}</Badge>}
              {profile?.independence && <Badge bg="#DBEAFE">{profile.independence}</Badge>}
              {employee.hireDate && (
                <span>
                  Hired {new Date(employee.hireDate).toLocaleDateString()} {yearsAtFirm !== null && yearsAtFirm > 0 ? `· ${yearsAtFirm}y` : yearsAtFirm === 0 ? "· <1y" : ""}
                </span>
              )}
            </div>
            {employee.title && (
              <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 14, color: C.steel, marginTop: 8 }}>{employee.title}</div>
            )}
            {employee.certifications && (
              <div style={{ marginTop: 10 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, padding: "3px 10px", borderRadius: 4, background: "rgba(196,154,60,0.15)", color: C.copper, fontWeight: 600 }}>
                  {employee.certifications}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ═══ SECTION 2 — STATS STRIP ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
          {[
            { label: "ENGAGEMENTS", value: audits.length },
            { label: "CONTROLS SCOPED", value: scope.length },
            { label: "HOURS LOGGED", value: Math.round(totalHours * 10) / 10 },
            { label: "YEARS AT FIRM", value: yearsAtFirm ?? "—" },
          ].map(s => (
            <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "28px 24px" }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 36, fontWeight: 700, color: C.copper }}>{s.value}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, letterSpacing: "0.05em", marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ═══ SECTION 3 — ENGAGEMENT DENSITY HEATMAP ═══ */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "24px 28px", marginBottom: 32 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>
            Engagement Activity
          </div>
          {heatmapData.maxHours === 0 ? (
            <div style={{ padding: "32px 0", textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.steel }}>No activity recorded</div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 2, overflow: "hidden" }}>
                {/* Day labels */}
                <div style={{ display: "flex", flexDirection: "column", gap: 2, marginRight: 4, paddingTop: 14 }}>
                  {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
                    <div key={i} style={{ height: 11, fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: C.steel, lineHeight: "11px" }}>{d}</div>
                  ))}
                </div>
                {/* Weeks */}
                <div style={{ display: "flex", gap: 2, flex: 1, overflow: "hidden" }}>
                  {heatmapData.weeks.map((week, wi) => (
                    <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {/* Month label on first week of month */}
                      <div style={{ height: 12, fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: C.steel }}>
                        {week.monthLabel || ""}
                      </div>
                      {week.days.map((day, di) => (
                        <div
                          key={di}
                          title={day.date ? `${day.date}: ${day.hours.toFixed(1)}h` : ""}
                          style={{
                            width: 11, height: 11, borderRadius: 2,
                            background: day.hours === 0
                              ? "rgba(245,241,235,0.04)"
                              : `rgba(196,154,60,${0.15 + (day.hours / heatmapData.maxHours) * 0.85})`,
                          }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 12, justifyContent: "flex-end" }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: C.steel }}>Less</span>
                {[0.04, 0.2, 0.4, 0.65, 1].map((opacity, i) => (
                  <div key={i} style={{ width: 11, height: 11, borderRadius: 2, background: i === 0 ? "rgba(245,241,235,0.04)" : `rgba(196,154,60,${opacity})` }} />
                ))}
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: C.steel }}>More</span>
              </div>
            </>
          )}
        </div>

        {/* ═══ SECTION 4 — BREAKDOWN CARDS ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 32 }}>
          {/* By Process Area */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px 24px" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>By Process Area</div>
            {areaEntries.length === 0 ? (
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel }}>No scope data</div>
            ) : areaEntries.map(([area, count]) => (
              <div key={area} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: 11, color: C.cream }}>{area}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.copper }}>{count}</span>
                </div>
                <div style={{ height: 4, background: "rgba(245,241,235,0.06)", borderRadius: 2 }}>
                  <div style={{ height: 4, background: C.blue, borderRadius: 2, width: `${(count / (areaEntries[0]?.[1] || 1)) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* By Engagement Role */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px 24px" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>By Engagement Role</div>
            {audits.length === 0 ? (
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel }}>No engagements</div>
            ) : (
              <>
                {[
                  { label: "Lead Auditor", count: leadCount, color: C.copper },
                  { label: "Team Member", count: teamCount, color: C.blue },
                ].map(r => (
                  <div key={r.label} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: 11, color: C.cream }}>{r.label}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.copper }}>{r.count}</span>
                    </div>
                    <div style={{ height: 4, background: "rgba(245,241,235,0.06)", borderRadius: 2 }}>
                      <div style={{ height: 4, background: r.color, borderRadius: 2, width: `${(r.count / audits.length) * 100}%` }} />
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 16, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel }}>
                  {audits.length} total engagements
                </div>
              </>
            )}
          </div>

          {/* Token Profile */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px 24px" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>Token Profile</div>
            {tokens.length === 0 ? (
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel }}>No assessments</div>
            ) : (
              <>
                {strTokens.map(t => (
                  <div key={t.id} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, minWidth: 52 }}>{t.token.code}</span>
                      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, color: C.cream, flex: 1 }}>{t.token.name}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.copper }}>{t.score}</span>
                    </div>
                    <div style={{ height: 3, background: "rgba(245,241,235,0.06)", borderRadius: 2, marginLeft: 60 }}>
                      <div style={{ height: 3, background: C.green, borderRadius: 2, width: `${(t.score / maxScore) * 100}%` }} />
                    </div>
                  </div>
                ))}
                {gapTokens.map(t => (
                  <div key={t.id} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, minWidth: 52 }}>{t.token.code}</span>
                      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, color: C.cream, flex: 1 }}>{t.token.name}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.copper }}>{t.score}</span>
                    </div>
                    <div style={{ height: 3, background: "rgba(245,241,235,0.06)", borderRadius: 2, marginLeft: 60 }}>
                      <div style={{ height: 3, background: C.crimson, borderRadius: 2, width: `${(t.score / maxScore) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* ═══ SECTION 5 — ENGAGEMENT COLLECTION ═══ */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>
            Engagements · {audits.length}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {audits.map(a => {
              const audit = a.audit;
              const isLead = audit.leadAuditorId === employee.id;
              const expanded = expandedAudit === audit.auditId;
              const processAreas = [...new Set(audit.controlScope?.map(s => s.control?.process?.processArea).filter(Boolean))];
              const tierBadge = audit.status === "COMPLETED"
                ? { label: "Verified", bg: "#D1FAE5" }
                : audit.status === "REPORTING"
                ? { label: "In Progress", bg: "#FEF3C7" }
                : { label: "Upcoming", bg: "#DBEAFE" };

              const STATUS_ACCENT = { COMPLETED: C.crimson, REPORTING: C.copper, FIELDWORK: C.blue, PLANNING: C.steel, CANCELLED: C.steel };

              return (
                <div
                  key={audit.auditId}
                  onClick={() => setExpandedAudit(expanded ? null : audit.auditId)}
                  style={{
                    background: C.card, border: `1px solid ${C.border}`, borderRadius: 8,
                    padding: "20px 24px", cursor: "pointer",
                    borderLeft: `3px solid ${STATUS_ACCENT[audit.status] || C.steel}`,
                    transition: "background 120ms ease",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(245,241,235,0.03)"}
                  onMouseLeave={e => e.currentTarget.style.background = C.card}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 600, color: C.cream }}>
                      {audit.auditName}
                    </div>
                    <Badge bg={tierBadge.bg}>{tierBadge.label}</Badge>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                    <Badge bg={AUDIT_BG[audit.status] || "#E5E7EB"}>{audit.status}</Badge>
                    <Badge bg={isLead ? "rgba(196,154,60,0.2)" : "rgba(107,157,194,0.2)"}>
                      <span style={{ color: isLead ? C.copper : C.blue }}>{isLead ? "Lead" : "Team"}</span>
                    </Badge>
                  </div>
                  {audit.startDate && (
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel, marginBottom: 6 }}>
                      {new Date(audit.startDate).toLocaleDateString()} — {audit.endDate ? new Date(audit.endDate).toLocaleDateString() : "ongoing"}
                    </div>
                  )}
                  {processAreas.length > 0 && (
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel }}>
                      {processAreas.slice(0, 3).join(" · ")}{processAreas.length > 3 ? ` +${processAreas.length - 3}` : ""}
                    </div>
                  )}

                  {/* Expanded detail */}
                  {expanded && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, letterSpacing: "0.1em", marginBottom: 8 }}>CONTROLS IN SCOPE</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.cream, marginBottom: 12 }}>
                        {audit.controlScope?.length || 0} controls
                      </div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, letterSpacing: "0.1em", marginBottom: 8 }}>HOURS LOGGED</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.copper, marginBottom: 12 }}>
                        {Math.round(timeEntries.filter(t => t.engagementId === audit.id).reduce((s, t) => s + t.hours, 0) * 10) / 10}h
                      </div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, letterSpacing: "0.1em", marginBottom: 8 }}>TEAM</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {audit.team?.map(t => (
                          <Badge key={t.id} bg="rgba(245,241,235,0.08)">
                            <span style={{ color: C.cream }}>
                              {t.auditor.firstName ? `${t.auditor.firstName} ${t.auditor.lastName?.[0] || ""}.` : t.auditor.auditorName}
                            </span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {audits.length === 0 && (
              <div style={{ gridColumn: "1 / -1", padding: 32, textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.steel }}>
                No engagements on record
              </div>
            )}
          </div>
        </div>

        {/* ═══ SECTION 6 — THIS WEEK IN YOUR HISTORY ═══ */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "24px 28px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.steel, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>
            This Week in Your History
          </div>
          {historyItems.length === 0 ? (
            <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 12, color: C.steel, fontStyle: "italic" }}>
              No history for this week yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {historyItems.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{
                    minWidth: 56, fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                    fontWeight: 700, color: C.copper, textAlign: "right",
                  }}>
                    {item.yearsAgo} YR{item.yearsAgo !== 1 ? "S" : ""}
                  </div>
                  <div style={{ width: 1, background: C.border, minHeight: 32 }} />
                  <div>
                    <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 12, color: C.cream }}>{item.auditName}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.steel }}>
                      {item.event} · {new Date(item.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Heatmap builder ──
function buildHeatmap(timeEntries) {
  const now = new Date();
  const twoYearsAgo = new Date(now);
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  // Group hours by date string
  const byDate = {};
  for (const t of timeEntries) {
    const d = new Date(t.date).toISOString().slice(0, 10);
    byDate[d] = (byDate[d] || 0) + t.hours;
  }

  let maxHours = 0;
  const weeks = [];
  const cursor = new Date(twoYearsAgo);
  // Align to Sunday
  cursor.setDate(cursor.getDate() - cursor.getDay());

  let lastMonth = -1;
  while (cursor <= now) {
    const days = [];
    let monthLabel = "";
    for (let d = 0; d < 7; d++) {
      const dateStr = cursor.toISOString().slice(0, 10);
      const hours = byDate[dateStr] || 0;
      if (hours > maxHours) maxHours = hours;
      // Month label on first day of month
      if (cursor.getMonth() !== lastMonth && cursor.getDate() <= 7) {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        monthLabel = months[cursor.getMonth()];
        lastMonth = cursor.getMonth();
      }
      days.push({ date: dateStr, hours });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push({ days, monthLabel });
  }

  return { weeks, maxHours };
}

// ── Anniversary engine ──
function buildThisWeekHistory(audits) {
  const now = new Date();
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekEnd.getDate() + 7);

  const thisMonth = now.getMonth();
  const thisDay = now.getDate();
  const items = [];

  for (const a of audits) {
    const audit = a.audit;
    for (const [event, dateField] of [["Started", audit.startDate], ["Completed", audit.endDate]]) {
      if (!dateField) continue;
      const d = new Date(dateField);
      const yearsAgo = now.getFullYear() - d.getFullYear();
      if (yearsAgo < 1) continue;
      // Same week of year check (within 7 days of anniversary)
      const anniversary = new Date(d);
      anniversary.setFullYear(now.getFullYear());
      const diff = Math.abs(anniversary - now) / (1000 * 60 * 60 * 24);
      if (diff <= 7) {
        items.push({ yearsAgo, auditName: audit.auditName, event, date: dateField });
      }
    }
  }

  return items.sort((a, b) => b.yearsAgo - a.yearsAgo);
}
