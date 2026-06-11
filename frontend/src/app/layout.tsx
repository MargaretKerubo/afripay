import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AfriPay — Bitcoin Payments for East Africa",
  description:
    "Send, receive, and exchange Bitcoin via Lightning Network across Kenya, Uganda, and Tanzania. Fast, borderless, and non-custodial.",
  keywords: ["Bitcoin", "Lightning Network", "East Africa", "KES", "UGX", "TZS", "payments"],
  openGraph: {
    title: "AfriPay — Bitcoin Payments for East Africa",
    description: "Fast, borderless Bitcoin payments across East Africa.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
