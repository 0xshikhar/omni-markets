our focus is YZi Labs Preferred Projects track


🔥Prediction markets are one of the most exciting frontiers in crypto. They blend data, social coordination, and incentives to create real-time oracles of truth.

Seedify is hosting a Prediction Markets Hackathon, collaborating with many key names, bringing together builders, developers, and creatives to explore this new territory and ship products that accelerate innovation in the prediction market ecosystem.

A MASSIVE prize pool of up to $400k, plus funding and other opportunities, is up for grabs. This is your chance to build breakthrough solutions that blend technical excellence, creativity, and real-world impact.



Tracks
1) General Track Projects: Any project revolving around prediction markets, be it a tool, integration, API, platform, infrastructure, etc., is welcome to submit. Refer Ideas tab to see some references.

Recommended Prediction Market Themes:

Niche Prediction Markets
Protocols / Infrastructure for Prediction Markets
Creative Thematic Apps
2) YZi Labs Preferred Projects:

UMA’s Optimistic Oracle (OO), which Polymarket depends on, is decentralized and transparent but slow (24–48h resolution). Opportunity: domain-specific or AI-assisted oracles for faster, contextual resolution. (CZ also mentions prediction market oracles as an opportunity area)- UMA OO can be vulnerable in low-liquidity, low-attention markets. Opportunity: build cross-protocol incentive layers to reward honest disputes, or autonomous dispute-bot networks to detect manipulation.
Prediction markets still feel like DeFi dApps: complex wallets, bridging, and gas. Opportunity: leverage account abstraction and gasless UX to make prediction markets feel like normal apps.
    Polymarket covers only well-defined, publicly verifiable events. Opportunity: solve for subjective or multi-stage predictions
    Liquidity is spread across many small markets. Opportunity: aggregators, routing layers, or AMM-style liquidity pools to concentrate and reuse capital efficiently.
    Don’t just predict the future. Build it.

# OmniMarkets — YZi Labs Track Plan (BSC-only)

## Scope & Alignment

- **BSC-only core**: All user-facing contracts and settlement live on BSC/opBNB. No user asset bridging required for MVP.
- **YZi focus fit**:
  - **Faster, contextual resolution**: AI-assisted dispute layer on BSC with autonomous dispute bots.
  - **Gasless UX**: ERC-4337 smart accounts + paymaster for sponsorship on BSC.
  - **Subjective/multi‑stage markets**: Private markets with verifier circles, commit–reveal for MVP.
  - **Liquidity routing**: Aggregator + router to concentrate/reuse capital across sources.

## High-Level Architecture (BSC-only core)

- **On-chain (BSC/opBNB)**
  - `MarketAggregator.sol` — aggregate markets, route orders, record results.
  - `AIOracleDispute.sol` — dispute registry, staking, rewards, bot hooks.
  - `SubjectiveMarketFactory.sol` — create private/subjective markets; verifier lists; threshold config.
  - `EntryPoint/AA` — ERC-4337 integration for gasless actions (sponsor via paymaster).

- **Off-chain services (TypeScript/Node)**
  - `services/market-syncer` — fetch/normalize markets (Polymarket API, BNB AMMs, others), write to Postgres (Prisma).
  - `services/ai-oracle` — monitor resolutions, fetch evidence (APIs/news), score anomalies, suggest disputes.
  - `services/dispute-bot` — auto-submit disputes on-chain, claim rewards.

- **Data**
  - `Prisma + PostgreSQL (managed cloud)` — market cache, prices, disputes, indices. No Supabase in MVP.

## Privacy Strategy: Using Oasis Sapphire as a Co‑Processor (while staying BSC-only)

Goal: keep all critical UX and settlement on BSC, but offload sensitive computations/state to a confidential EVM (Oasis Sapphire) when privacy is required.

Patterns we can use incrementally:

1) **Asynchronous co‑processor via messaging bridge**
   - Flow:
     1. BSC contract emits an intent/commitment (e.g., hash of private bet params or attestation request).
     2. A relayer posts an encrypted call to a Sapphire contract that processes sensitive logic privately.
     3. Sapphire emits a result (e.g., outcome, Merkle root, commitment). A general messaging protocol (e.g., LayerZero/Hyperlane class) relays this back to BSC.
     4. BSC contract updates public state with minimal disclosure (commitment match, aggregate result), preserving privacy.
   - Tradeoffs: inherits messaging trust assumptions; keeps user assets and finality on BSC.

