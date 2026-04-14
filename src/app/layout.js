import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata = {
  metadataBase: new URL("https://auditforge.dev"),
  title: "AuditForge — Governed Documentation",
  description: "Structured data in. Governed documents out.",
  openGraph: {
    title: "AuditForge — Governed Audit Documentation",
    description: "The audit package generates itself. Controls, risks, and processes become governed RCMs, MCLs, and walkthroughs in seconds from a live star schema.",
    url: "https://auditforge.dev",
    siteName: "AuditForge",
    images: [{ url: "/og-auditforge.svg", width: 1200, height: 630, alt: "AuditForge" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AuditForge — Governed Audit Documentation",
    description: "The audit package generates itself.",
    images: ["/og-auditforge.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
