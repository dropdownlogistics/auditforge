"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const C = {
  navy: "#0D1B2A", card: "#10202f", cream: "#F5F1EB",
  crimson: "#B23531", amber: "#C49A3C", steel: "#4a6080",
  green: "#4A9E6B", blue: "#6B9DC2",
  border: "rgba(245,241,235,0.07)",
  borderCrimson: "rgba(178,53,49,0.3)",
};

function GateModal({ onClose }) {
  const router = useRouter();
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(13,27,42,0.85)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(4px)" }}>
      <div style={{ background:C.card, border:"1px solid rgba(178,53,49,0.4)", borderRadius:12, padding:"40px 36px", maxWidth:400, width:"90%", textAlign:"center" }}>
        <svg width="48" height="48" viewBox="0 0 200 200" style={{marginBottom:20}}>
          <circle cx="100" cy="100" r="90" fill="none" stroke="#F5F1EB" strokeWidth="2"/>
          <circle cx="100" cy="100" r="78" fill="#0D1B2A"/>
          <text x="100" y="88" textAnchor="middle" fontFamily="Space Grotesk,sans-serif" fontWeight="900" fontSize="52" fill="#B23531">AF</text>
          <circle cx="30" cy="100" r="2" fill="#C49A3C"/>
          <circle cx="170" cy="100" r="2" fill="#C49A3C"/>
        </svg>
        <h2 style={{fontFamily:"Space Grotesk,sans-serif", fontSize:"1.3rem", fontWeight:700, marginBottom:10, color:C.cream}}>Create an account for full access</h2>
        <p style={{fontFamily:"JetBrains Mono,monospace", fontSize:11, color:C.steel, lineHeight:1.8, marginBottom:28}}>
          This demo shows live DDL audit data.<br/>Sign in to manage your own controls, generate documents, and run your own audit environment.
        </p>
        <button onClick={() => router.push("/sign-in")}
          style={{background:C.crimson, color:C.cream, border:"none", borderRadius:6, padding:"12px 28px", fontFamily:"Space Grotesk,sans-serif", fontWeight:700, fontSize:13, cursor:"pointer", width:"100%", marginBottom:10}}>
          Sign In / Create Account
        </button>
        <button onClick={onClose}
          style={{background:"transparent", color:C.steel, border:"1px solid rgba(245,241,235,0.07)", borderRadius:6, padding:"10px 28px", fontFamily:"JetBrains Mono,monospace", fontSize:11, cursor:"pointer", width:"100%"}}>
          Continue Browsing Demo
        </button>
      </div>
    </div>
  );
}

