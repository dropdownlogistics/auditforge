import "./globals.css";

export const metadata = {
  title: "AuditForge — Governed Documentation",
  description: "Structured data in. Governed documents out.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
