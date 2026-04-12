// WorkBench route layout — exists solely to export metadata
// (page.jsx is a client component and cannot export metadata)

export const metadata = {
  title: "WorkBench — Build the Stack Your Business Actually Needs",
  description: "A modular small business operating system from the team that built AuditForge. Pick what fits. Leave what doesn't.",
  openGraph: {
    title: "WorkBench — Modular Business OS",
    description: "Pick what fits. Leave what doesn't. Every module connects from day one.",
  },
};

export default function WorkBenchLayout({ children }) {
  return children;
}