export default function DemoPage() {
  const [controls, setControls] = useState([]);
  const [risks, setRisks] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGate, setShowGate] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/controls?companyId=CO-DDL").then(r => r.json()),
      fetch("/api/risks?companyId=CO-DDL").then(r => r.json()),
      fetch("/api/processes?companyId=CO-DDL").then(r => r.json()),
    ]).then(([c, r, p]) => {
      setControls(c.controls || []);
      setRisks(r.risks || []);
      setProcesses(p.processes || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const criticalRisks = risks.filter(r => r.inherentRiskRating === "CRITICAL").length;
  const keyControls = controls.filter(c => c.keyControl).length;
  const processAreas = [...new Set(processes.map(p => p.processArea))].length;

  return (
    <div style={{minHeight:"100vh", background:C.navy, fontFamily:"Space Grotesk,sans-serif", color:C.cream}}>
      {showGate && <GateModal onClose={() => setShowGate(false)} />}

      <nav style={{position:"sticky", top:0, zIndex:100, padding:"16px 40px", display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(13,27,42,0.95)", borderBottom:"1px solid rgba(245,241,235,0.07)", backdropFilter:"blur(12px)"}}>
        <div style={{display:"flex", alignItems:"center", gap:10}}>
          <svg width="28" height="28" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="90" fill="none" stroke="#F5F1EB" strokeWidth="2"/>
            <circle cx="100" cy="100" r="78" fill="#0D1B2A"/>
            <text x="100" y="88" textAnchor="middle" fontFamily="Space Grotesk,sans-serif" fontWeight="900" fontSize="52" fill="#B23531">AF</text>
            <circle cx="30" cy="100" r="2" fill="#C49A3C"/>
            <circle cx="170" cy="100" r="2" fill="#C49A3C"/>
          </svg>
          <span style={{fontWeight:700, fontSize:16, letterSpacing:"-0.02em"}}>Audit<span style={{color:C.crimson}}>Forge</span></span>
          <span style={{fontFamily:"JetBrains Mono,monospace", fontSize:10, color:C.steel, background:"rgba(178,53,49,0.1)", border:"1px solid rgba(178,53,49,0.2)", borderRadius:4, padding:"2px 8px", letterSpacing:"0.06em"}}>DEMO</span>
        </div>
        <button onClick={() => setShowGate(true)}
          style={{background:C.crimson, color:C.cream, border:"none", borderRadius:6, padding:"8px 20px", fontWeight:700, fontSize:12, cursor:"pointer", letterSpacing:"0.06em"}}>
          Sign In →
        </button>
      </nav>

      <div style={{maxWidth:1100, margin:"0 auto", padding:"48px 40px 0"}}>
        <div style={{marginBottom:8, fontFamily:"JetBrains Mono,monospace", fontSize:10, color:C.crimson, letterSpacing:"0.15em", textTransform:"uppercase"}}>Live Demo — Dropdown Logistics · FY2025</div>
        <h1 style={{fontSize:"1.8rem", fontWeight:700, letterSpacing:"-0.03em", marginBottom:32}}>AI Governance Control Environment</h1>

        {loading ? (
          <div style={{fontFamily:"JetBrains Mono,monospace", fontSize:12, color:C.steel}}>Loading live data...</div>
        ) : (
          <>
            <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:1, background:C.border, border:"1px solid rgba(245,241,235,0.07)", borderRadius:12, overflow:"hidden", marginBottom:32}}>
              {[
                {label:"Total Controls", val:controls.length, color:C.crimson},
                {label:"Key Controls", val:keyControls, color:C.amber},
                {label:"Critical Risks", val:criticalRisks, color:"#ef4444"},
                {label:"Process Areas", val:processAreas, color:C.blue},
              ].map((s,i) => (
                <div key={i} style={{background:C.card, padding:"24px 20px"}}>
                  <div style={{fontSize:"2rem", fontWeight:700, letterSpacing:"-0.04em", color:s.color, marginBottom:6}}>{s.val}</div>
                  <div style={{fontFamily:"JetBrains Mono,monospace", fontSize:10, color:C.steel, letterSpacing:"0.08em", textTransform:"uppercase"}}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{background:C.card, border:"1px solid rgba(245,241,235,0.07)", borderRadius:10, marginBottom:24, overflow:"hidden"}}>
              <div style={{padding:"16px 20px", borderBottom:"1px solid rgba(245,241,235,0.07)", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                <div style={{fontWeight:600, fontSize:14}}>Controls</div>
                <button onClick={() => setShowGate(true)} style={{background:"transparent", color:C.crimson, border:"1px solid rgba(178,53,49,0.3)", borderRadius:4, padding:"4px 12px", fontFamily:"JetBrains Mono,monospace", fontSize:10, cursor:"pointer"}}>+ Add Control</button>
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%", borderCollapse:"collapse", fontSize:13}}>
                  <thead>
                    <tr style={{borderBottom:"1px solid rgba(245,241,235,0.07)"}}>
                      {["Control ID","Description","Type","Process Area","Status"].map(h => (
                        <th key={h} style={{padding:"10px 16px", textAlign:"left", fontFamily:"JetBrains Mono,monospace", fontSize:10, color:C.steel, letterSpacing:"0.06em", fontWeight:400}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {controls.slice(0,8).map((ctrl,i) => (
                      <tr key={i} style={{borderBottom:"1px solid rgba(245,241,235,0.07)"}}>
                        <td style={{padding:"10px 16px", color:C.crimson, fontFamily:"JetBrains Mono,monospace", fontSize:11}}>{ctrl.controlId}</td>
                        <td style={{padding:"10px 16px", color:C.cream, maxWidth:320}}><div style={{overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{ctrl.description}</div></td>
                        <td style={{padding:"10px 16px"}}><span style={{fontFamily:"JetBrains Mono,monospace", fontSize:10, color:ctrl.controlType==="PREVENTIVE"?C.green:C.amber, background:ctrl.controlType==="PREVENTIVE"?"rgba(74,158,107,0.1)":"rgba(196,154,60,0.1)", padding:"2px 8px", borderRadius:3}}>{ctrl.controlType}</span></td>
                        <td style={{padding:"10px 16px", fontFamily:"JetBrains Mono,monospace", fontSize:11, color:C.steel}}>{ctrl.process?.processArea || "—"}</td>
                        <td style={{padding:"10px 16px"}}><span style={{fontFamily:"JetBrains Mono,monospace", fontSize:10, color:C.amber}}>{ctrl.reviewStatus}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {controls.length > 8 && (
                <div style={{padding:"12px 16px", borderTop:"1px solid rgba(245,241,235,0.07)", fontFamily:"JetBrains Mono,monospace", fontSize:11, color:C.steel, textAlign:"center"}}>
                  +{controls.length - 8} more controls ·{" "}
                  <button onClick={() => setShowGate(true)} style={{background:"none", border:"none", color:C.crimson, cursor:"pointer", fontFamily:"JetBrains Mono,monospace", fontSize:11}}>Sign in to see all</button>
                </div>
              )}
            </div>

            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24}}>
              <div style={{background:C.card, border:"1px solid rgba(245,241,235,0.07)", borderRadius:10, overflow:"hidden"}}>
                <div style={{padding:"14px 20px", borderBottom:"1px solid rgba(245,241,235,0.07)", fontWeight:600, fontSize:14}}>Risk Registry</div>
                {risks.slice(0,5).map((r,i) => (
                  <div key={i} style={{padding:"10px 20px", borderBottom:"1px solid rgba(245,241,235,0.07)", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                    <div>
                      <div style={{fontFamily:"JetBrains Mono,monospace", fontSize:10, color:C.crimson, marginBottom:2}}>{r.riskId}</div>
                      <div style={{fontSize:12, color:C.cream, maxWidth:220, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{r.description}</div>
                    </div>
                    <span style={{fontFamily:"JetBrains Mono,monospace", fontSize:9, padding:"2px 7px", borderRadius:3, background:r.inherentRiskRating==="CRITICAL"?"rgba(239,68,68,0.15)":r.inherentRiskRating==="HIGH"?"rgba(196,154,60,0.15)":"rgba(74,158,107,0.15)", color:r.inherentRiskRating==="CRITICAL"?"#ef4444":r.inherentRiskRating==="HIGH"?C.amber:C.green}}>{r.inherentRiskRating}</span>
                  </div>
                ))}
                <div style={{padding:"10px 20px", fontFamily:"JetBrains Mono,monospace", fontSize:11, color:C.steel, textAlign:"center"}}>
                  <button onClick={() => setShowGate(true)} style={{background:"none", border:"none", color:C.crimson, cursor:"pointer", fontFamily:"JetBrains Mono,monospace", fontSize:11}}>View all {risks.length} risks →</button>
                </div>
              </div>

              <div style={{background:C.card, border:"1px solid rgba(245,241,235,0.07)", borderRadius:10, overflow:"hidden"}}>
                <div style={{padding:"14px 20px", borderBottom:"1px solid rgba(245,241,235,0.07)", fontWeight:600, fontSize:14}}>Process Areas</div>
                {[...new Set(processes.map(p => p.processArea))].map((area,i) => {
                  const ctrlCount = controls.filter(c => c.process?.processArea === area).length;
                  return (
                    <div key={i} style={{padding:"10px 20px", borderBottom:"1px solid rgba(245,241,235,0.07)", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                      <div style={{fontSize:12, color:C.cream}}>{area}</div>
                      <div style={{fontFamily:"JetBrains Mono,monospace", fontSize:10, color:C.steel}}>{ctrlCount} controls</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{background:"rgba(178,53,49,0.06)", border:"1px solid rgba(178,53,49,0.2)", borderRadius:10, padding:"32px", textAlign:"center", marginBottom:48}}>
              <div style={{fontFamily:"JetBrains Mono,monospace", fontSize:10, color:C.crimson, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10}}>This is live DDL data</div>
              <h2 style={{fontSize:"1.4rem", fontWeight:700, letterSpacing:"-0.02em", marginBottom:10}}>Ready to govern your own controls?</h2>
              <p style={{fontFamily:"JetBrains Mono,monospace", fontSize:11, color:C.steel, marginBottom:24, lineHeight:1.8}}>Import your control environment, generate an RCM in seconds, and track your audit progress in a governed star schema.</p>
              <button onClick={() => setShowGate(true)}
                style={{background:C.crimson, color:C.cream, border:"none", borderRadius:6, padding:"13px 32px", fontWeight:700, fontSize:13, cursor:"pointer", letterSpacing:"0.06em"}}>
                Create Your Account →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
