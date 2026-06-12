const steps = [
  {
    number: "01",
    title: "Enter the amount",
    description:
      "Type how much you want to send in your local currency. AfriPay shows the live BTC rate and exact amount the recipient will receive — before you confirm anything.",
  },
  {
    number: "02",
    title: "Fund via mobile money",
    description:
      "Pay with M-Pesa, MTN MoMo, Airtel Money, or a bank transfer. AfriPay instantly converts your local currency to Bitcoin at the mid-market rate.",
  },
  {
    number: "03",
    title: "Bitcoin crosses the border",
    description:
      "AfriPay routes the BTC payment across the Lightning Network or on-chain. No correspondent banks, no SWIFT messages, no intermediaries extracting value.",
  },
  {
    number: "04",
    title: "Recipient cashes out",
    description:
      "The BTC is converted to the recipient's local currency and deposited into their mobile money wallet or bank. They don't need to know what Bitcoin is.",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative z-10 py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="max-w-2xl mb-16">
          <p className="text-xs text-savanna-400 font-mono uppercase tracking-widest mb-3">
            How it works
          </p>
          <h2 className="font-display font-700 text-3xl md:text-5xl leading-tight text-sand-100">
            Four steps. Under ten minutes.
          </h2>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line (desktop) */}
          <div
            aria-hidden
            className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-gold-400/30 to-transparent"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={step.number} className="flex flex-col gap-5">
                {/* Number circle */}
                <div className="relative flex items-center gap-4 lg:flex-col lg:items-start">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-display font-700 text-sm shrink-0"
                    style={{
                      background:
                        i % 2 === 0
                          ? "rgba(247,183,49,0.15)"
                          : "rgba(52,211,153,0.12)",
                      border:
                        i % 2 === 0
                          ? "1px solid rgba(247,183,49,0.3)"
                          : "1px solid rgba(52,211,153,0.25)",
                      color: i % 2 === 0 ? "#F7B731" : "#34D399",
                    }}
                  >
                    {step.number}
                  </div>
                </div>
                {/* Content */}
                <div>
                  <h3 className="font-display font-600 text-base text-sand-100 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-sand-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Example transfer callout */}
        <div className="mt-16 glass-card rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center gap-8">
          <div className="flex-1">
            <p className="text-xs text-gold-400 font-mono uppercase tracking-widest mb-2">
              Example transfer
            </p>
            <h3 className="font-display font-600 text-xl text-sand-100">
              Akinyi sends KES 13,000 to her mother in Lagos
            </h3>
            <p className="mt-2 text-sm text-sand-400">
              Traditional MTO: her mother receives ≈ ₦88,000 after fees and bad FX.
              <br />
              Via AfriPay: her mother receives ≈ ₦96,500 — 9.7% more in her pocket.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center shrink-0">
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-6 py-4">
              <div className="font-display font-700 text-xl text-red-400">₦88,000</div>
              <div className="text-xs text-sand-400 mt-1">Traditional</div>
            </div>
            <div className="bg-savanna-500/10 border border-savanna-400/20 rounded-2xl px-6 py-4">
              <div className="font-display font-700 text-xl text-savanna-400">₦96,500</div>
              <div className="text-xs text-sand-400 mt-1">AfriPay</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
