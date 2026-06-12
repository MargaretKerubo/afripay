import { Bitcoin, Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/5 py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gold-400 flex items-center justify-center">
            <Zap size={14} className="text-navy-950" fill="currentColor" />
          </div>
          <span className="font-display font-700 text-base text-sand-100">
            Afri<span className="text-gold-gradient">Pay</span>
          </span>
        </div>

        {/* Links */}
        <nav className="flex flex-wrap justify-center gap-6 text-sm text-sand-400">
          {[
            ["#problem", "Problem"],
            ["#solution", "Solution"],
            ["#features", "Features"],
            ["#how-it-works", "How it works"],
            ["#cta", "Get Started"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="hover:text-sand-100 transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Bitcoin mark */}
        <div className="flex items-center gap-1.5 text-xs text-sand-600">
          <Bitcoin size={12} className="text-gold-400/50" />
          <span>Powered by Bitcoin</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between gap-2 text-xs text-sand-600">
        <span>© {new Date().getFullYear()} AfriPay. All rights reserved.</span>
        <span>Not financial advice. Bitcoin is volatile. Transfer at your own risk.</span>
      </div>
    </footer>
  );
}
