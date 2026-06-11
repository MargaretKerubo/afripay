import {
  Shield,
  Zap,
  Smartphone,
  Globe,
  Lock,
  BarChart3,
  RefreshCw,
  Users,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning-fast settlement",
    description:
      "Transactions confirm in under 10 minutes on-chain, or near-instantly on the Lightning Network — no more multi-day waits.",
    accent: "gold" as const,
  },
  {
    icon: Shield,
    title: "1% flat fee, always",
    description:
      "No hidden FX spreads. No corridor markups. No mystery deductions. One percent — that's the deal, whether you send $10 or $10,000.",
    accent: "savanna" as const,
  },
  {
    icon: Smartphone,
    title: "Mobile-first design",
    description:
      "Built for USSD, M-Pesa, and low-bandwidth networks. If you have a phone number, you have access to AfriPay.",
    accent: "gold" as const,
  },
  {
    icon: Globe,
    title: "54-country coverage",
    description:
      "Every African Union member state on the roadmap. Kenya, Nigeria, Ghana, South Africa, Ethiopia — and 49 more.",
    accent: "savanna" as const,
  },
  {
    icon: Lock,
    title: "Self-custody option",
    description:
      "Advanced users can opt for non-custodial wallets. You hold your keys. AfriPay never touches your Bitcoin longer than needed.",
    accent: "gold" as const,
  },
  {
    icon: RefreshCw,
    title: "Instant local cash-out",
    description:
      "Recipient receives local currency through M-Pesa, MTN MoMo, or bank transfer. No crypto knowledge required on either end.",
    accent: "savanna" as const,
  },
  {
    icon: BarChart3,
    title: "Live FX rates",
    description:
      "Mid-market rates refreshed every 30 seconds. You see exactly what you send and what arrives before confirming.",
    accent: "gold" as const,
  },
  {
    icon: Users,
    title: "Agent network",
    description:
      "A growing network of local cash agents for those without mobile money. AfriPay works with the infrastructure that already exists.",
    accent: "savanna" as const,
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="relative z-10 py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="max-w-2xl mb-16">
          <p className="text-xs text-gold-400 font-mono uppercase tracking-widest mb-3">
            Features
          </p>
          <h2 className="font-display font-700 text-3xl md:text-5xl leading-tight text-sand-100">
            Built for the realities of doing business in Africa.
          </h2>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f) => {
            const Icon = f.icon;
            const iconBg = f.accent === "gold" ? "bg-gold-400/10" : "bg-savanna-500/10";
            const iconColor = f.accent === "gold" ? "text-gold-400" : "text-savanna-400";
            const borderHover =
              f.accent === "gold"
                ? "hover:border-gold-400/30"
                : "hover:border-savanna-400/30";
            return (
              <div
                key={f.title}
                className={`glass-card rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1 ${borderHover}`}
              >
                <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
                  <Icon size={20} className={iconColor} />
                </div>
                <h3 className="font-display font-600 text-base text-sand-100">
                  {f.title}
                </h3>
                <p className="text-sm text-sand-400 leading-relaxed flex-1">
                  {f.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
