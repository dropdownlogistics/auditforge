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
    images: ["/og-auditforge.svg"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AuditForge — Governed Audit Documentation",
    description: "The audit package generates itself.",
    images: ["/og-auditforge.svg"],
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
