import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ops Agenda - AI-Powered Daily Operations Brief",
  description:
    "Transform your Microsoft 365 email and calendar into a prioritized daily agenda with AI-powered insights.",
  keywords: ["productivity", "email", "calendar", "AI", "Microsoft 365", "operations"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
