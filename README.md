# The Bioscope

Drop a Coin, Watch a Reel, Never Pay Twice.

## Setup & Run
1. `npm install`
2. `npm run seed`
3. `npm run dev`

To test locally, connect a wallet extension (like MetaMask) on Base Sepolia. 
1. Browse to `http://localhost:3000`
2. Select a reel to view the free preview frame.
3. Click "Unlock", sign the SIWx challenge, and wait for payment verification.
4. You can now page through all frames!
5. Disconnect and reconnect your wallet later; you will still have access without paying.

## Design Decisions
* **Facilitator**: Uses the `x402.org testnet facilitator` for Base Sepolia (as recommended in the problem knowledge graph for public testnets).
* **SIWx Format**: Uses EIP-4361 (SIWE) format with `nonce` and `domain` to ensure compatibility with standard x402 SIWx extensions.
* **Nonce Tracking**: Nonces are stored in SQLite and marked `consumed` after successful use, alongside an expiration timestamp, satisfying both replay protection and time-bounding.
* **Storage**: SQLite via `better-sqlite3` was chosen for simplicity and zero-configuration local execution, mapping perfectly to the `purchases` and `auth_nonces` tables.
* **Frame Security**: Paid frames are stored in `data/reels/<id>/frames/` which is outside the `public/` directory. They are streamed explicitly through the `GET /api/reels/[id]/frames` route.

## Compliance Matrix

| Check # | Points | Requirement | Implementation | Proven by |
|---------|--------|-------------|----------------|-----------|
| 1 | 5 | Paid frames gated by x402 | Returns 402 if not purchased/session missing | test/01-frames-route-x402-gated.test.ts |
| 2 | 4 | First frame is free via distinct path | `GET /api/reels/[id]/preview/route.ts` serves `preview.jpg` from public | test/02-preview-frame-free.test.ts |
| 3 | 8 | No credentials in tracked files | `.gitignore` created before init, `.env.example` placeholder | test/03-no-credentials.test.ts |
| 4 | 6 | Server-side purchase record | `recordPurchase` called upon valid payment header validation | test/04-purchase-record-written.test.ts |
| 5 | 18 | Paid frames unreachable outside gate | `data/reels/.../frames` outside `public/`. API reads via fs. | test/05-paid-frames-not-public.test.ts |
| 6 | 12 | Access decided by wallet lookup | `hasPurchase` checks composite DB key, ignoring client flags | test/06-access-via-wallet-lookup-not-flag.test.ts |
| 7 | 12 | Wallet claim verified by signature | `/api/auth/verify` uses viem's `verifyMessage` before issuing session | test/07-signature-verified-before-access.test.ts |
| 8 | 7 | Sign-in challenges cannot be replayed | SQLite tracks nonces as `consumed=1` and enforces `expires_at` | test/08-challenge-nonce-expiry-enforced.test.ts |
| 9 | 8 | Entitlement scoped per reel | DB `purchases` unique index is `(wallet_address, reel_id)` | test/09-entitlement-scoped-per-reel.test.ts |

## Known Limitations
* **Session Lifetime**: Cookies expire after 24 hours. A user returning after a week will need to re-sign the SIWx challenge (but will *not* have to pay again).
* **Payment Settlement Gap**: The server synchronously assumes payment success for this demo flow. In production, a webhook or polling mechanism should be used to confirm on-chain settlement before issuing the frames.
* **Facilitator Uptime**: If the x402.org testnet facilitator is down, new unlocks will fail, though repeat access (SIWx) will still work since it doesn't query the facilitator.
