# Bitcoin Core Regtest Setup

This guide sets up a local Bitcoin Core node in **regtest mode** for AfriPay
development and demos. Regtest is a private blockchain you control entirely —
blocks are mined instantly on demand, making it ideal for testing transactions
without real BTC or waiting for confirmations.

## Quick Start (Automated)

```bash
chmod +x docs/regtest_setup.sh
./docs/regtest_setup.sh
```

This installs Bitcoin Core (if missing), configures regtest, creates a wallet
named `afripay-dev`, and mines 101 blocks so you have spendable funds.

## Manual Setup

### 1. Install Bitcoin Core

```bash
wget https://bitcoincore.org/bin/bitcoin-core-28.0/bitcoin-28.0-x86_64-linux-gnu.tar.gz
tar -xzf bitcoin-28.0-x86_64-linux-gnu.tar.gz
sudo install -m 0755 -o root -g root -t /usr/local/bin bitcoin-28.0/bin/bitcoind bitcoin-28.0/bin/bitcoin-cli
```

Verify: `bitcoind --version`

### 2. Configure regtest

Create `~/.bitcoin/bitcoin.conf`:

```ini
regtest=1
server=1
daemon=1
txindex=1
fallbackfee=0.0002

[regtest]
rpcuser=afripay
rpcpassword=afripay
rpcport=18443
rpcbind=127.0.0.1
rpcallowip=127.0.0.1
```

### 3. Start the node

```bash
bitcoind -regtest
```

Check it's running:

```bash
bitcoin-cli -regtest getblockchaininfo
```

### 4. Create a funded wallet

```bash
bitcoin-cli -regtest createwallet "afripay-dev"
ADDRESS=$(bitcoin-cli -regtest -rpcwallet=afripay-dev getnewaddress)
bitcoin-cli -regtest -rpcwallet=afripay-dev generatetoaddress 101 $ADDRESS
```

> Why 101 blocks? Coinbase rewards require 100 confirmations before they're
> spendable. Mining 101 blocks gives you 1 mature, spendable block reward
> (50 BTC on regtest).

Check balance:

```bash
bitcoin-cli -regtest -rpcwallet=afripay-dev getbalance
```

## Creating Test Transactions

Send funds to a new address and confirm with a block:

```bash
NEWADDR=$(bitcoin-cli -regtest -rpcwallet=afripay-dev getnewaddress)
bitcoin-cli -regtest -rpcwallet=afripay-dev sendtoaddress $NEWADDR 1.0
bitcoin-cli -regtest -rpcwallet=afripay-dev generatetoaddress 1 $NEWADDR
bitcoin-cli -regtest -rpcwallet=afripay-dev getbalance
```

## Stopping the Node

```bash
bitcoin-cli -regtest stop
```

## Relation to Lightning (LND/Polar)

This regtest node can serve as the backing chain for the LND setup described
in [`polar_setup.md`](./polar_setup.md). Point Polar/LND's `bitcoind` backend
at `127.0.0.1:18443` using the `afripay` / `afripay` RPC credentials above.

## Troubleshooting

| Problem | Fix |
|---|---|
| `error: Could not connect to the server` | bitcoind isn't running — start it with `bitcoind -regtest` |
| `error: Wallet file verification failed` | Run `bitcoin-cli -regtest loadwallet afripay-dev` |
| Balance shows 0 after mining | Mine at least 101 blocks (coinbase maturity) |
| Port conflict on 18443 | Another regtest instance is running — `bitcoin-cli -regtest stop` first |