# OmniMarkets: BSC-Only Implementation Plan
## YZi Labs Track - Prediction Markets Hackathon

---

## Executive Summary

**Goal**: Build a production-ready prediction market protocol on BSC that addresses YZi Labs' key opportunities:
1. **Faster Oracle Resolution** - AI-assisted dispute system with autonomous bots
2. **Gasless UX** - ERC-4337 account abstraction for seamless onboarding
3. **Subjective Markets** - Private, verifier-attested markets for non-public events
4. **Liquidity Aggregation** - Route orders across multiple sources efficiently

**Core Principle**: Keep all user assets, settlement, and critical UX on BSC. Use Oasis Sapphire as optional privacy co-processor without requiring users to bridge funds.

**Timeline**: 2 weeks MVP → 4 weeks Production-ready

---

## Architecture Overview

### On-Chain Layer (BSC/opBNB)

**Core Contracts**:
- `MarketAggregator.sol` - Market registry, order routing, settlement
- `AIOracleDispute.sol` - Dispute submission, voting, resolution, rewards
- `SubjectiveMarketFactory.sol` - Private markets with verifier circles
- `ERC4337 Integration` - EntryPoint + Paymaster for gasless UX

### Off-Chain Services (Node.js/TypeScript)

**Services**:
- `market-syncer` - Fetch/normalize markets from Polymarket, BNB AMMs, etc.
- `ai-oracle` - Monitor resolutions, fetch evidence, detect anomalies
- `dispute-bot` - Auto-submit disputes, claim rewards
- `subjective-oracle` - Coordinate verifier voting

### Data Layer

**PostgreSQL + Prisma**:
- Markets, external_markets, bet_slips, disputes, verifiers, users
- Indices on status, category, user for fast queries

### Frontend (Next.js 15)

**Pages**: Home, Market Detail, Create, Disputes, Portfolio, Admin
**Tech**: Wagmi, Viem, shadcn/ui, TailwindCSS, ERC-4337 SDK

---

## Privacy Strategy: Oasis Sapphire Integration

### Three Implementation Paths

**Option 1: BSC-Only MVP (Week 1-2)**
- Commit-reveal for subjective markets
- Merkle trees for vote aggregation
- Semaphore-style anonymous disputes
- **Pros**: Simple, fast, auditable
- **Cons**: Limited privacy (reveals after resolution)

**Option 2: Signed Results Bridge (Week 3)**
- Sapphire contract holds signer keys
- Relayer computes privately, signs results
- BSC verifies signatures
- **Pros**: Better privacy, moderate complexity
- **Cons**: Relayer trust assumptions

**Option 3: Full Messaging Bridge (Week 4+)**
- LayerZero/Hyperlane for BSC↔Sapphire
- Async co-processor pattern
- Full confidential compute
- **Pros**: Maximum privacy, decentralized
- **Cons**: Complex, higher latency

**Recommendation**: Start with Option 1, migrate to Option 2/3 post-hackathon.

---

## Smart Contract Specifications

### MarketAggregator.sol

**Core Functions**:
```solidity
createMarket(question, category, type, resolutionTime) → marketId
addExternalMarket(marketId, marketplace, externalId, price, liquidity)
createBetSlip(marketIds[], amounts[], outcomes[]) → betSlipId
recordBetPlaced(betSlipId, expectedPayout)
resolveMarket(marketId, outcome)
settleBet(betSlipId)
withdrawWinnings(betSlipId)
```

**Key Features**:
- Market registry with metadata
- External market tracking (Polymarket, AMMs)
- Bet slip management
- Settlement & payout logic
- Role-based access (ROUTER_ROLE, ORACLE_ROLE)

### AIOracleDispute.sol

**Core Functions**:
```solidity
submitDispute(marketId, evidenceHash, proposedOutcome) → disputeId
voteOnDispute(disputeId, support)
resolveDispute(disputeId)
claimReward(disputeId)
suggestDispute(marketId, evidenceHash) // AI oracle only
```

**Key Features**:
- Stake-based dispute submission (min 0.1 BNB)
- Voting period (3 days)
- Quorum requirement (100 BNB total weight)
- Reward distribution for honest actors
- Evidence storage (IPFS hashes)

### SubjectiveMarketFactory.sol

**Core Functions**:
```solidity
createMarket(question, verifiers[], threshold, resolutionTime) → marketId
commitOutcome(marketId, commitment)
revealOutcome(marketId, outcome, salt)
startCommitPhase(marketId)
startRevealPhase(marketId)
```

