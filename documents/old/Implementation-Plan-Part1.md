# OmniMarkets: Detailed Implementation Plan (Part 1)

## Project Overview

**Tech Stack**: Next.js 15, Node.js/TypeScript, Solidity, BNB Chain, Oasis Sapphire

**Timeline**: 12 weeks (MVP)

**Team Structure**:
- 2-3 Full-stack developers
- 1 Smart contract developer
- 1 DevOps/Infrastructure
- 1 ML/AI engineer (for oracle)

---

## Phase 1: Foundation (Weeks 1-2)

### Week 1: Project Setup

**Day 1-2: Monorepo Structure**
```bash
# Initialize project
mkdir omni-markets && cd omni-markets
npm init -y
npm install -D turbo typescript

# Create workspace structure
mkdir -p contracts services/{market-syncer,ai-oracle,subjective-oracle,dispute-bot}
mkdir -p frontend mobile shared/{types,abis,sdk,utils} docs
```

**Day 3-4: Smart Contracts Setup**
- Initialize Hardhat in `/contracts`
- Configure networks: BNB Testnet, opBNB, Oasis Sapphire
- Port PolyBet.sol → MarketAggregator.sol
- Write deployment scripts

**Day 5: Database Setup** ( no supabase - will be using prisma + postgrel cloud only)
- Run SQL schema (markets, marketplaces, external_markets, bet_slips, etc.)
- Generate TypeScript types

### Week 2: Frontend Foundation

**Day 1-2: Next.js Setup**
- Initialize Next.js 15 with App Router
- Install dependencies: Wagmi, Viem, TailwindCSS, shadcn/ui
- Create layout & navigation
- Set up wallet connection (Reown AppKit)

**Day 3-4: Core Components**
- Build MarketCard, MarketList components
- Create BetSlip component
- Implement basic routing (/, /[marketId], /portfolio)

**Day 5: Integration**
- Connect frontend to prisma + postgrel cloud
- Implement market fetching
- Test wallet connection & contract interaction

---

## Phase 2: Market Aggregation (Weeks 3-4)

### Week 3: Market Syncer Service

**Implementation**:
```typescript
// services/market-syncer/src/index.ts
import { MarketSyncer } from './syncer';

const syncer = new MarketSyncer();

// Sync every 5 minutes
setInterval(() => syncer.syncPrices(), 5 * 60 * 1000);
```

**Tasks**:
- Build Solana adapter (inherit from PolyBets)
- Build Polymarket adapter (orderbook)
- Build BNB Chain adapter (LMSR/AMM)
- Implement price normalization
- Store in Supabase

### Week 4: Bet Routing

**Implementation**:
```typescript
// services/bet-router/src/router.ts
export class BetRouter {
  async routeBet(betSlip: BetSlip): Promise<ExecutionResult> {
    // 1. Fetch pool states
    // 2. Calculate optimal allocation
    // 3. Execute bets via adapters
    // 4. Record on-chain
  }
}
```

**Tasks**:
- Port LMSR calculator from PolyBets
- Implement optimal allocation algorithm
- Build execution engine
- Integrate with MarketAggregator.sol

---

## Phase 3: AI Oracle (Weeks 5-6)

### Week 5: Anomaly Detection

**Implementation**:
```typescript
// services/ai-oracle/src/monitor.ts
export class AnomalyDetector {
  async monitorMarket(marketId: string): Promise<AnomalyScore> {
    // 1. Fetch market resolution
    // 2. Query external data sources (APIs, news)
    // 3. Run ML model
    // 4. Return confidence score
  }
}
```

**Tasks**:
- Build event monitoring service
- Integrate external data sources (NewsAPI, Twitter, etc.)
- Train ML model for anomaly detection
- Implement scoring algorithm

### Week 6: Dispute System

**Smart Contract**:
```solidity
// contracts/src/oracle/AIOracleDispute.sol
contract AIOracleDispute {
    function submitDispute(uint256 marketId, string memory evidence) external;
    function voteOnDispute(uint256 disputeId, bool support) external;
    function resolveDispute(uint256 disputeId) external;
    function claimReward(uint256 disputeId) external;
}
```

**Tasks**:
- Implement AIOracleDispute.sol
- Build dispute-bot service
- Create dispute UI components
- Integrate zkSNARK proof generation (stub for MVP)

---

## Phase 4: Subjective Markets (Weeks 7-8)

### Week 7: Smart Contracts

