// Standalone-only. When embedding into an existing site, skip this file — your own layout is used.
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
export const metadata: Metadata = { title: "Certificate verification", robots: { index: false } };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body style={{ margin: 0, background: "#0a0a0a" }}>{children}</body>
    </html>
  );
}
