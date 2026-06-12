#!/usr/bin/env bash
# AfriPay - Bitcoin Core Regtest Setup Script
# Installs Bitcoin Core, configures regtest mode, creates a funded wallet,
# and mines initial blocks for local development/demos.

set -euo pipefail

BITCOIN_VERSION="28.0"
BITCOIN_DIR="$HOME/.bitcoin"
WALLET_NAME="afripay-dev"
BLOCKS_TO_MINE=101  # 101 blocks so the first coinbase reward is spendable

echo "=== AfriPay Bitcoin Core Regtest Setup ==="

# 1. Install Bitcoin Core (if not already installed)
if ! command -v bitcoind &> /dev/null; then
    echo "[1/5] Installing Bitcoin Core v${BITCOIN_VERSION}..."
    cd /tmp
    ARCH=$(uname -m)
    if [ "$ARCH" = "x86_64" ]; then
        TARBALL="bitcoin-${BITCOIN_VERSION}-x86_64-linux-gnu.tar.gz"
    elif [ "$ARCH" = "aarch64" ]; then
        TARBALL="bitcoin-${BITCOIN_VERSION}-aarch64-linux-gnu.tar.gz"
    else
        echo "Unsupported architecture: $ARCH"
        exit 1
    fi

    wget -q "https://bitcoincore.org/bin/bitcoin-core-${BITCOIN_VERSION}/${TARBALL}"
    tar -xzf "$TARBALL"
    sudo install -m 0755 -o root -g root -t /usr/local/bin \
        "bitcoin-${BITCOIN_VERSION}/bin/bitcoind" \
        "bitcoin-${BITCOIN_VERSION}/bin/bitcoin-cli"
    rm -rf "bitcoin-${BITCOIN_VERSION}" "$TARBALL"
    echo "Bitcoin Core installed: $(bitcoind --version | head -n1)"
else
    echo "[1/5] Bitcoin Core already installed: $(bitcoind --version | head -n1)"
fi

# 2. Configure regtest mode
echo "[2/5] Configuring regtest mode..."
mkdir -p "$BITCOIN_DIR"
CONF_FILE="$BITCOIN_DIR/bitcoin.conf"

if [ ! -f "$CONF_FILE" ]; then
    cat > "$CONF_FILE" <<CONF
# AfriPay regtest configuration
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
CONF
    echo "Created $CONF_FILE"
else
    echo "$CONF_FILE already exists, skipping (edit manually if needed)"
fi

# 3. Start bitcoind
echo "[3/5] Starting bitcoind in regtest mode..."
if bitcoin-cli -regtest getblockchaininfo &> /dev/null; then
    echo "bitcoind already running"
else
    bitcoind -regtest
    sleep 3
fi

# 4. Create and load a funded wallet
echo "[4/5] Setting up wallet '$WALLET_NAME'..."
if bitcoin-cli -regtest listwallets | grep -q "$WALLET_NAME"; then
    echo "Wallet '$WALLET_NAME' already loaded"
else
    bitcoin-cli -regtest createwallet "$WALLET_NAME" 2>/dev/null || \
        bitcoin-cli -regtest loadwallet "$WALLET_NAME"
fi

ADDRESS=$(bitcoin-cli -regtest -rpcwallet="$WALLET_NAME" getnewaddress)
echo "Mining address: $ADDRESS"

# 5. Mine initial blocks to fund the wallet
echo "[5/5] Mining $BLOCKS_TO_MINE blocks to fund wallet..."
bitcoin-cli -regtest -rpcwallet="$WALLET_NAME" generatetoaddress "$BLOCKS_TO_MINE" "$ADDRESS" > /dev/null

BALANCE=$(bitcoin-cli -regtest -rpcwallet="$WALLET_NAME" getbalance)

echo ""
echo "=== Setup complete ==="
echo "Wallet: $WALLET_NAME"
echo "Balance: $BALANCE BTC"
echo "RPC: 127.0.0.1:18443 (user: afripay / pass: afripay)"
echo ""
echo "Try a test transaction:"
echo "  bitcoin-cli -regtest -rpcwallet=$WALLET_NAME sendtoaddress \$(bitcoin-cli -regtest -rpcwallet=$WALLET_NAME getnewaddress) 1.0"
echo "  bitcoin-cli -regtest -rpcwallet=$WALLET_NAME generatetoaddress 1 $ADDRESS"