**Implementation**:
```solidity
// contracts/src/core/SubjectiveMarketFactory.sol
contract SubjectiveMarketFactory {
    function createMarket(
        string memory question,
        address[] memory verifiers,
        uint256 threshold
    ) external returns (uint256);
    
    function submitAttestation(uint256 marketId, bytes memory zkProof) external;
    function finalizeMarket(uint256 marketId) external;
}
```

**Tasks**:
- Implement SubjectiveMarketFactory.sol
- Implement MPCVerifierCoordinator.sol
- Write tests
- Deploy to testnet

### Week 8: Attestation & Voting ( not needed in current state)

**Implementation**:
```typescript
// services/subjective-oracle/src/mpc-vote.ts
export class MPCVoting {
  async collectVotes(marketId: string): Promise<Outcome> {
    // 1. Collect verifier votes
    // 2. Threshold check (e.g., 3/5)
    // 3. Aggregate via MPC
    // 4. Submit result on-chain
  }
}
```

**Tasks**:
- Build attestation service
- Implement MPC voting logic (simplified for MVP)
- Create verifier UI
- Integrate zkAttestation (NebulaID stub)

---

## Phase 5: Privacy & Advanced Features (Weeks 9-10 -  not needed in current state))

### Week 9: Confidential Contracts

**Implementation**:
```solidity
// contracts/src/privacy/ConfidentialBet.sol (Oasis Sapphire)
contract ConfidentialBet {
    mapping(address => uint256) private balances;
    
    function placeBet(uint256 amount, bytes memory encryptedData) external;
    function revealBet(uint256 betId) external view returns (bytes memory);
}
```

**Tasks**:
- Deploy ConfidentialBet.sol to Oasis Sapphire
- Implement encryption/decryption utilities
- Build privacy toggle UI
- Test confidential transactions

### Week 10: Account Abstraction

**Implementation**:
```typescript
// shared/sdk/src/account-abstraction.ts
export class AAWallet {
  async sendUserOp(tx: Transaction): Promise<string> {
    // 1. Create UserOperation
    // 2. Sign with smart account
    // 3. Submit via bundler
    // 4. Return tx hash
  }
}
```

**Tasks**:
- Integrate ERC-4337 (Biconomy/Alchemy)
- Set up paymaster for gas sponsorship
- Update frontend to use AA wallets
- Test gasless transactions

---

## Phase 6: Testing & Launch (Weeks 11-12)

### Week 11: Comprehensive Testing

**Tasks**:
- Unit tests (contracts, services, frontend)
- Integration tests (end-to-end flows)
- Security audit (internal)
- Performance testing (load testing)
- Bug fixes

### Week 12: Deployment

**Tasks**:
- Deploy contracts to mainnet (BNB Chain, Oasis Sapphire)
- Deploy services to production (AWS/Vercel)
- Set up monitoring (Sentry, Datadog)
- Launch marketing campaign
- Monitor & iterate

---

## Key Milestones

- **Week 2**: Basic frontend + smart contracts deployed to testnet
- **Week 4**: Market aggregation working (can place bets)
- **Week 6**: AI oracle detecting anomalies + dispute system live
- **Week 8**: Subjective markets functional (create, attest, resolve)
- **Week 10**: Privacy features + AA wallets integrated
- **Week 12**: Production launch

---

## Resource Requirements

**Infrastructure**:
- Supabase Pro ($25/month)
- Vercel Pro ($20/month)
- AWS EC2 for services ($100/month)
- RPC nodes (Alchemy/Infura) ($50/month)
- The Graph indexing ($50/month)

**External Services**:
- OpenAI API ($100/month for AI oracle)
- NewsAPI ($50/month for data)
- Biconomy/Alchemy AA ($100/month)

**Total Monthly Cost**: ~$500

---

## Risk Mitigation

**Technical Risks**:
- Smart contract bugs → Audit + extensive testing
- AI oracle errors → Human override mechanism
- Cross-chain failures → Fallback to single chain
- Privacy leaks → Security audit of Oasis integration

**Product Risks**:
- Low liquidity → Bootstrap with incentives
- Regulatory issues → Legal review of subjective markets
- User adoption → Focus on UX + marketing

---

## Success Metrics

**MVP Success**:
- 100+ markets aggregated
- 50+ active users
- $10K+ in bet volume
- 10+ subjective markets created
- 5+ disputes resolved

**6-Month Goals**:
- 1000+ markets
- 1000+ active users
- $1M+ in bet volume
- 100+ subjective markets
- 50+ disputes resolved