2) **BSC-only MVP with cryptographic fallbacks (no cross-chain yet)**
   - Use commit–reveal, salted commitments, and optional Semaphore-style anonymity for disputes.
   - zkAttestation stubs (e.g., NebulaID-style proof interface) verified on BSC without moving assets.
   - Later, swap the prover backend to Sapphire (or other zk/TEE) without changing BSC contract interfaces.

3) **Signed results with anchored keys (interim)**
   - Sapphire contract publishes a registry of authorized signer keys.
   - A trusted relayer submits signed outputs to BSC; BSC verifies signatures against the anchored registry.
   - Lower integration overhead than full cross-chain messaging; clearly documented trust model.

What stays private with Sapphire sidecar (when enabled):
- Bet parameters and position sizes (only commitments on BSC).
- Verifier identities and individual votes for subjective markets.
- Intermediate oracle evidence and scoring.

What remains public on BSC:
- Market creation, final outcomes, payouts, dispute stakes/rewards.

Note: Choice of bridge/messaging is pluggable. We will document assumptions explicitly and start with a conservative, audit-friendly path.

## MVP Deliverables (2-week hack plan)

- **Week 1**
  - Contracts: `MarketAggregator.sol`, `AIOracleDispute.sol`, `SubjectiveMarketFactory.sol` scaffolds on BSC testnet.
  - Services: `market-syncer`, `ai-oracle` (evidence fetch + anomaly score stub), `dispute-bot` skeleton.
  - Frontend: Next.js minimal screens — Home (markets), Market Detail, BetSlip, Disputes.
  - Data: Prisma schema + migrations on managed Postgres.

- **Week 2**
  - Routing: basic aggregator + route execution stubs (record-only for demo; no external execution needed for MVP).
  - Oracle/disputes: end‑to‑end dispute flow (submit → resolve → reward) with AI suggestion.
  - Subjective markets: commit–reveal outcome with verifier threshold (simple majority), private data as commitments.
  - Gasless UX: ERC‑4337 integration + paymaster for at least one user flow (e.g., submit dispute).
  - Privacy POC: local Sapphire contract demo or mocked sidecar returning commitments; interface stable on BSC.

## Concrete Next Steps

- **Decide messaging**: shortlist LayerZero/Hyperlane class for Sapphire↔BSC result relay (configurable adapter).
- **Stabilize interfaces**: finalize BSC contract events/structs to keep Sapphire optional.
- **Keys & trust**: if using signed-results interim, publish signer registry and rotate keys policy.
- **AA integration**: choose bundler + paymaster provider for BSC testnet.
- **Security**: add invariant tests for disputes/rewards; document privacy assumptions in README.

## Key Functions (BSC contracts)

- `aggregateMarkets()` — index/normalize external markets (off-chain compute, on-chain receipts optional).
- `routeOrder(betParams)` — record routed order intent; for MVP, demonstrate accounting without external execution.
- `submitDispute(marketId, evidenceHash)` — open dispute with stake; bot can automate.
- `resolveDispute(disputeId, result)` — resolution with rewards distribution.
- `createMarket(question, verifiers, threshold)` — subjective market creation.
- `commitOutcome(marketId, commitment)` / `revealOutcome(marketId, salt, outcome)` — MVP privacy path.

## Tech Stack

- Contracts: Solidity (BSC), optional Sapphire sidecar later.
- Services: Node.js/TypeScript, Prisma ORM, PostgreSQL (managed).
- Frontend: Next.js, Wagmi/Viem, shadcn/ui, ERC‑4337 wallet kit.

---

## 📚 Detailed Documentation

We've created comprehensive implementation plans:

1. **[BSC-Implementation-Plan.md](./BSC-Implementation-Plan.md)** - Complete architecture, timeline, success metrics
2. **[Contract-Specifications.md](./Contract-Specifications.md)** - Full smart contract specs with interfaces
3. **[Development-Guide.md](./Development-Guide.md)** - Step-by-step setup and development workflow

### Quick Navigation

**Architecture & Strategy**:
- BSC-only core with Oasis Sapphire as optional privacy co-processor
- Three privacy integration paths (commit-reveal → signed results → full messaging)
- ERC-4337 for gasless UX
- AI-assisted oracle with autonomous dispute bots

