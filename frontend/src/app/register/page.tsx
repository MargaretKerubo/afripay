"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

const CURRENCIES = [
  { code: "KES", label: "Kenyan Shilling (KES)" },
  { code: "UGX", label: "Ugandan Shilling (UGX)" },
  { code: "TZS", label: "Tanzanian Shilling (TZS)" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "", currency: "KES" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Registration failed");
        return;
      }

      localStorage.setItem("afripay_token", data.token);
      localStorage.setItem("afripay_user", JSON.stringify(data.user));
      router.push("/dashboard");
    } catch {
      setError("Network error — is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background:
          "radial-gradient(ellipse at 50% 0%, rgba(247,147,26,0.08) 0%, transparent 55%), var(--background)",
      }}
    >
      <div className="glass-card w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold mb-4"
            style={{
              background: "linear-gradient(135deg, var(--accent-primary), #e07d0a)",
            }}
          >
            ₿
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Create your wallet
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Start sending Bitcoin across East Africa
          </p>
        </div>

        {error && (
          <div
            className="mb-6 px-4 py-3 rounded-lg text-sm"
            style={{
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "var(--accent-red)",
            }}
            role="alert"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5" id="register-form">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="register-username"
              className="text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Username
            </label>
            <input
              id="register-username"
              type="text"
              className="form-input"
              placeholder="Choose a username"
              autoComplete="username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="register-password"
              className="text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Password
            </label>
            <input
              id="register-password"
              type="password"
              className="form-input"
              placeholder="Min 8 characters"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="register-currency"
              className="text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Local Currency
            </label>
            <select
              id="register-currency"
              className="form-input"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              style={{ cursor: "pointer" }}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}
                        style={{ background: "var(--surface)", color: "var(--text-primary)" }}>
                  {c.label}
                </option>
              ))}
            </select>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Used to display your balance in local fiat
            </p>
          </div>

          <button
            id="register-submit"
            type="submit"
            className="btn-primary w-full mt-2"
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Creating wallet…" : "Create Wallet — Free"}
          </button>
        </form>

        {/* Starting balance notice */}
        <div
          className="mt-5 px-4 py-3 rounded-lg text-xs flex items-start gap-2"
          style={{
            background: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.2)",
            color: "var(--text-secondary)",
          }}
        >
          <span>⚡</span>
          <span>
            New accounts start with <strong style={{ color: "var(--accent-green)" }}>10,000 sats</strong> for
            demo purposes.
          </span>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: "var(--text-secondary)" }}>
          Already have an account?{" "}
          <Link href="/login" className="font-medium" style={{ color: "var(--accent-primary)" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
