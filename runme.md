# AfriPay - Running the Application

This guide walks you through setting up and running both the Go backend and Next.js frontend, including simulated and real Lightning network development.

---

## 1. Prerequisites

Make sure you have the following installed:
- **Go** v1.22 or later
- **Node.js** v18 or later (with `npm`)
- **Docker** (Required only if running LND nodes locally via Polar)

---

## 2. Configuration & Installation

### 2a. Configure Backend
Copy the example environment template and populate it:
```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and configure it:
```env
PORT=8080
DATABASE_URL=afripay.db
JWT_SECRET=your_jwt_signing_secret_here

# For Real LND (Polar) mode, populate these:
LND_HOST=https://127.0.0.1:8081
LND_MACAROON=<hex-encoded-admin-macaroon>
LND_TLS_CERT_PATH= # Leave blank to skip TLS check in dev mode
```
> **Simulated Fallback**: If `LND_HOST` or `LND_MACAROON` are left blank, the client automatically starts in **Simulated Mode**. All Lightning deposit generation and payments will mock responses seamlessly.

### 2b. Install Frontend Dependencies
```bash
cd frontend
npm install
```

---

## 3. Running the Services

### 3a. Start the Backend Go Server
From the root directory:
```bash
cd backend
go run ./cmd/server
```
On startup, GORM will migrate the SQLite tables and seed three demo accounts:
- **`alice`** (Password: `password123` | local currency: KES | starting balance: 100,000 sats)
- **`bob`** (Password: `password123` | local currency: UGX | starting balance: 50,000 sats)
- **`charlie`** (Password: `password123` | local currency: KES | starting balance: 0 sats)

### 3b. Start the Next.js Dev Server
From the root directory:
```bash
cd frontend
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 4. Testing & Running Actions

### Interactive Modals
Once signed in, you can test the following quick actions in the dashboard:
- **Receive (Deposit)**: Enter sats, click "Generate BOLT11 Invoice".
  - **In Simulated Mode**: Click **"Simulate Payment Settlement"** on the generated invoice card to manually settle the invoice in the database and credit your wallet balance instantly.
- **Send**:
  - **Pay Lightning Invoice**: Paste any BOLT11 invoice. The wallet validates your balance, processes the LND payment, and deducts your balance.
  - **Internal Transfer**: Transfer satoshis instantly and with zero fees to another user on AfriPay by entering their username (e.g. transfer from `alice` to `bob`).
- **Swap**: Select a different local display currency (KES, UGX, TZS) to instantly recalculate display balances using FX conversion rates.
- **Escrow**: Lock funds in a 2-of-3 multisig escrow between a buyer, seller, and arbitrator, complete with dispute raising and resolution options.

---

## 5. Running Automated Tests

Run the backend test suite:
```bash
cd backend
go test ./...
```
