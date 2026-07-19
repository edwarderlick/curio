# Curio — Setup

Curio runs against **Shelbynet**, the only fully-operational Shelby network today (Shelby's own docs list `testnet` as "TBD"). Shelbynet is wiped roughly weekly — don't store anything you need to keep.

## Prerequisites

- Node.js 20+
- The [Vercel CLI](https://vercel.com/docs/cli) (`npm install -g vercel`) — local dev runs the app and its `api/` serverless functions together via `vercel dev`, since `vite dev` alone doesn't serve `/api/*`.
- A browser wallet extension for at least one of: [Petra](https://petra.app) (Aptos), MetaMask (Ethereum), Phantom (Solana). No Shelby CLI or local account setup needed — uploads are signed by whichever wallet you connect in the app itself.

No FFmpeg needed either — uploads go straight from the browser to Shelby as-is, no transcode step.

## 1. Clone and install

```bash
git clone <this-repo>
cd curio/app
npm install
```

## 2. Add a Postgres database

The catalog (lectures, creators, unlock grants) needs Postgres. Easiest path:
create a Vercel project for this repo (root directory `app`), then in that
project's **Storage** tab → **Create Database** → **Neon**. That sets
`DATABASE_URL` for you automatically — nothing to copy by hand once you `vercel
link` + `vercel env pull` below. (Any other Postgres connection string works too
if you'd rather not use Vercel/Neon — just set `DATABASE_URL` yourself.)

## 3. Configure environment variables

```bash
cp .env.example .env
```

Optionally get a self-serve API key at [geomi.dev](https://geomi.dev) and set
`VITE_SHELBY_API_KEY` to raise rate limits above the anonymous tier.

## 4. Run the app

```bash
vercel link      # first time only — links this directory to a Vercel project
vercel env pull  # pulls DATABASE_URL (from step 2) into .env.local
vercel dev
```

Open the local URL it prints (usually http://localhost:3000). The catalog starts
empty (zero fake data) — connect a wallet, click **Get testnet funds** (top nav)
to fund it on Shelbynet, then publish a lecture through `/studio/upload` to see
it populate Explore/Landing/Search.

## What's real vs. off-chain shortcut

See the root `README.md` for the full breakdown — short version: wallet
connections, on-chain payments, and Shelby blob storage/upload/delete are real
Shelbynet calls made directly from the browser; the course/lecture catalog and
unlock-grant records live in Postgres behind `app/api/catalog/*` (serverless
functions, not a persistent server — clearly commented in code as the piece to
move on-chain next).
