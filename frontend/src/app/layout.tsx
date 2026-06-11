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