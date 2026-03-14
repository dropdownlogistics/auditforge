"use client";
import { useRouter } from "next/navigation";

export default function ComingSoon() {
  const router = useRouter();
  return (
    <div style={{
      minHeight: "100vh", background: "#0D1B2A",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'Space Grotesk', sans-serif",
    }}>
      <svg width="64" height="64" viewBox="0 0 200 200" style={{marginBottom: 32}}>
        <circle cx="100" cy="100" r="90" fill="none" stroke="#F5F1EB" strokeWidth="2"/>
        <circle cx="100" cy="100" r="78" fill="#0D1B2A"/>
        <text x="100" y="88" textAnchor="middle" fontFamily="Space Grotesk,sans-serif" fontWeight="900" fontSize="52" fill="#9B111E">AF</text>
        <circle cx="30" cy="100" r="2" fill="#C49A3C"/>
        <circle cx="170" cy="100" r="2" fill="#C49A3C"/>
      </svg>
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"#4a6080",letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:16}}>Auth coming soon</div>
      <h1 style={{fontSize:"2rem",fontWeight:700,letterSpacing:"-0.03em",marginBottom:12,color:"#F5F1EB"}}>AuditForge</h1>
      <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:"#4a6080",marginBottom:40,textAlign:"center",maxWidth:360,lineHeight:1.8}}>
        Sign-in is being configured.<br/>The forge is still hot.
      </p>
      <button onClick={() => router.push("/landing")}
        style={{background:"transparent",color:"#4a6080",fontFamily:"'JetBrains Mono',monospace",fontSize:11,border:"1px solid rgba(245,241,235,0.1)",borderRadius:6,padding:"10px 20px",cursor:"pointer",letterSpacing:"0.06em"}}>
        ← Back to landing
      </button>
    </div>
  );
}