**Smart Contracts** (BSC/opBNB):
- `MarketAggregator.sol` - Market registry, bet routing, settlement
- `AIOracleDispute.sol` - Dispute submission, voting, rewards
- `SubjectiveMarketFactory.sol` - Private markets with verifier circles

**Services** (Node.js/TypeScript):
- `market-syncer` - Fetch/normalize markets from Polymarket, BNB AMMs
- `ai-oracle` - Monitor resolutions, detect anomalies, suggest disputes
- `dispute-bot` - Auto-submit disputes, claim rewards
- `subjective-oracle` - Coordinate verifier voting

**Data Layer**:
- PostgreSQL + Prisma ORM
- Schema: markets, external_markets, bet_slips, disputes, votes, users

**Frontend** (Next.js 15):
- Pages: Home, Market Detail, Create, Disputes, Portfolio, Admin
- Wagmi + Viem for Web3, shadcn/ui for components
- ERC-4337 integration for gasless transactions

### Timeline

**Week 1**: Contracts + Services + Database setup
**Week 2**: Frontend + Gasless UX + Disputes + Polish

**Post-Hackathon**: Security audit → Sapphire integration → Advanced features

---

## 🚀 Getting Started

See **[Development-Guide.md](./Development-Guide.md)** for complete setup instructions.

Quick start:
```bash
# Clone and setup
git clone <repo>
cd omni-markets
bun install

# Deploy contracts
cd contracts
bunx hardhat run scripts/deploy-all.ts --network bscTestnet

# Start services
cd services/market-syncer && bun run dev
cd services/ai-oracle && bun run dev

# Start frontend
cd frontend && bun run dev
```

---

## 📊 Success Metrics

**MVP (Week 2)**:
- ✅ 3+ contracts deployed & verified on BSC testnet
- ✅ 10+ markets aggregated from external sources
- ✅ 1 subjective market created & resolved
- ✅ 1 dispute submitted & resolved
- ✅ Gasless transactions working

**Production (Month 1)**:
- 100+ markets, 50+ users, $10K+ volume
- 10+ disputes resolved, <2s page load

---

## 🔐 Privacy Strategy Summary

**Option 1 (MVP)**: BSC-only with commit-reveal
- Simple, fast, auditable
- Limited privacy (reveals after resolution)

**Option 2 (Week 3)**: Signed results from Sapphire
- Better privacy, moderate complexity
- Relayer trust assumptions

**Option 3 (Week 4+)**: Full messaging bridge (LayerZero/Hyperlane)
- Maximum privacy, decentralized
- Complex, higher latency

**Recommendation**: Start with Option 1, migrate to Option 2/3 post-hackathon.

---

## 🎯 YZi Labs Alignment

Our solution directly addresses all YZi Labs priorities:

1. **Faster Oracle Resolution** ✅
   - AI-assisted dispute system with autonomous bots
   - 3-day voting period vs 24-48h UMA resolution
   - Evidence-based anomaly detection

2. **Gasless UX** ✅
   - ERC-4337 smart accounts + paymaster
   - Social login (Google, Twitter, Email)
   - No bridging required (BSC-only)

3. **Subjective Markets** ✅
   - Private markets with verifier circles
   - Commit-reveal for privacy
   - Threshold-based resolution (e.g., 3/5)

4. **Liquidity Aggregation** ✅
   - Route orders across Polymarket, BNB AMMs, etc.
   - Price normalization & optimal allocation
   - Concentrated liquidity pools

---

## 📝 Next Actions

1. **Review documentation** - Read BSC-Implementation-Plan.md
2. **Set up environment** - Follow Development-Guide.md
3. **Deploy contracts** - Use scripts in Contract-Specifications.md
4. **Build services** - Implement adapters & oracle logic
5. **Create frontend** - Build UI components & pages
6. **Test end-to-end** - Submit bet → dispute → resolve
7. **Prepare demo** - Video + live demo on testnet

---

## 🤝 Team Roles

- **Smart Contract Dev**: Implement & test contracts
- **Backend Dev**: Build services (syncer, oracle, bots)
- **Frontend Dev**: Create UI with Next.js + Wagmi
- **DevOps**: Set up CI/CD, monitoring, deployment

---

## 📞 Support

- GitHub Issues: Track bugs & features
- Discord: Real-time team communication
- Documentation: Refer to docs/ folder