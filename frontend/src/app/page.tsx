// app/page.tsx – AfriPay Landing Page (Server Component)
// Fetches public stats at build/request time and passes them down.

import { getPublicStats } from "@/lib/api";
import type { PublicStats } from "@/types";

import Navbar from "@/components/sections/Navbar";
import HeroSection from "@/components/sections/HeroSection";
import ProblemSection from "@/components/sections/ProblemSection";
import SolutionSection from "@/components/sections/SolutionSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";
import CorridorsSection from "@/components/sections/CorridorsSection";
import CTASection from "@/components/sections/CTASection";
import Footer from "@/components/sections/Footer";

export default async function Home() {
  // Stats fetched server-side; falls back gracefully if backend is down
  const stats: PublicStats | null = await getPublicStats().catch(() => null);

  const defaultStats: PublicStats = {
    waitlist_count: 0,
    countries_served: 54,
    avg_fee_pct: 1.0,
    traditional_fee_pct: 8.5,
  };

  const resolvedStats = stats ?? defaultStats;

  return (
    <main className="relative overflow-x-hidden">
      {/* Ambient background blobs */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(22,36,80,0.8) 0%, #050A18 60%)",
        }}
      />

      <Navbar />
      <HeroSection stats={resolvedStats} />

      <hr className="section-divider mx-8 md:mx-24" />
      <ProblemSection stats={resolvedStats} />

      <hr className="section-divider mx-8 md:mx-24" />
      <SolutionSection />

      <hr className="section-divider mx-8 md:mx-24" />
      <FeaturesSection />

      <hr className="section-divider mx-8 md:mx-24" />
      <HowItWorksSection />

      <hr className="section-divider mx-8 md:mx-24" />
      <CorridorsSection />

      <CTASection waitlistCount={resolvedStats.waitlist_count} />
      <Footer />
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
           style={{ background: "rgba(10,15,30,0.8)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          {/* Bitcoin-inspired logo mark */}
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
               style={{ background: "linear-gradient(135deg, var(--accent-primary), #e07d0a)" }}>
            ₿
          </div>
          <span className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>AfriPay</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-secondary" style={{ padding: "0.5rem 1.25rem", fontSize: "0.875rem" }}>
            Sign In
          </Link>
          <Link href="/register" className="btn-primary" style={{ padding: "0.5rem 1.25rem", fontSize: "0.875rem" }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center"
               style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 50% 0%, rgba(247,147,26,0.12) 0%, transparent 60%), var(--background)" }}>
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-sm font-medium"
             style={{ background: "rgba(247,147,26,0.1)", border: "1px solid rgba(247,147,26,0.25)", color: "var(--accent-primary)" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          Lightning Network Powered
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-none mb-6"
            style={{ color: "var(--text-primary)", maxWidth: "800px" }}>
          Bitcoin Payments
          <br />
          <span className="gradient-text">for East Africa</span>
        </h1>

        <p className="text-lg sm:text-xl mb-10" style={{ color: "var(--text-secondary)", maxWidth: "560px", lineHeight: "1.7" }}>
          Send and receive money across Kenya, Uganda, and Tanzania
          instantly — in KES, UGX, or TZS — without banks or borders.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register" id="hero-cta-register" className="btn-primary" style={{ padding: "0.9rem 2rem", fontSize: "1rem" }}>
            Create Free Wallet →
          </Link>
          <Link href="/login" id="hero-cta-login" className="btn-secondary" style={{ padding: "0.9rem 2rem", fontSize: "1rem" }}>
            Sign In
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-20 w-full" style={{ maxWidth: "520px" }}>
          {[
            { value: "< 1s", label: "Settlement time" },
            { value: "3", label: "Currencies" },
            { value: "0%", label: "Custody" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <span className="text-3xl font-bold gradient-text">{stat.value}</span>
              <span className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-6 py-20" style={{ background: "var(--surface)" }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4" style={{ color: "var(--text-primary)" }}>
            Built for traders across the region
          </h2>
          <p className="text-center mb-14" style={{ color: "var(--text-secondary)" }}>
            Everything you need for fast, trustless cross-border payments
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: "⚡",
                title: "Lightning Fast",
                desc: "Payments settle in under a second via the Lightning Network — no waiting for blockchain confirmations.",
              },
              {
                icon: "🔒",
                title: "Escrow Protection",
                desc: "Trade safely with built-in escrow. A trusted arbitrator resolves disputes — no single point of failure.",
              },
              {
                icon: "💱",
                title: "Live FX Rates",
                desc: "Real-time Bitcoin → KES / UGX / TZS conversion powered by CoinGecko, refreshed every 10 minutes.",
              },
              {
                icon: "🌍",
                title: "East Africa First",
                desc: "Designed for the realities of the Kenyan, Ugandan, and Tanzanian markets.",
              },
              {
                icon: "🔑",
                title: "Non-Custodial",
                desc: "Your keys, your coins. AfriPay connects to your own Lightning node via Polar or a hosted LND instance.",
              },
              {
                icon: "🛠",
                title: "Developer Friendly",
                desc: "Open API, local Polar dev setup, and Docker-ready infrastructure for rapid iteration.",
              },
            ].map((feature) => (
              <div key={feature.title} className="glass-card p-6 flex flex-col gap-3">
                <span className="text-3xl">{feature.icon}</span>
                <h3 className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 py-8 text-center text-sm" style={{ color: "var(--text-muted)", borderTop: "1px solid var(--border)" }}>
        <p>© {new Date().getFullYear()} AfriPay. Open source Bitcoin infrastructure for East Africa.</p>
      </footer>
    </main>
  );
}
