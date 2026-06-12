# 🌍 AfriPay

## Bitcoin Lightning-Powered Cross-Border Trade Infrastructure for Africa

AfriPay is a cross-border payment platform built for African regional traders transacting across Kenya, Uganda, Tanzania, Rwanda, South Sudan, and Ethiopia. It leverages the **Bitcoin Lightning Network** to deliver instant, low-cost, and trust-minimized cross-border payments — replacing the inefficiencies of traditional banking rails.

---

## 🚨 Problem Statement

Cross-border trade in Africa is fragmented and expensive. Traders face:

- High remittance and transfer fees (5–15% per transaction)
- Slow settlement times (1–5 business days)
- Multiple financial intermediaries
- Complex currency conversion across 50+ local currencies
- Limited access to international payment rails
- Lack of trust and escrow mechanisms between trading parties

> *African commerce moves fast — but money does not.*

---

## 💡 Solution

AfriPay replaces traditional payment rails with the **Bitcoin Lightning Network** as the settlement layer.

| Feature | Description |
|---|---|
| ⚡ Instant payments | Sub-second Lightning Network settlement |
| ₿ Bitcoin base layer | Satoshi-denominated invoices |
| 💱 Fiat display | Real-time KES, UGX, TZS conversion via CoinGecko |
| 🛡️ Escrow system | 2-of-3 multi-party trade protection |
| 📊 Transparency | Full transaction history and audit trail |

---

## 👥 Target Users

- Small and medium cross-border traders
- Import/export businesses
- Regional wholesalers
- Informal cross-border merchants
- African SMEs engaged in regional trade

---

## 🔄 Core User Flows

### 💸 Standard Payment Flow

```
Login → Select Recipient → Enter Amount → Fiat→Sats Conversion
→ Lightning Invoice Generated → Payment Sent → Invoice Settled
→ Recipient: Keep BTC or View in Local Currency
```

### 🛡️ Escrow Trade Flow

```
Buyer Initiates Trade → Funds Locked in Escrow
→ Status: "Locked" → Buyer + Seller + Arbitrator interact
→ Any 2-of-3 Approvals → Funds Released
```

---

## ⚙️ Supported Currencies (MVP)

- **Bitcoin (BTC) / Satoshis (sats)** — settlement layer
- **KES** — Kenyan Shilling
- **UGX** — Ugandan Shilling
- **TZS** — Tanzanian Shilling

---

## 🧠 System Architecture

```
┌─────────────────────┐
│     Next.js UI      │
│ Dashboard / Payments│
│ Receive / Escrow    │
└──────────┬──────────┘
           │ HTTP
           ▼
┌─────────────────────┐
│       Go API        │
│ Auth / Wallets      │
│ Payments / Escrow   │
│ Exchange Rates      │
└───────┬─────┬───────┘
        │     │
        ▼     ▼
  ┌──────────┐ ┌──────────┐
  │  SQLite  │ │CoinGecko │
  │    DB    │ │   API    │
  └────┬─────┘ └──────────┘
       │
       ▼
  ┌──────────┐
  │   LND    │
  │Lightning │
  └────┬─────┘
       │
       ▼
  ┌──────────┐
  │ Bitcoin  │
  │ Regtest  │
  └──────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (React) |
| Backend | Go (Golang) |
| Database | SQLite |
| Lightning | LND (Lightning Network Daemon) |
| Bitcoin | Bitcoin Core (Regtest) |
| Exchange Rates | CoinGecko API |

---

## 🚀 Getting Started

### Prerequisites

- Go 1.21+
- Node.js 18+
- Docker (for LND + Bitcoin Regtest)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/afripay.git
cd afripay

# Backend setup
cd backend
cp .env.example .env
go mod tidy
go run main.go

# Frontend setup
cd ../frontend
cp .env.example .env.local
npm install
npm run dev
```

See [Environment Variables](#) for required `.env` configuration.

---

## 📁 Project Structure

```
afripay/
├── backend/           # Go API server
│   ├── handlers/      # HTTP route handlers
│   ├── models/        # Database models
│   ├── services/      # Business logic
│   └── main.go
├── frontend/          # Next.js app
│   ├── components/
│   ├── pages/
│   └── styles/
├── docs/              # Documentation
└── README.md
```

---

## 🏆 Hackathon

Built for **[Hackathon Name]** — demonstrating Bitcoin Lightning Network as a financial inclusion layer for African cross-border trade.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
