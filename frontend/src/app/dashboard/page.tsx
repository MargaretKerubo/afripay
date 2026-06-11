"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

interface WalletData {
  balance_sats: number;
  fiat_balance: number;
  currency: string;
}

interface User {
  id: number;
  username: string;
  local_currency: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("afripay_user");
    const token = localStorage.getItem("afripay_token");

    if (!token || !storedUser) {
      router.push("/login");
      return;
    }

    setUser(JSON.parse(storedUser));

    // Fetch live wallet balance
    fetch(`${API_URL}/api/wallet/balance`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setWallet(data);
      })
      .catch(() => setError("Failed to load wallet data"))
      .finally(() => setLoading(false));
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("afripay_token");
    localStorage.removeItem("afripay_user");
    router.push("/");
  }

  const currencyFormatter = (value: number, currency: string) =>
    new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Nav */}
      <nav
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
            style={{ background: "linear-gradient(135deg, var(--accent-primary), #e07d0a)" }}
          >
            ₿
          </div>
          <span className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
            AfriPay
          </span>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
              @{user.username}
            </span>
          )}
          <button id="dashboard-logout" className="btn-secondary" onClick={handleLogout}
                  style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}>
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8" style={{ color: "var(--text-primary)" }}>
          Dashboard
        </h1>

        {error && (
          <div
            className="mb-6 px-4 py-3 rounded-lg text-sm"
            style={{
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "var(--accent-red)",
            }}
          >
            {error}
          </div>
        )}

        {/* Wallet Card */}
        <div
          className="glass-card p-8 mb-8"
          style={{
            background: "linear-gradient(135deg, rgba(247,147,26,0.1), rgba(59,130,246,0.06))",
          }}
        >
          <p className="text-sm font-medium mb-2" style={{ color: "var(--text-muted)" }}>
            Total Balance
          </p>
          {loading ? (
            <div className="animate-pulse">
              <div className="h-12 rounded-lg mb-3" style={{ background: "rgba(255,255,255,0.08)", width: "180px" }} />
              <div className="h-5 rounded" style={{ background: "rgba(255,255,255,0.05)", width: "120px" }} />
            </div>
          ) : wallet ? (
            <>
              <p className="text-5xl font-bold mb-2 gradient-text" id="wallet-sats-balance">
                {wallet.balance_sats.toLocaleString()} <span className="text-2xl">sats</span>
              </p>
              <p className="text-lg" style={{ color: "var(--text-secondary)" }} id="wallet-fiat-balance">
                ≈ {currencyFormatter(wallet.fiat_balance, wallet.currency)}
              </p>
            </>
          ) : null}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { id: "action-send", icon: "↗", label: "Send", disabled: true },
            { id: "action-receive", icon: "↙", label: "Receive", disabled: true },
            { id: "action-swap", icon: "⇄", label: "Swap", disabled: true },
            { id: "action-escrow", icon: "🔒", label: "Escrow", disabled: true },
          ].map((action) => (
            <button
              key={action.id}
              id={action.id}
              className="glass-card p-5 flex flex-col items-center gap-2 cursor-not-allowed"
              disabled={action.disabled}
              style={{ opacity: 0.5 }}
              title="Coming soon"
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                {action.label}
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                Soon
              </span>
            </button>
          ))}
        </div>

        {/* Transactions placeholder */}
        <div className="glass-card p-6">
          <h2 className="font-semibold text-lg mb-4" style={{ color: "var(--text-primary)" }}>
            Transaction History
          </h2>
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <span className="text-4xl">⚡</span>
            <p style={{ color: "var(--text-secondary)" }}>No transactions yet</p>
            <p className="text-sm text-center" style={{ color: "var(--text-muted)", maxWidth: "280px" }}>
              Your Lightning payment history will appear here once you start transacting.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
