"use client";

import Link from "next/link";
import { ArrowRight, Zap, Shield, Check } from "lucide-react";

export default function CTASection() {
  return (
    <section id="cta" className="relative z-10 py-32 px-6">
      {/* Background neon glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full filter blur-[120px] opacity-10"
        style={{
          background: "radial-gradient(circle, var(--accent-primary), var(--accent-secondary))",
        }}
      />

      <div className="max-w-4xl mx-auto text-center relative">
        {/* Counter Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-elevated border border-border text-xs text-accent-secondary font-mono mb-8 animate-pulse-cyan">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-secondary shrink-0" />
          East African Beta Network is 100% Live
        </div>

        <h2 className="font-display font-800 text-4xl md:text-6xl leading-[1.15] text-white tracking-tight">
          Ready to experience
          <br />
          <span className="gradient-text">borderless payments?</span>
        </h2>

        <p className="mt-6 text-text-secondary text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          Create your free non-custodial wallet in under 2 minutes. Start cashing out instantly 
          to mobile money (M-Pesa, MTN, Airtel) across Kenya, Uganda, and Tanzania.
        </p>

        {/* Buttons */}
        <div className="mt-12 flex flex-col sm:flex-row gap-5 justify-center items-center">
          <Link
            href="/register"
            className="group btn-primary w-full sm:w-auto px-8 py-4 text-base flex items-center justify-center gap-2"
          >
            Create Free Wallet
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="btn-secondary w-full sm:w-auto px-8 py-4 text-base flex items-center justify-center gap-2"
          >
            Sign In to Wallet
          </Link>
        </div>

        {/* Feature checklist */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto border-t border-border pt-12 text-left">
          {[
            { title: "No KYC/Waitlist", desc: "Start transacting instantly" },
            { title: "Escrow Protection", desc: "Trade securely with anyone" },
            { title: "Real-time FX Rates", desc: "CoinGecko powered live feeds" },
          ].map((item, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-5 h-5 rounded-full bg-accent-secondary/15 flex items-center justify-center shrink-0 mt-0.5 text-accent-secondary">
                <Check size={12} strokeWidth={3} />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-text-primary">{item.title}</h4>
                <p className="text-xs text-text-secondary mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
