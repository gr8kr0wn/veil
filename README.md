# VEIL — Private Finance. Onchain.

Private treasury, payments, and payroll on Solana using Helius Privacy Rings.

## Stack
- Next.js 16 + TypeScript + Tailwind
- Solana Wallet Adapter (Phantom, Solflare)
- Helius Privacy Rings (`@heliuslabs/spr`, pinned alpha)
- Solana Mainnet (set `NEXT_PUBLIC_SOLANA_NETWORK=devnet` for devnet)

## Run locally
Requires **Node 24+** (the Helius SPR SDK needs it).

```bash
cp .env.example .env.local   # add HELIUS_API_KEY
npm install
npm run dev
```

## Helius setup
- `HELIUS_API_KEY` is **server-only**. The browser never sees it.
- All RPC and SPR indexer/prover traffic goes through `/api/helius`, which forwards to Helius with the key attached server-side (same-origin only, rate limited, 512 KB body cap, `/v1/spr/**` + JSON-RPC paths only).
- Without a key the app falls back to the public Solana RPC (rate limited, not for real traffic) and "Sync Private" reports "Helius not configured".
- Confirmations use the public cluster websocket, because websockets can't pass through a route handler and a keyed ws URL would leak the key.

## Deploy (Vercel)
1. Set `HELIUS_API_KEY` in Project → Environment Variables.
2. Set **Node.js Version = 24.x** in Project → Settings → General.
3. In the Helius dashboard, restrict the key by allowed domain/IP as a second layer.
4. Optional: add a Vercel Firewall rate-limit rule for `/api/helius` (the in-app limiter is per instance).

`postinstall` runs `scripts/fix-wasm.mjs`, which copies the hasher `.wasm` files next to the bundles that reference them. Without it `next build` fails on `@lightprotocol/hasher.rs`.

## Scripts
`npm run dev` · `npm run build` · `npm run lint` · `npm run typecheck`

## Deployer address (for testnet SOL)
`2FkbWKkUkChFvxhTXrMK73nEpY7fuEaG8PPxUkjJsv1g`

Send Devnet SOL to the address above if a custom program deploy is required.

## Navigation
Home · Send (Payment / Batch / Payroll) · Treasury · Activity · Settings

## Privacy: what is and isn't hidden

Helius Privacy Rings (default ring) hide **amounts, assets and memos during private transfers**. They do **not** hide sender/recipient addresses or transaction hashes, and amounts are public at deposit and withdrawal. Full sender/recipient anonymity needs a Custom Enterprise Ring. The SDK (`@heliuslabs/spr@0.9.0-alpha`) is alpha and not for production funds yet.

## What works

Create Treasury, Deposit, Private Send, Batch/Payroll (up to 15 recipients, one transaction) and Withdraw are wired to the SPR SDK for **SOL**. Private keys are derived from one wallet signature and kept in memory only. Nothing secret is stored. Recipients must have run Create Treasury once before they can be paid.

Test on devnet first (`NEXT_PUBLIC_SOLANA_NETWORK=devnet`). SPL tokens are not wired yet.
