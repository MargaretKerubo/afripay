import { TrendingDown, Clock, AlertCircle, DollarSign } from "lucide-react";
import type { PublicStats } from "@/types";

interface Props {
  stats: PublicStats;
}

export default function ProblemSection({ stats }: Props) {
  const problems = [
    {
      icon: DollarSign,
      stat: `${stats.traditional_fee_pct}%`,
      label: "Average remittance fee",
      detail:
        "World Bank data: sending $200 across African borders costs an average of $17. That's money leaving the continent.",
      source: "World Bank, 2024",
    },
    {
      icon: Clock,
      stat: "3–7 days",
      label: "Bank transfer settlement",
      detail:
        "Correspondent banking chains add days of float. Your family waits while the bank holds your money interest-free.",
      source: "SWIFT, 2023",
    },
    {
      icon: AlertCircle,
      stat: "57%",
      label: "Adults without bank accounts",
      detail:
        "Over half of sub-Saharan Africa is unbanked — excluded from the global financial system by design.",
      source: "World Bank Global Findex, 2021",
    },
    {
      icon: TrendingDown,
      stat: "$48B",
      label: "Fees lost annually",
      detail:
        "Africa pays more per dollar remitted than any other region. The system was not designed for Africans.",
      source: "Statista, 2023",
    },
  ];

  return (
    <section id="problem" className="relative z-10 py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="max-w-2xl mb-16">
          <p className="text-xs text-gold-400 font-mono uppercase tracking-widest mb-3">
            The problem
          </p>
          <h2 className="font-display font-700 text-3xl md:text-5xl leading-tight text-sand-100">
            The system was built to extract, not to serve.
          </h2>
          <p className="mt-4 text-sand-400 text-base md:text-lg leading-relaxed">
            Moving money within Africa costs more than anywhere else in the world.
            Banks, MTOs, and exchange bureaus skim billions every year from
            workers sending money home to their families.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {problems.map((p) => (
            <div key={p.stat} className="glass-card rounded-2xl p-6 flex flex-col gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <p.icon size={20} className="text-red-400" />
              </div>
              <div>
                <div className="font-display font-700 text-3xl text-sand-100">{p.stat}</div>
                <div className="text-xs text-sand-400 uppercase tracking-wide mt-0.5">
                  {p.label}
                </div>
              </div>
              <p className="text-sm text-sand-400 leading-relaxed flex-1">{p.detail}</p>
              <p className="text-xs text-sand-600 font-mono">{p.source}</p>
            </div>
          ))}
        </div>

        {/* Pull quote */}
        <blockquote className="mt-14 max-w-3xl mx-auto text-center">
          <p className="text-xl md:text-2xl text-sand-200 font-display font-500 leading-relaxed italic">
            &ldquo;Africa loses more money to remittance fees each year than it receives
            in foreign aid. That&apos;s not a statistic — that&apos;s a scandal.&rdquo;
          </p>
          <cite className="block mt-3 text-sm text-sand-600 not-italic">
            — AfriPay Founding Team
          </cite>
        </blockquote>
      </div>
    </section>
  );
}
