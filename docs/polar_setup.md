# Polar Setup Guide for AfriPay

This guide walks you through setting up a local Lightning Network (LN) development environment using [Polar](https://lightningpolar.com/), which lets you run simulated Bitcoin and Lightning nodes entirely on your machine — perfect for developing and testing AfriPay without touching real funds.

---

## Prerequisites

- **Docker Desktop** (or Docker Engine + Docker Compose): Polar uses Docker to run Bitcoin/LN node images.
- **Polar** v2.x or later: Download from [lightningpolar.com](https://lightningpolar.com/).

---

## 1. Install and Launch Polar

1. Download the Polar installer for your OS from the official site.
2. Install and open Polar. It will pull the required Docker images on first launch (this may take a few minutes).

---

## 2. Create a New Lightning Network

1. In Polar, click **"Create Network"**.
2. Configure the network:
   - **Name**: `AfriPay Dev`
   - **LND nodes**: Add at least **2** (e.g., `alice` and `bob`)
   - **Bitcoin backend**: `bitcoind` (default)
   - Leave all other settings at defaults.
3. Click **"Create"** and wait for all nodes to reach **Running** status (green indicators).

---

## 3. Fund the Nodes and Open Channels

Polar runs a `regtest` Bitcoin chain, so you can mine coins freely.

1. Click on the **`bitcoind`** node → **"Mine 1 block"** (repeat ~6 times to generate spendable UTXOs).
2. Click on the **`alice`** LND node → **"Deposit"** → deposit **1,000,000 sats** (1 mBTC).
3. Repeat for **`bob`** if needed.
4. Open a channel: click **`alice`** → **"Open Channel"** → select `bob` as the peer → set capacity to **500,000 sats** → confirm.
5. Mine another 6 blocks to confirm the channel on-chain.

---

## 4. Extract Alice's Credentials for AfriPay

AfriPay's Go backend connects to an LND node via its REST API. You need three pieces of information:

### 4a. REST API Host

In Polar, click on the **`alice`** node. Under **"Ports"**, note the **REST** port (e.g., `8081`).

The host to use is:
```
https://127.0.0.1:<REST_PORT>
```

Example:
```
https://127.0.0.1:8081
```

### 4b. Admin Macaroon (Hex-encoded)

The macaroon grants permission to control the node. Polar stores node files on disk.

1. In Polar, click **`alice`** → **"Actions"** → **"Show Files"** — this opens the file manager to alice's data directory.
2. Locate `data/chain/bitcoin/regtest/admin.macaroon`.
3. Copy its **full path**, then run the AfriPay utility to convert it to hex:

```bash
# From the backend directory
go run ./cmd/tools/macaroon_to_hex.go /path/to/admin.macaroon
```

> **Shortcut**: You can also use `xxd`:
> ```bash
> xxd -p -c 1000 /path/to/admin.macaroon | tr -d '\n'
> ```

### 4c. TLS Certificate Path

Polar generates a self-signed TLS cert for each node. Its path is in the same directory:

```
/path/to/polar/networks/<id>/volumes/lnd/alice/tls.cert
```

AfriPay's backend is configured to skip TLS verification in simulated/dev mode (`InsecureSkipVerify: true`), so you can leave `LND_TLS_CERT_PATH` blank during local development if preferred.

---

## 5. Configure the AfriPay Backend

Copy and fill in `backend/.env.example`:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
# Server configuration
PORT=8080

# SQLite configuration
DATABASE_URL=afripay.db

# JWT Secret configuration
JWT_SECRET=a-long-random-string-you-generate-here

# Lightning Network LND REST Node Configuration (from Polar)
LND_HOST=https://127.0.0.1:8081
LND_MACAROON=<hex-encoded-admin-macaroon>
LND_TLS_CERT_PATH=  # Leave blank to skip TLS verification in dev
```

---

## 6. Run the AfriPay Backend

```bash
cd backend
go run ./cmd/server
```

On startup you should see:

```
Database initialized at afripay.db. Running migrations...
Seeding demo users: alice, bob, charlie
Server starting on port 8080
```

### Verify LND Connectivity

```bash
curl http://localhost:8080/api/health
```

Expected (with Polar running):
```json
{
  "status": "OK",
  "database": "CONNECTED",
  "lightning": "OK",
  "node_alias": "alice",
  "synced": true,
  "simulated": false
}
```

If LND is not configured, the backend falls back to **simulated mode**:
```json
{
  "lightning": "DISCONNECTED",
  "node_alias": "AfriPay-Simulated-Node",
  "simulated": true
}
```

This simulated mode is perfectly fine for frontend development — all invoice creation and payment flows return deterministic fake data.

---

## 7. Demo Users

The database is automatically seeded with three users on first run:

| Username  | Password      | Currency | Starting Balance |
|-----------|---------------|----------|-----------------|
| `alice`   | `password123` | KES      | 100,000 sats    |
| `bob`     | `password123` | UGX      | 50,000 sats     |
| `charlie` | `password123` | KES      | 0 sats (arbitrator) |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Polar nodes not starting | Ensure Docker Desktop is running |
| `connection refused` on LND REST | Check the Polar port mapping; try `https://127.0.0.1:<port>` |
| Macaroon authentication error | Re-export the hex macaroon; ensure no whitespace in the `.env` value |
| `TLS handshake error` | Leave `LND_TLS_CERT_PATH` blank (backend uses `InsecureSkipVerify` in dev) |
| Balance shows 0 after registration | Mine 6 blocks in Polar and verify alice's deposit succeeded |

---

## Useful Polar Shortcuts

- **Mine blocks**: Click `bitcoind` → "Mine 1 block" (or use the slider for bulk mining)
- **Create invoice**: Click an LND node → "Create Invoice"
- **Pay invoice**: Click an LND node → "Pay Invoice"
- **View channels**: Click an LND node → "Channels" tab

---

*For more on Polar, see the [official documentation](https://docs.lightningpolar.com/).*
