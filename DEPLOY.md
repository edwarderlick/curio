# Deploying Curio — all on Vercel, no server to manage

One piece, one host: **`app/`** (React/Vite frontend + `api/` serverless functions) →
**Vercel**. There's no separate Express server anymore — video uploads are signed
and sent straight from the browser to Shelby (via the connected wallet), and the
catalog index lives in Postgres instead of a JSON file on a VM's disk. No Docker,
no VM, no Caddy, no CORS setup.

(The old `server/` directory — Express + real ffmpeg transcode — is no longer used
by the app. It's kept around for reference; see the note at the bottom.)

---

## Part A — Add a Postgres database

The catalog (lectures, creators, unlock grants) lives in Postgres. Tables are
created automatically on first request — no migration step to run.

1. [vercel.com/new](https://vercel.com/new) → import the repo (do Part B first if
   you'd rather set the env vars at the same time — order doesn't matter).
2. In the project → **Storage** tab → **Create Database** → **Neon** (Postgres).
   Free tier is plenty for a demo. This automatically sets `DATABASE_URL` (and
   `POSTGRES_URL`) on the project — nothing to copy by hand.

---

## Part B — Deploy the app

1. Push this repo to GitHub if you haven't already.
2. [vercel.com/new](https://vercel.com/new) → import the repo.
3. Set **Root Directory** to `app`. Vercel auto-detects Vite (build command
   `npm run build`, output `dist`) — `app/vercel.json` already has this configured.
   The `api/` folder inside `app/` is picked up automatically as serverless
   functions — no separate config needed.
4. Add environment variables (Project Settings → Environment Variables) — same
   values as `app/.env.example`:
   ```
   VITE_SHELBY_NETWORK=shelbynet
   VITE_SHELBY_RPC_ENDPOINT=https://api.shelbynet.shelby.xyz/shelby
   VITE_APTOS_FULLNODE=https://api.shelbynet.shelby.xyz/v1
   VITE_APTOS_INDEXER=https://api.shelbynet.shelby.xyz/v1/graphql
   VITE_SHELBY_API_KEY=<your real geomi.dev key, optional>
   VITE_API_BASE_URL=

   APTOS_FULLNODE=https://api.shelbynet.shelby.xyz/v1
   SOLANA_RPC_ENDPOINT=
   ```
   (`DATABASE_URL`/`POSTGRES_URL` are already set by the Neon integration from Part A.)
5. Deploy.

That's it — one deployment, one URL. No second host, no `VITE_API_BASE_URL` to
point at a VM, no CORS origin to lock down (the API is same-origin with the app).

---

## Local full-stack development

`vite dev` alone won't serve `/api/*` (those are Vercel functions, not part of the
Vite dev server). Use the Vercel CLI instead, which runs both together:

```bash
npm install -g vercel
cd app
vercel link      # first time only — links this directory to the Vercel project
vercel env pull  # pulls DATABASE_URL and friends into .env.local
vercel dev
```

This serves the app and the `/api/*` functions on the same local port, exactly
like production. If you'd rather not link to a real Vercel project yet, set
`DATABASE_URL` in `app/.env.local` to any Postgres connection string (a local
Postgres, a free Neon branch, etc.) and `vercel dev` will still work.

---

## Verifying it actually works

- [ ] `https://<vercel-url>/explore` loads (catalog reads reach `/api/catalog/lectures`)
- [ ] Connect a wallet, click **Get testnet funds** — works client-side, unaffected by any of this
- [ ] Publish a short test lecture through the Studio upload wizard — this now
      prompts your wallet to sign the Shelby upload directly (no transcode step,
      it's a single raw-file blob write)
- [ ] Buy/unlock a lecture, confirm it plays
- [ ] Check the browser console for errors — there should be none Shelby/API-related
      now that everything is same-origin

## Redeploying after code changes

Just `git push` — Vercel redeploys automatically (app + API functions together).

---

## About `server/`

The old Express server (real ffmpeg transcode to multi-bitrate HLS, plus a
platform-owned Shelby signing key that uploaded on every creator's behalf) is no
longer wired up to the app. It's left in the repo for reference/rollback but isn't
part of the deployed system — nothing in `app/` imports or proxies to it anymore.
Safe to delete if you want a cleaner repo; nothing depends on it.
