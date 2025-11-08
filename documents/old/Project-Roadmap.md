# OmniMarkets Technical Plan ( v1 - open for more changes and updates)

## Overview

OmniMarkets is a cross-chain, privacy-first, AI-secured prediction market aggregator protocol with subjective/private market creation. It merges order routing and liquidity aggregation (PolyBet), oracle/dispute automation (PredictLayer), and zk-attested subjective markets (SubjectiveMarkets) for both public and personal event trading. The core stack deploys to BNB Chain (opBNB, Oasis Sapphire), with integrations to Solana and Ethereum.

---

## Folder/Repo Structure

omni-markets/ │ ├── contracts/ # Solidity, Circom: Markets, Oracles, Privacy │ ├── MarketAggregator.sol │ ├── PolyBetAdapters.sol │ ├── SubjectiveMarketFactory.sol │ ├── AIOracleDispute.sol │ ├── ZKAttestationVerifier.sol │ ├── MPCVerifierCoordinator.sol │ ├── ConfidentialBet.sol │ └── interfaces/ │ ├── frontend/ # Next.js (Web), React Native (Mobile) │ ├── pages/ │ │ ├── index.tsx # Homepage, unified dashboard │ │ ├── [marketId].tsx # Market/bet detail page │ │ ├── create/ # Market creation (public/private) │ │ ├── disputes/ # Dispute center & resolution status │ │ ├── portfolio/ # User bets, liquidity, winnings │ │ └── admin/ # Admins, oracles, protocol stats │ ├── components/ │ │ ├── MarketList.tsx │ │ ├── BetSlip.tsx │ │ ├── AggregateOrder.tsx │ │ ├── SubjectiveCreator.tsx │ │ ├── VerifierCircle.tsx │ │ ├── DisputePanel.tsx │ │ └── MobileUI/ # RN wrappers/components │ ├── hooks/ │ └── utils/ │ ├── services/ # Offchain: bots, AI, DAO, APIs │ ├── ai-oracle/ │ │ ├── monitor.py # Watches public event sources, detects anomalies │ │ └── proof_generator.py # ZK proofs of AI oracle "thinking" │ ├── market-syncer/ │ │ └── sync.js # Indexes/normalizes market data across protocols │ ├── subjective-oracle/ │ │ ├── attest.js # ZK attestation flows for private events │ │ └── mpc_vote.js # MPC/threshold tally for subjective resolutions │ └── dispute-bot/ │ └── bot.js # Auto-dispute trigger, reward claiming │ ├── shared/ # Shared types, utils, ABI, SDK │ ├── types/ │ ├── abis/ │ └── sdk/ │ ├── scripts/ # Deploy, migrate, test runners │ ├── deploy_all.js │ └── populate_demo.ts │ ├── docs/ │ ├── tech.md # << This Doc >> │ └── api.md │ └── README.md


---

---

## Core Modules & Major Functions

### 1. Market Aggregator Layer (PolyBet-Style)

**Features:**
- Cross-protocol market discovery, price normalization, liquidity aggregation
- Bet order split/routing for optimal payoff
- Cross-chain bridging abstraction

**Key Functions:**
- `aggregateMarkets()` Fetches and merges open markets (orderbook/LMSR)
- `routeOrder(betParams)` Optimally splits orders across protocols
- `placeBet(market, amount, side)` Abstraction handle for any market
- `bridgeOrder(order, targetChain)` For non-native execution

### 2. PredictLayer Oracle & Dispute Engine

**Features:**
- Offchain AI/NLP monitor for public and platform-aggregated events
- Triggers dispute when suspicious, cross-validated by multiple feeds
- ZK proof for AI model’s dispute flag (Circom/Noir for "explainability")
- Dispute bot network (incentivized w/ protocol reward pool)

**Key Functions:**
- `detectAnomaly(marketId)` AI checks if outcome seems manipulated/false
- `suggestDispute(marketId)` Recommend/rank markets to dispute
- `submitDispute(marketId, evidence)`
- `claimDisputeReward(disputeId)`
- `generateProof(input, modelOutput)` ZK proof of AI’s call
- `verifyProof(proof)`

### 3. Subjective Prediction Markets (Privacy + zkAttestation)

**Features:**
- Private market creation; only invited can view/trade
- zkKYC/zkAttestation for outcome verification (NebulaID or similar)
- MPC circle voting for resolution; outcome privacy
- On-chain payout for valid, threshold “approved” subjective events

**Key Functions:**
- `createMarket(type, meta, verifiers)` Open a new subjective/private market
- `submitAttestation(marketId, zkProof)` User/verifier attests to event privately
- `collectVotes(marketId, votes)`
- `finalResult(marketId)` Compute/return subjective outcome
- `settleMarket(marketId, result)`
- `privateTransfer(user1, user2, amount)` Via confidential contracts

