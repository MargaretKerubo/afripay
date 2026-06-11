"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }

      // Persist token
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
      className="min-h-screen flex items-center justify-center px-4"
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
            Welcome back
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Sign in to your AfriPay wallet
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-5" id="login-form">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="login-username"
              className="text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Username
            </label>
            <input
              id="login-username"
              type="text"
              className="form-input"
              placeholder="e.g. alice"
              autoComplete="username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="login-password"
              className="text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn-primary w-full mt-2"
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "var(--text-secondary)" }}>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium" style={{ color: "var(--accent-primary)" }}>
            Create one free
          </Link>
        </p>

        {/* Demo hint */}
        <div
          className="mt-6 px-4 py-3 rounded-lg text-xs"
          style={{
            background: "rgba(59,130,246,0.08)",
            border: "1px solid rgba(59,130,246,0.2)",
            color: "var(--text-secondary)",
          }}
        >
          <strong style={{ color: "var(--accent-secondary)" }}>Demo users:</strong>{" "}
          alice / bob / charlie — all with password{" "}
          <code className="font-mono">password123</code>
        </div>
      </div>
    </div>
  );
}
