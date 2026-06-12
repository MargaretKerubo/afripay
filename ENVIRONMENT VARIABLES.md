# 🔐 AfriPay — Environment Variables

This document describes all required and optional environment variables for running AfriPay locally or in production.

---

## Backend (Go API) — `.env`

Copy `backend/.env.example` to `backend/.env` and fill in the values.

### Server

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `8080` | Port the Go API server listens on |
| `ENV` | No | `development` | Environment mode: `development`, `staging`, `production` |
| `ALLOWED_ORIGINS` | Yes | — | Comma-separated list of allowed CORS origins (e.g. `http://localhost:3000`) |

### Database

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_PATH` | No | `./afripay.db` | File path to the SQLite database |

### Authentication

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | Yes | — | Secret key used to sign JWT tokens. Use a long random string (32+ chars) |
| `JWT_EXPIRY_HOURS` | No | `24` | Number of hours before JWT tokens expire |

### Lightning Network (LND)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LND_HOST` | Yes | — | Hostname and gRPC port of your LND node (e.g. `localhost:10009`) |
| `LND_TLS_CERT_PATH` | Yes | — | Path to LND's TLS certificate file (`tls.cert`) |
| `LND_MACAROON_PATH` | Yes | — | Path to LND's admin macaroon file (`admin.macaroon`) |
| `LND_NETWORK` | No | `regtest` | Bitcoin network: `regtest`, `testnet`, or `mainnet` |

### Bitcoin / Regtest

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BITCOIN_RPC_HOST` | Yes | — | Bitcoin Core RPC host (e.g. `localhost:18443` for regtest) |
| `BITCOIN_RPC_USER` | Yes | — | Bitcoin Core RPC username |
| `BITCOIN_RPC_PASS` | Yes | — | Bitcoin Core RPC password |

### Exchange Rates

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `COINGECKO_API_KEY` | No | — | CoinGecko API key (optional; rate limits apply without key) |
| `EXCHANGE_RATE_TTL_SECONDS` | No | `60` | How long to cache exchange rate responses (seconds) |

---

## Frontend (Next.js) — `.env.local`

Copy `frontend/.env.example` to `frontend/.env.local` and fill in the values.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | — | Full URL of the Go backend API (e.g. `http://localhost:8080`) |
| `NEXT_PUBLIC_APP_NAME` | No | `AfriPay` | App name displayed in the UI |
| `NEXT_PUBLIC_DEFAULT_CURRENCY` | No | `KES` | Default fiat currency shown to users (`KES`, `UGX`, `TZS`) |
| `NEXT_PUBLIC_SUPPORTED_CURRENCIES` | No | `KES,UGX,TZS` | Comma-separated list of enabled fiat currencies |

---

## Example `.env` (Backend)

```env
# Server
PORT=8080
ENV=development
ALLOWED_ORIGINS=http://localhost:3000

# Database
DB_PATH=./afripay.db

# Auth
JWT_SECRET=your-very-long-random-secret-here
JWT_EXPIRY_HOURS=24

# LND
LND_HOST=localhost:10009
LND_TLS_CERT_PATH=./lnd/tls.cert
LND_MACAROON_PATH=./lnd/data/chain/bitcoin/regtest/admin.macaroon
LND_NETWORK=regtest

# Bitcoin Regtest
BITCOIN_RPC_HOST=localhost:18443
BITCOIN_RPC_USER=rpcuser
BITCOIN_RPC_PASS=rpcpassword

# Exchange Rates
COINGECKO_API_KEY=
EXCHANGE_RATE_TTL_SECONDS=60
```

## Example `.env.local` (Frontend)

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_APP_NAME=AfriPay
NEXT_PUBLIC_DEFAULT_CURRENCY=KES
NEXT_PUBLIC_SUPPORTED_CURRENCIES=KES,UGX,TZS
```

---

## Security Notes

- **Never commit `.env` or `.env.local` to version control.** Both files are listed in `.gitignore`.
- The `JWT_SECRET` must be a cryptographically random string. Generate one with:
  ```bash
  openssl rand -hex 32
  ```
- LND macaroon files grant full node access. Keep them secure and never expose them publicly.
- For production, use a secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.) instead of `.env` files.

---

*Last updated: June 2026 | AfriPay MVP v1.0*
