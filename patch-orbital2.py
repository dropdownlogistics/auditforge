content = open('src/app/landing/page.jsx', encoding='utf-8').read()

# Find and replace just the OrbitalHero function
start = content.find('function OrbitalHero()')
end = content.find('\nfunction StatGrid()')
old_orbital = content[start:end]

new_orbital = '''function OrbitalHero() {
  const arms = [
    { label: ["System of", "Structure"], sub: "What AuditForge is", angle: 270, color: C.crimson },
    { label: ["RCM · MCL", "Walkthrough"], sub: "What it generates", angle: 30, color: C.copper },
    { label: ["Star Schema"], sub: "How it's built", angle: 95, color: C.steel },
    { label: ["Governed by", "Council"], sub: "10 seats · 3 verdicts", angle: 185, color: C.steel },
    { label: ["Live Data"], sub: "Your workspace", angle: 220, color: C.copper },
  ];

  const R = 148;
  const cx = 230;
  const cy = 210;

  return (
    <svg viewBox="0 0 500 420" style={{ width: "100%", maxWidth: 500, opacity: 0.93 }}>
      <defs>
        <radialGradient id="orbGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.crimson} stopOpacity="0.12" />
          <stop offset="100%" stopColor={C.navy} stopOpacity="0" />
        </radialGradient>
        <style>{`
          @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes spin-rev  { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
          @keyframes pulse-node { 0%,100% { opacity:0.9; } 50% { opacity:1; } }
          .orb-ring-1 { transform-origin: 230px 210px; animation: spin-slow 18s linear infinite; }
          .orb-ring-2 { transform-origin: 230px 210px; animation: spin-rev 28s linear infinite; }
        `}</style>
      </defs>

      <circle cx={cx} cy={cy} r={R} fill="url(#orbGrad)" />
      <circle className="orb-ring-2" cx={cx} cy={cy} r={R + 22}
        fill="none" stroke="rgba(245,241,235,0.04)" strokeWidth="1" />
      <circle className="orb-ring-1" cx={cx} cy={cy} r={R}
        fill="none" stroke="rgba(196,154,60,0.2)" strokeWidth="1" strokeDasharray="5 10" />

      {arms.map((arm, i) => {
        const rad = (arm.angle * Math.PI) / 180;
        const nx = cx + R * Math.cos(rad);
        const ny = cy + R * Math.sin(rad);
        const isRight = nx > cx;
        const labelX = nx + (isRight ? 12 : -12);
        const anchor = isRight ? "start" : "end";
        const lineCount = arm.label.length;
        const startY = ny - (lineCount * 11 + 8) / 2;

        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={nx} y2={ny}
              stroke={arm.color} strokeWidth="0.75" strokeOpacity="0.45" />
            <circle cx={nx} cy={ny} r="5" fill={arm.color} fillOpacity="0.9"
              style={{ animation: `pulse-node 3s ease-in-out ${i * 0.6}s infinite` }} />
            {arm.label.map((line, li) => (
              <text key={li} x={labelX} y={startY + li * 11 + 9}
                textAnchor={anchor} fill={C.cream} fontSize="9"
                fontFamily="'Space Grotesk', sans-serif" fontWeight="600">
                {line}
              </text>
            ))}
            <text x={labelX} y={startY + lineCount * 11 + 10}
              textAnchor={anchor} fill={C.steel} fontSize="7.5"
              fontFamily="'JetBrains Mono', monospace">
              {arm.sub}
            </text>
          </g>
        );
      })}

      <circle cx={cx} cy={cy} r="48" fill={C.crimson} />
      <circle cx={cx} cy={cy} r="44" fill="none" stroke="rgba(245,241,235,0.2)" strokeWidth="1" />
      <text x={cx} y={cy - 6} textAnchor="middle"
        fill={C.cream} fontSize="22" fontFamily="'Space Grotesk', sans-serif" fontWeight="800" letterSpacing="1">
        AF
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle"
        fill="rgba(245,241,235,0.5)" fontSize="6.5" fontFamily="'JetBrains Mono', monospace" letterSpacing="2">
        AUDITFORGE
      </text>
    </svg>
  );
}

'''

result = content[:start] + new_orbital + content[end:]
print('patched:', 'spin-slow' in result)
print('orbital found:', start > 0)
open('src/app/landing/page.jsx', 'w', encoding='utf-8').write(result)
print('done')