**Key Features**:
- Verifier circle management
- Commit-reveal mechanism
- Threshold-based resolution (e.g., 3/5)
- Automatic resolution when threshold met
- Phase transitions (Active → Commit → Reveal → Resolved)

---

## Service Specifications

### market-syncer

**Responsibilities**:
- Fetch markets from external sources (Polymarket, BNB AMMs, Azuro)
- Normalize pricing & liquidity data
- Cache in PostgreSQL via Prisma
- Expose REST API for frontend

**Adapters**:
- `PolymarketAdapter` - Fetch from Gamma API
- `BNBAMMAdapter` - Query BNB DEX contracts
- `AzuroAdapter` - Fetch from Azuro subgraph

**Schedule**: Sync every 5 minutes

### ai-oracle

**Responsibilities**:
- Monitor market resolutions on-chain
- Fetch evidence (NewsAPI, Twitter, web scraping)
- ML anomaly detection
- Generate dispute suggestions
- Store evidence on IPFS

**ML Model**:
- Input: Market outcome + external evidence
- Output: Confidence score (0-100%)
- Threshold: Flag if confidence < 70%

**Evidence Sources**:
- NewsAPI for news articles
- Twitter API for social sentiment
- Web scraping for event verification

### dispute-bot

**Responsibilities**:
- Listen to AI oracle flags
- Auto-submit disputes on-chain
- Monitor dispute outcomes
- Claim rewards automatically

**Strategy**:
- Submit if AI confidence < 50%
- Stake 0.1 BNB per dispute
- Max 5 concurrent disputes

### subjective-oracle

**Responsibilities**:
- Coordinate verifier voting
- Collect commitments & reveals
- Compute threshold results
- Submit final outcome on-chain

**Flow**:
1. Market reaches resolution time
2. Notify verifiers (email/push)
3. Collect commitments (1 day)
4. Collect reveals (1 day)
5. Compute majority outcome
6. Submit to SubjectiveMarketFactory

---

## Database Schema (Prisma)

```prisma
model Market {
  id              Int      @id @default(autoincrement())
  chainId         Int
  contractAddress String
  marketId        Int
  question        String
  category        String
  marketType      String   // 'public' | 'subjective'
  status          String   // 'active' | 'resolved' | 'disputed' | 'cancelled'
  resolutionTime  DateTime
  totalVolume     Decimal
  creator         String
  outcomeHash     String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  externalMarkets ExternalMarket[]
  betSlips        BetSlip[]
  disputes        Dispute[]
}

model ExternalMarket {
  id          Int      @id @default(autoincrement())
  marketId    Int
  marketplace String   // 'polymarket' | 'bnb-amm' | 'azuro'
  externalId  String
  price       Int      // basis points (0-10000)
  liquidity   Decimal
  lastUpdate  DateTime @default(now())
  
  market      Market   @relation(fields: [marketId], references: [id])
  
  @@unique([marketplace, externalId])
}

model BetSlip {
  id              Int      @id @default(autoincrement())
  user            String
  marketIds       Int[]
  amounts         Decimal[]
  outcomes        Int[]    // 0=NO, 1=YES
  totalAmount     Decimal
  expectedPayout  Decimal?
  actualPayout    Decimal?
  status          String   // 'pending' | 'placed' | 'settled' | 'cancelled'
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  markets         Market[]
}

model Dispute {
  id              Int      @id @default(autoincrement())
  marketId        Int
  submitter       String
  evidenceHash    String   // IPFS hash
  stake           Decimal
  status          String   // 'active' | 'resolved' | 'rejected' | 'expired'
  votesFor        Decimal  @default(0)
  votesAgainst    Decimal  @default(0)
  proposedOutcome Int
  submittedAt     DateTime @default(now())
  resolvedAt      DateTime?
  
  market          Market   @relation(fields: [marketId], references: [id])
  votes           Vote[]
}

model Vote {
  id         Int      @id @default(autoincrement())
  disputeId  Int
  voter      String
  support    Boolean
  weight     Decimal
  timestamp  DateTime @default(now())
  
  dispute    Dispute  @relation(fields: [disputeId], references: [id])
  
  @@unique([disputeId, voter])
}

model User {
  id         Int      @id @default(autoincrement())
  address    String   @unique
  aaWallet   String?  // ERC-4337 smart account
  nonce      Int      @default(0)
  createdAt  DateTime @default(now())
}
```

---

## Frontend Structure

### Pages

**/ (Home)**
- Market discovery grid
- Trending markets
- Category filters
- Search bar
- Quick stats (24h volume, active markets)

