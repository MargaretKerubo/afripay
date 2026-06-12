import { ArrowRight, Bitcoin, Wallet, Smartphone } from "lucide-react";

export default function SolutionSection() {
  return (
    <section id="solution" className="relative z-10 py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="max-w-2xl mb-16">
          <p className="text-xs text-savanna-400 font-mono uppercase tracking-widest mb-3">
            The solution
          </p>
          <h2 className="font-display font-700 text-3xl md:text-5xl leading-tight text-sand-100">
            Bitcoin as the African settlement layer.
          </h2>
          <p className="mt-4 text-sand-400 text-base md:text-lg leading-relaxed">
            AfriPay converts local currency → BTC → local currency at the destination.
            The Bitcoin network does the heavy lifting: permissionless, borderless,
            and always-on — unlike correspondent banks.
          </p>
        </div>

        {/* Flow diagram */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0 mb-16">
          <FlowStep
            icon={Smartphone}
            label="Sender"
            sublabel="Nairobi, KE"
            flag="🇰🇪"
            color="gold"
          />
          <FlowArrow label="KES → BTC" />
          <FlowMid />
          <FlowArrow label="BTC → UGX" />
          <FlowStep
            icon={Wallet}
            label="Recipient"
            sublabel="Kampala, UG"
            flag="🇺🇬"
            color="savanna"
          />
        </div>

        {/* Comparison table */}
        <div className="max-w-3xl mx-auto glass-card rounded-3xl overflow-hidden">
          <div className="grid grid-cols-3 text-xs font-mono uppercase tracking-widest text-sand-400 border-b border-white/5">
            <div className="px-6 py-4" />
            <div className="px-6 py-4 text-center text-red-400">Traditional</div>
            <div className="px-6 py-4 text-center text-gold-400">AfriPay</div>
          </div>
          {[
            { metric: "Fee", old: "7–15%", neo: "1% flat" },
            { metric: "Settlement", old: "3–7 days", neo: "~5 minutes" },
            { metric: "Bank required", old: "Yes", neo: "No" },
            { metric: "Available hours", old: "Business hours", neo: "24/7/365" },
            { metric: "Minimum transfer", old: "$50+", neo: "Any amount" },
            { metric: "Coverage", old: "Major cities", neo: "Anywhere" },
          ].map((row, i) => (
            <div
              key={row.metric}
              className={`grid grid-cols-3 border-b border-white/5 last:border-0 ${
                i % 2 === 0 ? "bg-white/[0.02]" : ""
              }`}
            >
              <div className="px-6 py-4 text-sm text-sand-200 font-medium">
                {row.metric}
              </div>
              <div className="px-6 py-4 text-sm text-red-400 text-center">
                {row.old}
              </div>
              <div className="px-6 py-4 text-sm text-savanna-400 text-center font-semibold">
                {row.neo}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FlowStep({
  icon: Icon,
  label,
  sublabel,
  flag,
  color,
}: {
  icon: React.ElementType;
  label: string;
  sublabel: string;
  flag: string;
  color: "gold" | "savanna";
}) {
  const bg = color === "gold" ? "bg-gold-400" : "bg-savanna-500";
  const text = "text-navy-950";
  return (
    <div className="flex flex-col items-center gap-3 min-w-[120px]">
      <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center`}>
        <Icon size={24} className={text} />
      </div>
      <div className="text-center">
        <div className="text-2xl mb-1">{flag}</div>
        <div className="font-display font-600 text-sm text-sand-100">{label}</div>
        <div className="text-xs text-sand-400">{sublabel}</div>
      </div>
    </div>
  );
}

function FlowArrow({ label }: { label: string }) {
  return (
    <div className="flex flex-col md:flex-row items-center gap-1 mx-3">
      <div className="flex items-center gap-1">
        <div className="hidden md:block h-px w-16 bg-gradient-to-r from-gold-400/40 to-gold-400/80" />
        <ArrowRight size={16} className="text-gold-400 hidden md:block" />
        <div className="md:hidden h-8 w-px bg-gradient-to-b from-gold-400/40 to-gold-400/80" />
      </div>
      <div className="text-xs font-mono text-gold-400 bg-gold-400/10 px-2 py-0.5 rounded-full">
        {label}
      </div>
    </div>
  );
}

function FlowMid() {
  return (
    <div className="flex flex-col items-center gap-2 mx-4">
      <div className="w-14 h-14 rounded-2xl bg-navy-700 border border-gold-400/30 flex items-center justify-center shadow-[0_0_30px_rgba(247,183,49,0.2)]">
        <Bitcoin size={24} className="text-gold-400" />
      </div>
      <div className="text-xs font-mono text-gold-400">Bitcoin</div>
    </div>
  );
}
