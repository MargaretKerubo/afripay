# 🌍 AfriPay

## Bitcoin Lightning-Powered Cross-Border Trade Infrastructure for Africa

AfriPay is a cross-border payment platform designed for African regional traders who frequently transact across countries such as Kenya, Uganda, Tanzania, Rwanda, South Sudan, and Ethiopia.

It leverages the Bitcoin Lightning Network to enable **instant, low-cost, and trust-minimized cross-border payments**, removing the inefficiencies of traditional banking systems.

---

# 🚨 Problem Statement

Cross-border trade in Africa is still fragmented and inefficient.

Traders face:

- High remittance and transfer fees  
- Slow settlement times (1–5 days)  
- Multiple financial intermediaries  
- Currency conversion complexity  
- Limited access to international payment rails  
- Lack of trust between trading parties  

Even within regional trade blocs, payments remain slow and expensive.

> African commerce moves fast — but money does not.

---

# 💡 Solution

AfriPay replaces traditional payment rails with the **Bitcoin Lightning Network** as the settlement layer.

It enables:

- ⚡ Instant cross-border payments via Lightning Network  
- ₿ Bitcoin-based settlement (satoshis)  
- 💱 Real-time fiat value display (KES, UGX, TZS, etc.)  
- 🔁 Optional Bitcoin or local currency view  
- 🛡️ Escrow-based trade protection system  
- 📊 Transparent transaction history  

---

# 👥 Target Users

- Small and medium cross-border traders  
- Import/export businesses  
- Regional wholesalers  
- Informal cross-border merchants  
- African SMEs engaged in regional trade  

---

# 🔄 Core User Flows

## 💸 Standard Payment Flow

1. User logs in  
2. Selects recipient  
3. Enters payment amount  
4. System converts fiat → satoshis  
5. Lightning invoice is generated  
6. Payment is sent via Lightning Network  
7. Invoice settlement is confirmed  
8. Recipient receives funds instantly  
9. Recipient chooses:
   - Keep Bitcoin  
   - View value in local currency  

---

## 🛡️ Escrow Trade Flow (MVP)

AfriPay includes a simulated escrow system for trade protection.

1. Buyer initiates trade  
2. Funds are locked in escrow  
3. Trade status becomes **"Locked"**  
4. Buyer, seller, and arbitrator interact  
5. Any 2-of-3 approvals release funds  

This simulates a **multi-signature trust system** for safe trade settlement.

---

# ⚙️ Supported Currencies (MVP)

- Bitcoin (BTC)  
- Satoshis (sats)  
- Kenyan Shilling (KES)  
- Ugandan Shilling (UGX)  
- Tanzanian Shilling (TZS)  

Fiat values are displayed using live conversion rates while Bitcoin remains the settlement layer.

# 🧠 System Architecture

┌─────────────────────┐
│     Next.js UI      │
│                     │
│ • Dashboard         │
│ • Send Payment      │
│ • Receive Payment   │
│ • Escrow Trades     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│      Go API         │
│                     │
│ • Authentication    │
│ • Wallets           │
│ • Payments          │
│ • Escrow            │
│ • Exchange Rates    │
└───────┬─────┬───────┘
        │     │
        ▼     ▼
┌──────────┐ ┌──────────┐
│ SQLite   │ │ CoinGecko│
│ Database │ │ API      │
└────┬─────┘ └──────────┘
     │
     ▼
┌──────────┐
│   LND    │
│ Lightning│
└────┬─────┘
     │
     ▼
┌──────────┐
│ Bitcoin  │
│  Regtest │
└──────────┘

   🛠️ Tech Stack
Layer
Technology
Frontend
Next.js (React)
Backend
Go (Golang)
Database
SQLite
Lightning
LND (Lightning Network Daemon)
Bitcoin
Bitcoin Core (Regtest)
Exchange Rates
CoinGecko API
🚀 Getting Started
Prerequisites
Go 1.21+
Node.js 18+
Docker (for LND + Bitcoin Regtest)

Installation

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

See Environment Variables for required .env configuration.

📁 Project Structure

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

🏆 Hackathon

Built for afripay lightning— demonstrating Bitcoin Lightning Network as a financial inclusion layer for African cross-border trade.

MIT License — see LICENSE for details.