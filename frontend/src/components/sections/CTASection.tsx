"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle } from "lucide-react";
import { joinWaitlist } from "@/lib/api";

const AFRICAN_COUNTRIES = [
  "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi",
  "Cameroon", "Cape Verde", "Central African Republic", "Chad", "Comoros",
  "Congo (DRC)", "Congo (Republic)", "Côte d'Ivoire", "Djibouti", "Egypt",
  "Equatorial Guinea", "Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia",
  "Ghana", "Guinea", "Guinea-Bissau", "Kenya", "Lesotho", "Liberia", "Libya",
  "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius", "Morocco",
  "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda", "São Tomé & Príncipe",
  "Senegal", "Sierra Leone", "Somalia", "South Africa", "South Sudan", "Sudan",
  "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe",
];

export default function CTASection({ waitlistCount }: { waitlistCount: number }) {
  const [form, setForm] = useState({ name: "", email: "", country: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;

    setStatus("loading");
    try {
      const res = await joinWaitlist(form);
      setMessage(res.message);
      setStatus("success");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong. Try again.");
      setStatus("error");
    }
  };

  return (
    <section id="cta" className="relative z-10 py-32 px-6">
      {/* Background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(247,183,49,0.06), transparent)",
        }}
      />

      <div className="max-w-2xl mx-auto text-center relative">
        {/* Counter */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-800 border border-gold-400/20 text-xs text-gold-400 font-mono mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-savanna-400 animate-pulse" />
          {waitlistCount.toLocaleString()}+ people already waiting
        </div>

        <h2 className="font-display font-700 text-3xl md:text-5xl leading-tight text-sand-100">
          Be first when
          <br />
          AfriPay goes live.
        </h2>

        <p className="mt-4 text-sand-400 text-base md:text-lg">
          We&apos;re onboarding users by country, starting with Kenya and Nigeria.
          Join the waitlist and we&apos;ll notify you the moment your corridor opens.
        </p>

        {/* Form */}
        {status === "success" ? (
          <div className="mt-10 glass-card rounded-3xl p-10 flex flex-col items-center gap-4">
            <CheckCircle size={40} className="text-savanna-400" />
            <p className="text-sand-100 font-display font-600 text-lg">
              {message || "You're on the list!"}
            </p>
            <p className="text-sand-400 text-sm">
              We&apos;ll reach out as soon as AfriPay is available in your country.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-10 glass-card rounded-3xl p-8 flex flex-col gap-4 text-left"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="text-xs text-sand-400 font-medium">
                  Your name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="Amara Osei"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-navy-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-sand-100 placeholder-sand-600 focus:outline-none focus:border-gold-400/40 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-xs text-sand-400 font-medium">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="amara@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="bg-navy-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-sand-100 placeholder-sand-600 focus:outline-none focus:border-gold-400/40 transition-colors"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="country" className="text-xs text-sand-400 font-medium">
                Country (optional)
              </label>
              <select
                id="country"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="bg-navy-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-sand-100 focus:outline-none focus:border-gold-400/40 transition-colors"
              >
                <option value="">Select your country</option>
                {AFRICAN_COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {status === "error" && (
              <p className="text-sm text-red-400">{message}</p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="group flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gold-400 text-navy-950 font-semibold text-sm hover:bg-gold-500 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(247,183,49,0.25)]"
            >
              {status === "loading" ? "Joining..." : "Join the Waitlist"}
              {status !== "loading" && (
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              )}
            </button>
            <p className="text-xs text-sand-600 text-center">
              No spam. No selling your data. Just launch updates.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
