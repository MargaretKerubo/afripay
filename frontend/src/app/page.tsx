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
    </main>
  );
}
