# Curio

A decentralized micro-lecture / course streaming platform on the Shelby protocol (decentralized hot storage, Aptos-coordinated), with multi-chain wallet payments across Aptos, Ethereum, and Solana.

Originally scaffolded from Google Stitch UI exports (`curio_landing_home`, `curio_explore_feed`, `curio_course_detail_locked`, `curio_system`), then rebuilt as a real, componentized app with zero fake data — everything you see is either live Shelbynet/on-chain state or an honest empty state.

## What was built

- **Frontend**: Vite + React + TypeScript + Tailwind v4, all 15 target screens, design tokens migrated verbatim from the Stitch exports.
- **Backend**: none, by design. `app/api/` is a handful of small Vercel serverless functions backing the catalog index (Postgres via Neon) — there's no persistent process, no ffmpeg, no server-held signing key. See "Architecture" below.
- **Wallets**: real, independent Aptos / Ethereum / Solana connections. Ethereum and Solana derive their Shelby storage account via Derived Account Abstraction (DAA — `@shelby-protocol/ethereum-kit` / `solana-kit`); Aptos wallets are native. All three persist across reloads.
- **Payments**: real on-chain transactions — APT transfers on Shelbynet, ETH on Sepolia, SOL on Devnet (see "Network choices" below).
- **Upload pipeline**: the raw source file is uploaded directly from the browser to Shelbynet via `@shelby-protocol/sdk`, signed by whichever wallet is connected (Petra, or a DAA-derived signer for Ethereum/Solana) — no transcode step, no intermediate server. Verified end-to-end against a real generated test video, including a real `E_INSUFFICIENT_FUNDS` on-chain error when the account was underfunded.
- **Player**: a plain HTML5 `<video>` element streaming the raw file straight off Shelby's RPC (which serves blobs over HTTP range requests). No adaptive-bitrate ladder — there's only ever one rendition now, so there's nothing to switch between.

## Running it

See [SETUP.md](SETUP.md) for the full walkthrough (CLI install, account funding, env vars). Short version:

```bash
cd app && npm install && cp .env.example .env
npm install -g vercel && vercel link && vercel env pull
vercel dev
```

## Architecture

```
app/        Vite + React + TS frontend + Vercel serverless API
  api/
    catalog/             Lectures/creators/unlock-grants CRUD (Postgres via Neon)
    _lib/                 DB client (schema auto-created), on-chain payment verification
  src/
    components/ui/     Shared design-system layer (Button, Card, LectureCard, Empty/Loading/Error...)
    features/
      wallet/           Aptos/Ethereum/Solana connect, DAA, unified store, storage signer picker
      payments/         Per-chain checkout (APT/ETH/SOL transfers) + unlock-grant recording
      upload/            5-step creator upload wizard — direct-to-Shelby, wallet-signed
      player/            Plain <video> playback
    lib/
      shelby/            Browser Shelby SDK client, blob URL construction
      chains/            wagmi/Solana config, live price feed, explorer links
      index/             Catalog client (talks to app/api/catalog) + React Query hooks

server/     Legacy — Express + real ffmpeg transcode + platform Shelby signer.
            No longer used by the app; kept for reference. See DEPLOY.md.
```

## What's real vs. off-chain shortcut

Everything not listed here is a real Shelbynet/Aptos/Ethereum/Solana call — there is no mock data path in this app; empty states mean the catalog is genuinely empty.

| Piece | Status |
|---|---|
| Wallet connections (Aptos native, Ethereum/Solana via DAA) | **Real** — real SDKs, real signing, real persisted reconnect |
| Video upload | **Real** — direct browser → Shelbynet blob write via `@shelby-protocol/sdk`/`@shelby-protocol/react`, signed by the connected wallet, real on-chain blob registration transactions. No transcode (single rendition, uploaded as-is). |
| Blob storage | **Real** — same as above; deletion is also real (`useDeleteBlobs`, signed by the creator's own wallet) |
| Checkout payments | **Real** — real APT/ETH/SOL transfers, real transaction hashes, real explorer links |
| Video playback | **Real** — plain `<video>` streaming the real blob via HTTP range reads |
| Course/lecture catalog | **Off-chain** — Postgres (Neon) behind `app/api/catalog/*` serverless functions, replacing the old server's JSON file. Still the seam to swap for an Aptos indexer/GraphQL query once a Move module for course metadata exists — see `app/api/_lib/db.ts`. |
| Unlock grants (access control) | **Off-chain** — same Postgres table, keyed by wallet address + lecture ID, written only after `app/api/catalog/unlock-grants` verifies the payment really happened on-chain (this check has to stay server-side — see the comment in `app/api/_lib/paymentVerify.ts`). Gating happens at the app layer, not the Shelby storage layer. |
| Content "Renew" action | **Off-chain** — extends the tracked expiry in the catalog index only. The Shelby SDK (checked against `@shelby-protocol/sdk@0.3.1`) doesn't yet expose a blob-renewal/extend-duration method; once it does, that should replace this. |

## Network choices

- **Shelby**: Shelbynet — the only fully-operational Shelby network today (Shelby's own docs list `testnet` as "TBD"). Wiped roughly weekly.
- **Ethereum**: Sepolia, not mainnet — this is a dev-facing demo; asking testers to spend real ETH would be irresponsible. Swap in `app/src/lib/chains/wagmiConfig.ts`.
- **Solana**: Devnet, not mainnet-beta, for the same reason. Swap in `app/src/lib/chains/solanaConfig.ts`.

## Known upstream issues found and worked around

- `@shelby-protocol/react` had to be bumped from the docs-suggested `^0.0.5` to `^2.0.1` to match the `@shelby-protocol/sdk@0.3.1` peer dependency actually required by `ethereum-kit`/`solana-kit`.
- `@vercel/postgres` is deprecated in favor of Neon's native `@neondatabase/serverless` driver (Vercel's own migration guide) — `app/api/_lib/db.ts` uses the latter directly.

## Known limitations / next steps

- Main JS bundle is code-split per route and per chain-ecosystem (`vite.config.ts`), but the Aptos SDK chunk is still large (~1.3MB pre-gzip) — further reduction would mean dynamic imports at SDK call sites, not worth it for v1.
- No creator authentication beyond "the connected wallet address is your creator identity" — fine for a single-owner demo, would need real session/auth for a multi-tenant product.
- Single rendition, no adaptive bitrate — dropping ffmpeg means every viewer gets the file exactly as uploaded. Fine for short micro-lectures; would need a transcode step again (client-side via ffmpeg.wasm, or a dedicated function with an ffmpeg layer) for long-form or bandwidth-constrained playback.
- Search/filter price-range and duration filters run client-side over the fetched result set; fine at demo scale, would move server-side (or into an Aptos indexer query) at real scale.
- The catalog delete ownership check (`app/api/catalog/lectures/[id]/index.ts`) is a plain string comparison against a client-supplied wallet address, not a verified signature — matches the strength of the original server's check, not hardened further here.