**/market/[id]**
- Market detail (question, category, resolution time)
- Price chart (historical)
- External markets table (marketplace, price, liquidity)
- Bet placement form
- Dispute panel (if disputed)

**/create**
- Market creation wizard
- Public vs Subjective toggle
- Question input
- Category selection
- Resolution time picker
- Verifier selection (subjective only)

**/disputes**
- Active disputes list
- Dispute detail modal
- Evidence viewer (IPFS)
- Voting interface
- Reward claim button

**/portfolio**
- Active bets table
- Settled bets history
- Winnings summary
- Withdraw button

**/admin**
- Protocol stats (TVL, volume, disputes)
- Market management
- Oracle configuration
- Paymaster balance

### Key Components

**MarketCard**
- Question, category, price
- Volume, liquidity
- "Bet Now" button

**BetSlip**
- Multi-market selection
- Amount inputs
- Expected payout calculation
- "Place Bet" button (gasless)

**DisputePanel**
- Evidence display
- Vote buttons
- Vote count
- Countdown timer

**VerifierSelector**
- Address input
- Threshold slider
- Verifier list

**AAWalletConnect**
- Social login (Google, Twitter)
- Email login
- Wallet connect fallback

---

## Week-by-Week Timeline

### Week 1: Foundation

**Day 1-2: Setup**
- Initialize monorepo
- Set up Hardhat + BSC testnet
- Create Prisma schema
- Deploy PostgreSQL (Railway/Supabase)

**Day 3-4: Contracts**
- Implement MarketAggregator.sol
- Implement AIOracleDispute.sol
- Implement SubjectiveMarketFactory.sol
- Write unit tests
- Deploy to BSC testnet

**Day 5-7: Services**
- Build market-syncer (Polymarket adapter)
- Build ai-oracle (evidence fetch stub)
- Build dispute-bot skeleton
- Set up job queues (Bull)

### Week 2: Integration

**Day 8-9: Frontend**
- Next.js setup + routing
- Home page + MarketCard
- Market detail page
- Bet placement flow

**Day 10-11: Gasless UX**
- ERC-4337 integration (Biconomy)
- Paymaster setup
- Social login (Privy/Dynamic)

**Day 12-13: Disputes**
- Dispute submission UI
- Voting interface
- Evidence viewer (IPFS)
- Reward claiming

**Day 14: Polish**
- End-to-end testing
- Bug fixes
- Demo video
- Documentation

---

## Post-Hackathon Roadmap

### Week 3-4: Production Hardening
- Security audit
- Gas optimization
- Error handling
- Monitoring (Sentry, Datadog)

### Week 5-6: Sapphire Integration
- Implement signed results bridge
- Deploy Sapphire contracts
- Test cross-chain messaging
- Privacy feature launch

### Week 7-8: Advanced Features
- Arbitrage detection
- LP interface
- Mobile app (React Native)
- Multi-chain expansion

---

## Success Metrics

**MVP (Week 2)**:
- 3+ contracts deployed & verified
- 10+ markets aggregated
- 1 subjective market created
- 1 dispute submitted & resolved
- Gasless transactions working

**Production (Month 1)**:
- 100+ markets
- 50+ users
- $10K+ volume
- 10+ disputes resolved
- <2s page load time

**Growth (Month 3)**:
- 1000+ markets
- 500+ users
- $100K+ volume
- 50+ subjective markets
- Mobile app launched

---

## Risk Mitigation

**Technical Risks**:
- Smart contract bugs → Audit + extensive testing
- AI oracle errors → Human override + dispute system
- Service downtime → Redundancy + monitoring
- Database failures → Backups + replication

**Product Risks**:
- Low liquidity → Bootstrap with incentives
- User adoption → Focus on UX + marketing
- Regulatory → Legal review + compliance

**Operational Risks**:
- Gas price spikes → Paymaster buffer + dynamic limits
- RPC rate limits → Multiple providers + caching
- IPFS availability → Pinata + Infura backup

---

## Next Steps

1. **Finalize tech stack decisions**
   - ERC-4337 provider (Biconomy vs Alchemy)
   - Database host (Railway vs Supabase)
   - IPFS provider (Pinata vs Infura)

2. **Set up development environment**
   - Create GitHub repo
   - Configure CI/CD
   - Set up staging environment

3. **Assign roles**
   - Smart contract dev
   - Backend dev
   - Frontend dev
   - DevOps/Infrastructure

4. **Kickoff Week 1**
   - Daily standups
   - Track progress in GitHub Projects
   - Weekly demo on Friday
