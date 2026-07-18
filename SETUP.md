# Curio — Setup

Curio runs against **Shelbynet**, the only fully-operational Shelby network today (Shelby's own docs list `testnet` as "TBD"). Shelbynet is wiped roughly weekly — don't store anything you need to keep.

## Prerequisites

- Node.js 20+
- A terminal that supports raw-mode input (for the interactive `shelby init` wizard — Git Bash / most CI shells do not; use PowerShell, a native terminal, or pass flags non-interactively as shown below)
- **System FFmpeg v7+, on PATH.** `@shelby-protocol/media-prepare` (the transcode pipeline in `server/`) shells out to a real `ffmpeg`/`ffprobe` binary — this is not an npm package. Everything else in the app works without it; only the Studio upload wizard's Processing step needs it.
  - Windows: `winget install --id Gyan.FFmpeg -e`, then open a **new** terminal (PATH updates don't apply to already-open shells)
  - macOS: `brew install ffmpeg`
  - Linux: `apt install ffmpeg` / your distro's equivalent
  - Verify with `ffmpeg -version` and `ffprobe -version`

## 1. Clone and install

```bash
git clone <this-repo>
cd curio
cd app && npm install
cd ../server && npm install
```

## 2. Install the Shelby CLI

```bash
npm install -g @shelby-protocol/cli
shelby --version
```

## 3. Create your account and switch to Shelbynet

```bash
shelby init                 # interactive wizard — creates ~/.shelby/config.yaml
# or, if your terminal doesn't support raw-mode input:
shelby context use shelbynet
shelby account create --name dev
```

This writes `~/.shelby/config.yaml` with a `shelbynet` context (RPC `https://api.shelbynet.shelby.xyz/shelby`, Aptos fullnode `https://api.shelbynet.shelby.xyz/v1`) and a real Aptos keypair. **Never commit this file or its private key.**

## 4. Fund your account

```bash
shelby faucet --network shelbynet --no-open
```

This prints two faucet URLs (APT gas + ShelbyUSD upload fees) pre-filled with your address — open them in a browser and click **Fund**. Verify with:

```bash
shelby account balance -c shelbynet
```

**Note on ShelbyUSD amounts:** the faucet drips a small amount per click (~0.1–0.2 ShelbyUSD) and rate-limits repeated requests. A single real multi-rendition HLS upload (Step 7's pipeline) registers one blob per segment/playlist file on-chain and costs more than one drip covers — if you hit `E_INSUFFICIENT_FUNDS` while testing the upload wizard, click **Fund** a few more times, spaced a few seconds apart, until `shelby account balance` shows enough. This was verified directly: a real transcode + multi-file Shelby upload runs end-to-end and fails with this exact real on-chain error when underfunded, then proceeds once topped up.

## 5. Configure environment variables

```bash
cp app/.env.example app/.env
cp server/.env.example server/.env
```

Edit `server/.env` and set `SHELBY_CLI_ACCOUNT_NAME` to the account name you created in step 3 (e.g. `dev`). Optionally get a self-serve API key at [geomi.dev](https://geomi.dev) and set it in both `.env` files to raise rate limits above the anonymous tier.

## 6. Run the app

```bash
# terminal 1 — v1 off-chain catalog index + transcode pipeline
cd server && npm run dev

# terminal 2 — frontend
cd app && npm run dev
```

Open http://localhost:5173. The catalog starts empty (zero fake data) — publish a lecture through `/studio/upload` to see it populate Explore/Landing/Search.

## What's real vs. v1 shortcut

See the root `README.md` for the full breakdown — short version: wallet connections, on-chain payments, and Shelby blob storage are real Shelbynet calls; the course/lecture catalog and unlock-grant records are a local JSON index in `server/data/catalog.json` (clearly commented in code as the piece to move on-chain next).