### 4. Privacy, Identity & Account Abstraction

**Features:**
- All bet/order data hidden where enabled (Oasis Sapphire confidential contracts or local encryption)
- zkConnect-style identity (NebulaID); supports social login, MPC key backup
- Gasless transactions (ERC-4337/Paymasters)
- Anonymous interface for dispute submissions/voting via Semaphore/ZK

**Key Functions:**
- `onboardWithSocial(email/account)`
- `sponsorTx(transaction)` Sponsor/abstract gas
- `confidentialBet(market, betData)`

---

## UI Page Structure & Key Features

### `/` - Dashboard

- See trending, cross-chain markets (public/private)
- Show best odds/price per event, source/route, action button per platform
- “My Bets”, “My Markets”, “My Disputes” quick panels

### `/[marketId]` - Market Detail

- PolyBet: Price/odds aggregation, order book/LMSR tabs
- Subjective market: Only visible to allowed, called, or invited
- AI Oracle status, dispute triggers if event suspect

### `/create/` - Market Creator

- Select: Public vs private (subjective) flow
- UI for custom event, market parameters, invite verifier circle (private flow)
- Preview pledge, fee, bet structure

### `/portfolio/`

- Bet history, pending, resolved, and liquid markets
- Arbitrage and profit opportunities, bonus rewards

### `/disputes/`

- List active/resolved disputes
- See AI/Oracle breakdown, ZK proof explorer
- Claim reward if resolved/participated

### `/admin/` (only for admins/oracle managers)

- Submit/resolve manual disputes
- Sync/merge market data
- Protocol statistics, payout pools

---

## Services/Offchain Bots

- **ai-oracle/monitor.py** – Listens for market resolution, fetches news/APIs, scores outcome trust, flags for dispute
- **ai-oracle/proof_generator.py** – Generates zkSNARK for AI outcome/verdict, makes proof link public
- **market-syncer/sync.js** – Syncs/refreshes market/order/liquidity data from all sources
- **subjective-oracle/attest.js** – Handles private attestations on outcome for subjective markets
- **subjective-oracle/mpc_vote.js** – Coordinates secure voting by verifiers, MPC threshold logic
- **dispute-bot/bot.js** – Auto-disputes on flagged events, monitors for outcome, claims rewards

---

## Smart Contract Components

- **MarketAggregator.sol** – Main entry for searching/placing routed bets
- **PolyBetAdapters.sol** – Adapters/wrappers to onchain/non-native market sources
- **SubjectiveMarketFactory.sol** – Private/subjective event market creation
- **AIOracleDispute.sol** – Stores/executes disputes, integrates with offchain oracle
- **ZKAttestationVerifier.sol** – Onchain proof verifier for outcome attestations
- **MPCVerifierCoordinator.sol** – Onchain logic for subjective market MPC closure/tally
- **ConfidentialBet.sol** – Confidential/hidden trading feature set

---

## SDK & Shared

- **Types/ABI for:** Market, Bet, Order, Outcome, Proof, MarketSource
- **SDK Functions:** 
    - `queryMarkets()`
    - `submitBet()`
    - `initiateDispute()`
    - `fetchProof()`
    - `settleSubjectiveMarket()`
    - `voteMPC()`
- **Utils:** Cross-market, cross-chain helpers; ZK proof utilities

---

## MVP Development Prioritization

1. Market list & aggregator logic (show 2-3 public, 1 subjective demo market)
2. Cross-source bet routing (PolyBet)
3. PredictLayer AI monitor (flag/dispute via oracle bot + ZK proof stub)
4. Subjective market creation, simple attestation/voting, privacy flows
5. Clean and light frontend (desktop + mobile)
6. Demo admin dashboard & basic reward/custody smart contracts

---

## Stretch Goals

- Arbitrage automation/optimizer module
- DeFi LP interface for advanced liquidity
- Cross-chain multi-bet batching
- Explainer dashboard for AI/dispute logic

---

## Deployment

- **BNB Chain (opBNB):** Main contracts (aggregator, dispute, private market factory)
- **Oasis Sapphire:** Private/custodial/identity logic
- **Solana/Ethereum:** Market adapters, routing only; no confidential/trading logic
- **Offchain:** Oracle bots, AI scoring, ZK proofs

---

## Next Steps

- Assign owner/dev for each folder/module above  
- Scaffold all major function names as stubs  
- Demo flow: One public market, one subjective market, one flagged dispute (full E2E user story)

---

*This document serves as the comprehensive engineering plan for the MVP version of OmniMarkets. Each folder/module should have a corresponding maintainer and progress tracked per feature and API outlined above.*