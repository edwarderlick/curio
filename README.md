# Curio

A decentralized micro-lecture / course streaming platform on the Shelby protocol (decentralized hot storage, Aptos-coordinated), with multi-chain wallet payments across Aptos, Ethereum, and Solana.

Originally scaffolded from Google Stitch UI exports (`curio_landing_home`, `curio_explore_feed`, `curio_course_detail_locked`, `curio_system`), then rebuilt as a real, componentized app with zero fake data — everything you see is either live Shelbynet/on-chain state or an honest empty state.

## What was built

- **Frontend**: Vite + React + TypeScript + Tailwind v4, all 15 target screens, design tokens migrated verbatim from the Stitch exports.
- **Backend**: a small Express server (`server/`) that is (a) the v1 off-chain catalog index and (b) the Node-side real video transcode + Shelby upload pipeline (system FFmpeg required — browsers can't run FFmpeg).
- **Wallets**: real, independent Aptos / Ethereum / Solana connections. Ethereum and Solana derive their Shelby storage account via Derived Account Abstraction (DAA — `@shelby-protocol/ethereum-kit` / `solana-kit`); Aptos wallets are native. All three persist across reloads.
- **Payments**: real on-chain transactions — APT transfers on Shelbynet, ETH on Sepolia, SOL on Devnet (see "Network choices" below).
- **Upload pipeline**: real multi-bitrate HLS transcode via `@shelby-protocol/media-prepare` (system FFmpeg), real per-file blob uploads to Shelbynet via `@shelby-protocol/sdk`, streamed to the UI over Server-Sent Events with real per-stage progress — verified end-to-end against real generated test video, including a real `E_INSUFFICIENT_FUNDS` on-chain error when the dev account was underfunded.
- **Player**: `@shelby-protocol/player` (Shaka Player) streaming the real HLS manifest via range reads, with a Streaming Details panel reading real segment name/size/fetch-time off Shaka's own NetworkingEngine response filter.

## Running it

See [SETUP.md](SETUP.md) for the full walkthrough (CLI install, account funding, env vars). Short version:

```bash
cd app && npm install && cp .env.example .env
cd ../server && npm install && cp .env.example .env
# terminal 1
cd server && npm run dev
# terminal 2
cd app && npm run dev
```

## Architecture

```
app/        Vite + React + TS frontend
  src/
    components/ui/     Shared design-system layer (Button, Card, LectureCard, Empty/Loading/Error...)
    features/
      wallet/           Aptos/Ethereum/Solana connect, DAA, unified store
      payments/         Per-chain checkout (APT/ETH/SOL transfers) + unlock-grant recording
      upload/            5-step creator upload wizard
      player/            Composed Shaka player + real network waterfall
    lib/
      shelby/            Browser Shelby SDK client, blob URL construction
      chains/            wagmi/Solana config, live price feed, explorer links
      index/             v1 off-chain catalog client + React Query hooks
    pages/               One component per route

server/     Express — v1 catalog index (JSON file) + real transcode/upload pipeline
  src/
    media/               CmafPlanBuilder transcode, Shelby CLI signer, blob uploader
    jobs.ts              In-memory job state + SSE broadcast
    store.ts             JSON-file read/write (the on-chain migration seam)
```

## What's real vs. v1 off-chain shortcut

Everything not listed here is a real Shelbynet/Aptos/Ethereum/Solana call — there is no mock data path in this app; empty states mean the catalog is genuinely empty.

| Piece | Status |
|---|---|
| Wallet connections (Aptos native, Ethereum/Solana via DAA) | **Real** — real SDKs, real signing, real persisted reconnect |
| Video transcode | **Real** — real FFmpeg via `@shelby-protocol/media-prepare`, real multi-bitrate HLS output |
| Blob storage | **Real** — real per-file uploads to Shelbynet via `@shelby-protocol/sdk`, real on-chain blob registration transactions |
| Checkout payments | **Real** — real APT/ETH/SOL transfers, real transaction hashes, real explorer links |
| Video playback | **Real** — real Shaka Player streaming the real manifest via HTTP range reads |
| Streaming Details panel | **Real** — read directly off Shaka's NetworkingEngine; no simulated rows |
| Course/lecture catalog | **v1 off-chain** — a JSON file (`server/data/catalog.json`) behind a REST API. Every reader/writer is commented `TODO(on-chain-v2)`. Move to an Aptos indexer/GraphQL query once a Move module for course metadata exists. |
| Unlock grants (access control) | **v1 off-chain** — recorded in the same JSON file, keyed by wallet address + lecture ID, written only after a real confirmed on-chain payment. Gating happens at the app layer, not the Shelby storage layer (Shelby's per-read micropayment-channel mechanism for streaming isn't fully documented for client-side use yet). |
| Content "Renew" action | **v1 off-chain** — extends the tracked expiry in the catalog index only. The Shelby SDK (checked against `@shelby-protocol/sdk@0.3.1`) doesn't yet expose a blob-renewal/extend-duration method; once it does, that should replace this. |

## Network choices

- **Shelby**: Shelbynet — the only fully-operational Shelby network today (Shelby's own docs list `testnet` as "TBD"). Wiped roughly weekly.
- **Ethereum**: Sepolia, not mainnet — this is a dev-facing demo; asking testers to spend real ETH would be irresponsible. Swap in `app/src/lib/chains/wagmiConfig.ts`.
- **Solana**: Devnet, not mainnet-beta, for the same reason. Swap in `app/src/lib/chains/solanaConfig.ts`.

## Known upstream issues found and worked around

- `@shelby-protocol/player@0.1.1`'s published ESM build has broken relative imports (missing `.mjs` extensions throughout its barrel files) — crashes on load in any strict-ESM bundler (Vite/Rolldown/esbuild). Patched via `patch-package` (see `app/patches/`), auto-applied via a `postinstall` script. The CJS build was unaffected.
- `@shelby-protocol/media-prepare`'s actual published API (`hlsCmaf.planHlsCmaf()` builder, `render.ffmpegArgs()` on the builder chain, execution via `execFfmpeg`) differs from what's described in some reference docs (which describe a `CmafPlanBuilder` class with a `CmafPlanExecutor`) — the code here follows the real installed types, verified against a real end-to-end transcode run.
- `@shelby-protocol/react` had to be bumped from the docs-suggested `^0.0.5` to `^2.0.1` to match the `@shelby-protocol/sdk@0.3.1` peer dependency actually required by `ethereum-kit`/`solana-kit`.

## Known limitations / next steps

- Main JS bundle is code-split per route and per chain-ecosystem (`vite.config.ts`), but the Aptos SDK and Shaka Player chunks are still large (~1.3MB / ~1.7MB pre-gzip) — further reduction would mean deeper surgery (dynamic imports at SDK call sites, a lighter player) not worth it for v1.
- No creator authentication beyond "the connected wallet address is your creator identity" — fine for a single-owner demo, would need real session/auth for a multi-tenant product.
- Search/filter price-range and duration filters run client-side over the fetched result set; fine at demo scale, would move server-side (or into an Aptos indexer query) at real scale.
