import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BootSequence from "@/components/BootSequence";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Zylose — Cybersecurity Monitoring Platform",
  description: "AI-powered cybersecurity monitoring and threat detection platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased bg-[#05070D] text-[#E2E8F0]`}>
        <BootSequence>{children}</BootSequence>
      </body>
    </html>
  );
}
