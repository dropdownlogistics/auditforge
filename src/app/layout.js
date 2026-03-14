import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata = {
  title: "AuditForge — Governed Documentation",
  description: "Structured data in. Governed documents out.",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <ClerkProvider>
      <html lang="en">
      <body>{children}</body>
    </html>
    </ClerkProvider>
    </ClerkProvider>
  );
}
