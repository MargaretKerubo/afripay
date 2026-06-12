"use client";

import Link from "next/link";
import { ArrowRight, Bitcoin } from "lucide-react";
import type { PublicStats } from "@/types";

interface Props {
  stats: PublicStats;
}

export default function HeroSection({ stats }: Props) {
  return (
    <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center">
      {/* Orbit illustration */}
      <div className="relative w-64 h-64 md:w-80 md:h-80 mx-auto mb-12 flex items-center justify-center">
        {/* Orbit rings */}
        <div className="absolute inset-0 rounded-full border border-gold-400/10" />
        <div className="absolute inset-8 rounded-full border border-gold-400/15" />
        <div className="absolute inset-16 rounded-full border border-gold-400/25" />

        {/* Central BTC logo */}
        <div className="relative z-10 w-20 h-20 rounded-full bg-gold-400 flex items-center justify-center shadow-[0_0_60px_rgba(247,183,49,0.4)]">
          <Bitcoin size={40} className="text-navy-950" strokeWidth={2.5} />
        </div>

        {/* Orbiting country flag dots */}
        <OrbitDot flag="🇰🇪" delay="0s" radius={96} duration="10s" />
        <OrbitDot flag="🇳🇬" delay="-3.3s" radius={96} duration="10s" />
        <OrbitDot flag="🇿🇦" delay="-6.6s" radius={96} duration="10s" />
        <OrbitDot flag="🇬🇭" delay="-2s" radius={128} duration="14s" reverse />
        <OrbitDot flag="🇪🇹" delay="-7s" radius={128} duration="14s" reverse />
      </div>

      {/* Eyebrow */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-800 border border-gold-400/20 text-xs text-gold-400 font-mono mb-5">
        <span className="w-1.5 h-1.5 rounded-full bg-savanna-400 animate-pulse" />
        Bitcoin-Powered African Remittances
      </div>

      {/* Headline */}
      <h1 className="font-display font-800 text-4xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight max-w-4xl">
        Move Money Across
        <br />
        <span className="text-gold-gradient">Africa</span> in Seconds.
      </h1>

      {/* Subheadline */}
      <p className="mt-6 text-base md:text-xl text-sand-400 max-w-xl leading-relaxed">
        AfriPay uses Bitcoin as the settlement layer — no correspondent banks,
        no 3–7 day waits, no 8% hidden fees. Just fast, borderless value transfer
        for 1.4 billion Africans.
      </p>

      {/* CTAs */}
      <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/register"
          className="group flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-gold-400 text-navy-950 font-semibold text-sm hover:bg-gold-500 transition-all duration-200 shadow-[0_0_30px_rgba(247,183,49,0.3)] hover:shadow-[0_0_40px_rgba(247,183,49,0.5)]"
        >
          Create Free Wallet
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-full border border-sand-400/20 text-sand-200 text-sm hover:border-gold-400/40 hover:text-gold-400 transition-all duration-200"
        >
          Sign In to Wallet
        </Link>
      </div>

      {/* Live stat pills */}
      <div className="mt-14 flex flex-wrap justify-center gap-6 text-center">
        <StatPill value="1%" label="Flat fee" accent="gold" />
        <StatPill value={`${stats.countries_served}`} label="Countries (roadmap)" accent="savanna" />
        <StatPill value="~5 min" label="Average settlement" accent="gold" />
        <StatPill value="3" label="Active Corridors" accent="savanna" />
      </div>
    </section>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatPill({
  value,
  label,
  accent,
}: {
  value: string;
  label: string;
  accent: "gold" | "savanna";
}) {
  const color = accent === "gold" ? "text-gold-gradient" : "text-savanna-gradient";
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`font-display font-700 text-2xl md:text-3xl ${color}`}>
        {value}
      </span>
      <span className="text-xs text-sand-400 uppercase tracking-widest">{label}</span>
    </div>
  );
}

function OrbitDot({
  flag,
  delay,
  radius,
  duration,
  reverse,
}: {
  flag: string;
  delay: string;
  radius: number;
  duration: string;
  reverse?: boolean;
}) {
  return (
    <div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{
        width: radius * 2,
        height: radius * 2,
        animation: `orbit ${duration} linear infinite ${reverse ? "reverse" : ""} ${delay}`,
        animationDelay: delay,
      }}
    >
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-lg"
        style={{ filter: "drop-shadow(0 0 6px rgba(247,183,49,0.5))" }}
      >
        {flag}
      </div>
    </div>
  );
}
