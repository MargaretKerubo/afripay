const corridors = [
  { from: "🇰🇪 Kenya", to: "🇺🇬 Uganda", tag: "Live beta" },
  { from: "🇳🇬 Nigeria", to: "🇬🇭 Ghana", tag: "Live beta" },
  { from: "🇿🇦 South Africa", to: "🇿🇼 Zimbabwe", tag: "Live beta" },
  { from: "🇪🇹 Ethiopia", to: "🇰🇪 Kenya", tag: "Q3 2025" },
  { from: "🇸🇳 Senegal", to: "🇨🇮 Côte d'Ivoire", tag: "Q3 2025" },
  { from: "🇹🇿 Tanzania", to: "🇷🇼 Rwanda", tag: "Q4 2025" },
  { from: "🇨🇲 Cameroon", to: "🇨🇬 Congo", tag: "Q4 2025" },
  { from: "🇲🇦 Morocco", to: "🇩🇿 Algeria", tag: "2026" },
];

export default function CorridorsSection() {
  return (
    <section id="corridors" className="relative z-10 py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-12">
          <p className="text-xs text-gold-400 font-mono uppercase tracking-widest mb-3">
            Corridors
          </p>
          <h2 className="font-display font-700 text-3xl md:text-5xl leading-tight text-sand-100">
            Starting where the need is highest.
          </h2>
          <p className="mt-4 text-sand-400 leading-relaxed">
            AfriPay launches in the corridors with the most remittance volume and the
            highest existing fees. Every quarter, we add more.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {corridors.map((c) => {
            const isLive = c.tag === "Live beta";
            return (
              <div
                key={`${c.from}-${c.to}`}
                className="glass-card rounded-2xl p-5 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                      isLive
                        ? "bg-savanna-500/15 text-savanna-400 border border-savanna-400/20"
                        : "bg-navy-800 text-sand-400 border border-white/10"
                    }`}
                  >
                    {isLive && <span className="mr-1">●</span>}
                    {c.tag}
                  </span>
                </div>
                <div className="text-sm text-sand-200 font-medium">{c.from}</div>
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-gold-400/30 to-transparent" />
                  <span className="text-gold-400 text-xs">→</span>
                </div>
                <div className="text-sm text-sand-200 font-medium">{c.to}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
