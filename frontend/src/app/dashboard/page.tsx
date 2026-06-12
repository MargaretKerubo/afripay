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

interface Transaction {
  id: number;
  sender_id?: number;
  receiver_id?: number;
  amount_sats: number;
  fiat_amount: number;
  fiat_currency: string;
  type: string;
  status: string;
  payment_request?: string;
  payment_hash?: string;
  created_at: string;
  settled_at?: string;
}

interface EscrowTrade {
  id: number;
  buyer_id: number;
  seller_id: number;
  arbitrator_id: number;
  amount_sats: number;
  status: string;
  buyer_approval: boolean;
  seller_approval: boolean;
  arbitrator_approval: boolean;
  created_at: string;
  buyer: User;
  seller: User;
  arbitrator: User;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [escrows, setEscrows] = useState<EscrowTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal State
  const [activeModal, setActiveModal] = useState<"send" | "receive" | "swap" | "escrow" | null>(null);

  // Send Modal Form State
  const [sendTab, setSendTab] = useState<"invoice" | "transfer">("invoice");
  const [bolt11Invoice, setBolt11Invoice] = useState("");
  const [transferUser, setTransferUser] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Receive Modal Form State
  const [receiveAmount, setReceiveAmount] = useState("");
  const [generatedInvoice, setGeneratedInvoice] = useState("");
  const [generatedHash, setGeneratedHash] = useState("");

  // Swap Modal Form State
  const [swapCurrency, setSwapCurrency] = useState("KES");

  // Escrow Modal Form State
  const [escrowTab, setEscrowTab] = useState<"list" | "create">("list");
  const [escrowSeller, setEscrowSeller] = useState("");
  const [escrowArbitrator, setEscrowArbitrator] = useState("");
  const [escrowAmount, setEscrowAmount] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("afripay_token") : null;

