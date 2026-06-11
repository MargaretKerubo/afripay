import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AfriPay — Cross-Border Bitcoin Payments for Africa",
  description:
    "Send money across Africa in seconds with Bitcoin. 1% flat fee. No banks. No borders.",
  openGraph: {
    title: "AfriPay",
    description: "Cross-border Bitcoin payments built for Africa",
    siteName: "AfriPay",
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
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-navy-950 text-sand-100 font-body antialiased">
        {children}
      </body>
    </html>
  );
}
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