  useEffect(() => {
    const storedUser = localStorage.getItem("afripay_user");
    if (!token || !storedUser) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(storedUser));
    fetchDashboardData();
  }, [router, token]);

  function fetchDashboardData() {
    if (!token) return;
    setLoading(true);
    setError("");

    // Fetch live wallet balance
    const balancePromise = fetch(`${API_URL}/api/wallet/balance`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json());

    // Fetch transactions
    const txPromise = fetch(`${API_URL}/api/wallet/transactions`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json());

    // Fetch escrows
    const escrowPromise = fetch(`${API_URL}/api/wallet/escrow/list`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json());

    Promise.all([balancePromise, txPromise, escrowPromise])
      .then(([balanceData, txData, escrowData]) => {
        if (balanceData.error) setError(balanceData.error);
        else setWallet(balanceData);

        if (!txData.error) setTransactions(txData);
        if (!escrowData.error) setEscrows(escrowData);
      })
      .catch(() => setError("Failed to load dashboard data"))
      .finally(() => setLoading(false));
  }

  function handleLogout() {
    localStorage.removeItem("afripay_token");
    localStorage.removeItem("afripay_user");
    router.push("/");
  }

  const currencyFormatter = (value: number, currency: string) =>
    new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);

  // Send Actions
  async function handlePayInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError("");
    setSuccess("");
    setActionLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/wallet/withdraw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ payment_request: bolt11Invoice }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to pay invoice");
      } else {
        setSuccess("Invoice paid successfully!");
        setBolt11Invoice("");
        setActiveModal(null);
        fetchDashboardData();
      }
    } catch {
      setError("Network error paying invoice");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError("");
    setSuccess("");
    setActionLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/wallet/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: transferUser,
          amount_sats: parseInt(transferAmount),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Transfer failed");
      } else {
        setSuccess(`Transferred ${transferAmount} sats to @${transferUser} successfully!`);
        setTransferUser("");
        setTransferAmount("");
        setActiveModal(null);
        fetchDashboardData();
      }
    } catch {
      setError("Network error performing transfer");
    } finally {
      setActionLoading(false);
    }
  }

  // Receive Actions
  async function handleGenerateInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError("");
    setSuccess("");
    setActionLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/wallet/deposit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount_sats: parseInt(receiveAmount) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to generate invoice");
      } else {
        setGeneratedInvoice(data.payment_request);
        setGeneratedHash(data.payment_hash);
      }
    } catch {
      setError("Network error generating invoice");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSimulatePayment() {
    if (!token || !generatedHash) return;
    setError("");
    setSuccess("");
    setActionLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/wallet/deposit/simulate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ payment_hash: generatedHash }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Simulation failed");
      } else {
        setSuccess("Deposit settled successfully (simulated)!");
        setGeneratedInvoice("");
        setGeneratedHash("");
        setReceiveAmount("");
        setActiveModal(null);
        fetchDashboardData();
      }
    } catch {
      setError("Network error simulating payment");
    } finally {
      setActionLoading(false);
    }
  }

  // Swap Actions
  async function handleSwapCurrency(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError("");
    setSuccess("");
    setActionLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/wallet/swap-currency`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currency: swapCurrency }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to swap currency");
      } else {
        setSuccess(`Local currency display swapped to ${swapCurrency}!`);
        // Update local storage user details
        if (user) {
          const updatedUser = { ...user, local_currency: swapCurrency };
          localStorage.setItem("afripay_user", JSON.stringify(updatedUser));
          setUser(updatedUser);
        }
        setActiveModal(null);
        fetchDashboardData();
      }
    } catch {
      setError("Network error swapping currency");
    } finally {
      setActionLoading(false);
    }
  }

  // Escrow Actions
  async function handleCreateEscrow(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError("");
    setSuccess("");
    setActionLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/wallet/escrow/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          seller_username: escrowSeller,
          arbitrator_username: escrowArbitrator,
          amount_sats: parseInt(escrowAmount),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create escrow");
      } else {
        setSuccess("Escrow trade initialized successfully!");
        setEscrowSeller("");
        setEscrowArbitrator("");
        setEscrowAmount("");
        setActiveModal(null);
        fetchDashboardData();
      }
    } catch {
      setError("Network error creating escrow");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReleaseEscrow(escrowId: number) {
    if (!token) return;
    setError("");
    setSuccess("");
    setActionLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/wallet/escrow/release`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ escrow_id: escrowId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to release escrow");
      } else {
        setSuccess(data.message ?? "Approval registered successfully!");
        setActiveModal(null);
        fetchDashboardData();
      }
    } catch {
      setError("Network error releasing escrow");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDisputeEscrow(escrowId: number) {
    if (!token) return;
    setError("");
    setSuccess("");
    setActionLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/wallet/escrow/dispute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ escrow_id: escrowId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to dispute escrow");
      } else {
        setSuccess("Escrow trade disputed successfully!");
        setActiveModal(null);
        fetchDashboardData();
      }
    } catch {
      setError("Network error disputing escrow");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResolveEscrow(escrowId: number, decision: "RELEASE" | "REFUND") {
    if (!token) return;
    setError("");
    setSuccess("");
    setActionLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/wallet/escrow/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ escrow_id: escrowId, decision }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to resolve dispute");
      } else {
        setSuccess(`Dispute resolved: funds ${decision}D successfully!`);
        setActiveModal(null);
        fetchDashboardData();
      }
    } catch {
      setError("Network error resolving escrow dispute");
    } finally {
      setActionLoading(false);
    }
  }

  function getEscrowRoleLabel(escrow: EscrowTrade) {
    if (!user) return "";
    if (escrow.buyer_id === user.id) return "Buyer (You)";
    if (escrow.seller_id === user.id) return "Seller (You)";
    if (escrow.arbitrator_id === user.id) return "Arbitrator (You)";
    return "";
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Navigation */}
      <nav
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid var(--border)", background: "rgba(10,15,30,0.4)", backdropFilter: "blur(8px)" }}
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
            <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ color: "var(--accent-primary)", background: "rgba(247,147,26,0.1)" }}>
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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
            Dashboard
          </h1>
          <button className="btn-secondary" onClick={fetchDashboardData} style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}>
            Refresh
          </button>
        </div>

        {error && (
          <div
            className="mb-6 px-4 py-3 rounded-lg text-sm flex items-center justify-between"
            style={{
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "var(--accent-red)",
            }}
          >
            <span>{error}</span>
            <button onClick={() => setError("")} className="font-bold ml-2">×</button>
          </div>
        )}

        {success && (
          <div
            className="mb-6 px-4 py-3 rounded-lg text-sm flex items-center justify-between"
            style={{
              background: "rgba(34,197,94,0.12)",
              border: "1px solid rgba(34,197,94,0.3)",
              color: "var(--accent-green)",
            }}
          >
            <span>{success}</span>
            <button onClick={() => setSuccess("")} className="font-bold ml-2">×</button>
          </div>
        )}

        {/* Wallet Card */}
        <div
          className="glass-card p-8 mb-8 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(247,147,26,0.12), rgba(59,130,246,0.08))",
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full filter blur-3xl opacity-20" style={{ background: "var(--accent-primary)" }} />
          <p className="text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
            Total Wallet Balance
          </p>
          {loading ? (
            <div className="animate-pulse">
              <div className="h-12 rounded-lg mb-3" style={{ background: "rgba(255,255,255,0.08)", width: "180px" }} />
              <div className="h-5 rounded" style={{ background: "rgba(255,255,255,0.05)", width: "120px" }} />
            </div>
          ) : wallet ? (
            <>
              <p className="text-5xl font-bold mb-2 gradient-text" id="wallet-sats-balance">
                {wallet.balance_sats.toLocaleString()} <span className="text-2xl font-semibold">sats</span>
              </p>
              <p className="text-lg" style={{ color: "var(--text-secondary)" }} id="wallet-fiat-balance">
                ≈ {currencyFormatter(wallet.fiat_balance, wallet.currency)}
              </p>
            </>
          ) : null}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { id: "action-send", icon: "↗", label: "Send", modal: "send" as const },
            { id: "action-receive", icon: "↙", label: "Receive", modal: "receive" as const },
            { id: "action-swap", icon: "⇄", label: "Swap", modal: "swap" as const },
            { id: "action-escrow", icon: "🔒", label: "Escrow", modal: "escrow" as const },
          ].map((action) => (
            <button
              key={action.id}
              id={action.id}
              className="glass-card p-5 flex flex-col items-center gap-2 cursor-pointer hover:border-accent-primary transition-all duration-200"
              style={{ background: "rgba(255,255,255,0.02)" }}
              onClick={() => {
                setError("");
                setSuccess("");
                setActiveModal(action.modal);
                if (action.modal === "swap" && wallet) {
                  setSwapCurrency(wallet.currency);
                }
              }}
            >
              <span className="text-3xl gradient-text font-bold">{action.icon}</span>
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {action.label}
              </span>
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Active
              </span>
            </button>
          ))}
        </div>

        {/* Action Modals */}
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-card w-full max-w-lg p-6 relative" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <button
                className="absolute top-4 right-4 text-xl font-bold hover:text-accent-primary"
                onClick={() => {
                  setActiveModal(null);
                  setGeneratedInvoice("");
                  setGeneratedHash("");
                }}
              >
                ×
              </button>

              {/* Send Modal */}
              {activeModal === "send" && (
                <div>
                  <h3 className="text-xl font-bold mb-4 gradient-text">Send Money</h3>
                  <div className="flex gap-4 border-b border-border mb-4 pb-2">
                    <button
                      className={`text-sm font-bold pb-1 ${sendTab === "invoice" ? "text-accent-primary border-b-2 border-accent-primary" : "text-gray-400"}`}
                      onClick={() => setSendTab("invoice")}
                    >
                      Pay Lightning Invoice
                    </button>
                    <button
                      className={`text-sm font-bold pb-1 ${sendTab === "transfer" ? "text-accent-primary border-b-2 border-accent-primary" : "text-gray-400"}`}
                      onClick={() => setSendTab("transfer")}
                    >
                      Internal Transfer
                    </button>
                  </div>

                  {sendTab === "invoice" ? (
                    <form onSubmit={handlePayInvoice} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-400">BOLT11 Payment Request</label>
                        <textarea
                          id="pay-invoice-input"
                          className="form-input font-mono text-xs h-24 resize-none"
                          placeholder="lnbc..."
                          value={bolt11Invoice}
                          onChange={(e) => setBolt11Invoice(e.target.value)}
                          required
                        />
                      </div>
                      <button
                        id="pay-invoice-submit"
                        type="submit"
                        className="btn-primary w-full"
                        disabled={actionLoading}
                      >
                        {actionLoading ? "Processing Payment..." : "Pay Invoice"}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleTransfer} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-400">Receiver Username</label>
                        <input
                          id="transfer-username-input"
                          type="text"
                          className="form-input"
                          placeholder="bob"
                          value={transferUser}
                          onChange={(e) => setTransferUser(e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-400">Amount (sats)</label>
                        <input
                          id="transfer-amount-input"
                          type="number"
                          className="form-input"
                          placeholder="e.g. 500"
                          value={transferAmount}
                          onChange={(e) => setTransferAmount(e.target.value)}
                          required
                        />
                      </div>
                      <button
                        id="transfer-submit"
                        type="submit"
                        className="btn-primary w-full"
                        disabled={actionLoading}
                      >
                        {actionLoading ? "Processing Transfer..." : "Send Satoshis"}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Receive Modal */}
              {activeModal === "receive" && (
                <div>
                  <h3 className="text-xl font-bold mb-4 gradient-text">Receive Money</h3>
                  {!generatedInvoice ? (
                    <form onSubmit={handleGenerateInvoice} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-400">Amount (sats)</label>
                        <input
                          id="receive-sats-input"
                          type="number"
                          className="form-input"
                          placeholder="e.g. 1000"
                          value={receiveAmount}
                          onChange={(e) => setReceiveAmount(e.target.value)}
                          required
                        />
                      </div>
                      <button
                        id="generate-invoice-btn"
                        type="submit"
                        className="btn-primary w-full"
                        disabled={actionLoading}
                      >
                        {actionLoading ? "Generating Invoice..." : "Generate BOLT11 Invoice"}
                      </button>
                    </form>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-lg border border-gray-700">
                        <div className="w-32 h-32 flex items-center justify-center bg-white rounded-lg border-4 border-accent-primary font-bold text-black text-xs text-center p-2">
                          [ Afripay Lightning QR ]
                        </div>
                        <p className="text-xs text-gray-400 font-mono text-center break-all select-all">
                          {generatedInvoice}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          id="simulate-payment-btn"
                          className="btn-primary flex-1"
                          onClick={handleSimulatePayment}
                          disabled={actionLoading}
                        >
                          Simulate Payment Settlement
                        </button>
                        <button
                          className="btn-secondary"
                          onClick={() => {
                            setGeneratedInvoice("");
                            setGeneratedHash("");
                          }}
                        >
                          Back
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Swap Modal */}
              {activeModal === "swap" && (
                <div>
                  <h3 className="text-xl font-bold mb-4 gradient-text">Swap Local Currency Display</h3>
                  <form onSubmit={handleSwapCurrency} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-gray-400">Display Currency Preference</label>
                      <select
                        id="swap-currency-select"
                        className="form-input"
                        value={swapCurrency}
                        onChange={(e) => setSwapCurrency(e.target.value)}
                        style={{ cursor: "pointer" }}
                      >
                        <option value="KES">Kenyan Shilling (KES)</option>
                        <option value="UGX">Ugandan Shilling (UGX)</option>
                        <option value="TZS">Tanzanian Shilling (TZS)</option>
                      </select>
                    </div>
                    <button
                      id="swap-currency-submit"
                      type="submit"
                      className="btn-primary w-full"
                      disabled={actionLoading}
                    >
                      {actionLoading ? "Saving preference..." : "Update display currency"}
                    </button>
                  </form>
                </div>
              )}

              {/* Escrow Modal */}
              {activeModal === "escrow" && (
                <div>
                  <h3 className="text-xl font-bold mb-4 gradient-text">Escrow Trade Protection</h3>
                  <div className="flex gap-4 border-b border-border mb-4 pb-2">
                    <button
                      className={`text-sm font-bold pb-1 ${escrowTab === "list" ? "text-accent-primary border-b-2 border-accent-primary" : "text-gray-400"}`}
                      onClick={() => setEscrowTab("list")}
                    >
                      Active Escrows
                    </button>
                    <button
                      className={`text-sm font-bold pb-1 ${escrowTab === "create" ? "text-accent-primary border-b-2 border-accent-primary" : "text-gray-400"}`}
                      onClick={() => setEscrowTab("create")}
                    >
                      Create Escrow
                    </button>
                  </div>

                  {escrowTab === "list" ? (
                    <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
                      {escrows.length === 0 ? (
                        <p className="text-sm text-center text-gray-400 py-6">No escrow trades active.</p>
                      ) : (
                        escrows.map((escrow) => (
                          <div key={escrow.id} className="p-4 rounded-lg bg-surface border border-border flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-bold text-accent-primary">Escrow #{escrow.id}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                escrow.status === "RELEASED" ? "bg-green-500/15 text-green-400 border border-green-500/20" :
                                escrow.status === "DISPUTED" ? "bg-red-500/15 text-red-400 border border-red-500/20" :
                                escrow.status === "REFUNDED" ? "bg-blue-500/15 text-blue-400 border border-blue-500/20" :
                                "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20"
                              }`}>
                                {escrow.status}
                              </span>
                            </div>
                            
                            {/* Grid presentation details */}
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-black/20 p-3 rounded-xl border border-border/10">
                              <div>
                                <span className="text-[10px] text-text-secondary uppercase font-mono block">Your Role</span>
                                <span className="text-xs font-semibold text-accent-secondary">{getEscrowRoleLabel(escrow)}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-text-secondary uppercase font-mono block">Amount</span>
                                <span className="text-xs font-semibold text-text-primary">{escrow.amount_sats?.toLocaleString()} sats</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-text-secondary uppercase font-mono block">Buyer</span>
                                <span className="text-xs text-text-primary">@{escrow.buyer?.username}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-text-secondary uppercase font-mono block">Seller</span>
                                <span className="text-xs text-text-primary">@{escrow.seller?.username}</span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-[10px] text-text-secondary uppercase font-mono block">Arbitrator</span>
                                <span className="text-xs text-text-primary">@{escrow.arbitrator?.username}</span>
                              </div>
                            </div>

                            {/* Escrow approvals display */}
                            <div className="flex gap-2 justify-between items-center bg-black/10 p-2 rounded-lg text-[10px] text-text-secondary border border-border/5">
                              <div className="flex items-center gap-1">
                                <span className={`w-2 h-2 rounded-full ${escrow.buyer_approval ? "bg-accent-green" : "bg-text-muted"}`} />
                                <span>Buyer</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className={`w-2 h-2 rounded-full ${escrow.seller_approval ? "bg-accent-green" : "bg-text-muted"}`} />
                                <span>Seller</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className={`w-2 h-2 rounded-full ${escrow.arbitrator_approval ? "bg-accent-green" : "bg-text-muted"}`} />
                                <span>Arbitrator</span>
                              </div>
                            </div>

                            {/* Actions on Escrow */}
                            {escrow.status === "LOCKED" && (
                              <div className="flex gap-2 mt-1">
                                <button
                                  className="btn-primary text-xs py-1.5 px-3 flex-1 font-semibold"
                                  onClick={() => handleReleaseEscrow(escrow.id)}
                                  disabled={actionLoading}
                                >
                                  Approve Release
                                </button>
                                {(user?.id === escrow.buyer_id || user?.id === escrow.seller_id) && (
                                  <button
                                    className="btn-secondary text-xs py-1.5 px-3 text-accent-red hover:bg-accent-red/10 border-accent-red/20 font-semibold"
                                    onClick={() => handleDisputeEscrow(escrow.id)}
                                    disabled={actionLoading}
                                  >
                                    Dispute
                                  </button>
                                )}
                              </div>
                            )}

                            {escrow.status === "DISPUTED" && (
                              <div className="flex gap-2 mt-1">
                                {user?.id === escrow.arbitrator_id ? (
                                  <>
                                    <button
                                      className="btn-primary text-xs py-1.5 px-3 flex-1 font-semibold"
                                      onClick={() => handleResolveEscrow(escrow.id, "RELEASE")}
                                      disabled={actionLoading}
                                    >
                                      Pay Seller
                                    </button>
                                    <button
                                      className="btn-secondary text-xs py-1.5 px-3 flex-1 text-accent-red hover:bg-accent-red/10 border-accent-red/20 font-semibold"
                                      onClick={() => handleResolveEscrow(escrow.id, "REFUND")}
                                      disabled={actionLoading}
                                    >
                                      Refund Buyer
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    className="btn-primary text-xs py-1.5 px-3 flex-1 font-semibold"
                                    onClick={() => handleReleaseEscrow(escrow.id)}
                                    disabled={actionLoading}
                                  >
                                    Approve Release
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handleCreateEscrow} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-text-secondary">Seller Username</label>
                        <input
                          id="escrow-seller-input"
                          type="text"
                          className="form-input"
                          placeholder="bob"
                          value={escrowSeller}
                          onChange={(e) => setEscrowSeller(e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-text-secondary">Arbitrator Username</label>
                        <input
                          id="escrow-arbitrator-input"
                          type="text"
                          className="form-input"
                          placeholder="charlie"
                          value={escrowArbitrator}
                          onChange={(e) => setEscrowArbitrator(e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-text-secondary">Amount (sats)</label>
                        <input
                          id="escrow-amount-input"
                          type="number"
                          className="form-input"
                          placeholder="e.g. 5000"
                          value={escrowAmount}
                          onChange={(e) => setEscrowAmount(e.target.value)}
                          required
                        />
                      </div>
                      <button
                        id="escrow-submit"
                        type="submit"
                        className="btn-primary w-full mt-2"
                        disabled={actionLoading}
                      >
                        {actionLoading ? "Locking funds..." : "Initialize Escrow and Lock Funds"}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transactions list */}
        <div className="glass-card p-6">
          <h2 className="font-semibold text-lg mb-4" style={{ color: "var(--text-primary)" }}>
            Transaction History
          </h2>
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <span className="text-4xl">⚡</span>
              <p style={{ color: "var(--text-secondary)" }}>No transactions yet</p>
              <p className="text-sm text-center" style={{ color: "var(--text-muted)", maxWidth: "280px" }}>
                Your Lightning payment history will appear here once you start transacting.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {transactions.map((tx) => {
                const isReceiver = tx.receiver_id === user?.id;
                const formattedDate = new Date(tx.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <div key={tx.id} className="flex justify-between items-center py-3 border-b border-gray-800 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        tx.status === "FAILED" ? "bg-red-500/15 text-red-500" :
                        tx.status === "PENDING" ? "bg-yellow-500/15 text-yellow-500" :
                        isReceiver ? "bg-green-500/15 text-green-500" : "bg-blue-500/15 text-blue-500"
                      }`}>
                        {tx.status === "FAILED" ? "!" : tx.type === "ESCROW" ? "🔒" : isReceiver ? "↙" : "↗"}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-200">
                          {tx.type === "ESCROW" ? "Escrow Protection Lock" :
                           isReceiver ? "Received Payment" : "Sent Payment"}
                        </p>
                        <p className="text-xs text-gray-400">{formattedDate}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${
                        tx.status === "FAILED" ? "text-gray-400 line-through" :
                        isReceiver ? "text-green-500" : "text-gray-200"
                      }`}>
                        {isReceiver ? "+" : "-"}{tx.amount_sats.toLocaleString()} sats
                      </p>
                      <p className="text-xs text-gray-400">
                        {tx.status === "PENDING" ? "PENDING" : `≈ ${currencyFormatter(tx.fiat_amount, tx.fiat_currency)}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
