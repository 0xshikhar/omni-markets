# PolyBets vs OmniMarkets: Detailed Comparison & Analysis

## Executive Summary

**PolyBets** is a cross-chain prediction market aggregator focused on routing bets across multiple platforms (Polymarket, Solana-based markets) with privacy features via Oasis Sapphire.

**OmniMarkets** extends PolyBets by adding:
- AI-powered oracle & dispute resolution
- Subjective/private market creation with zkAttestation
- Enhanced privacy with confidential contracts
- Multi-chain deployment (BNB Chain, opBNB, Oasis Sapphire)

---

## 1. Architecture Comparison

### PolyBets Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Web Frontend (Next.js)                │
│              - Market Discovery & Aggregation            │
│              - Bet Slip Creation                         │
│              - Portfolio Management                      │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│              Oasis Sapphire Smart Contract               │
│                    (PolyBet.sol)                         │
│  - BetSlip Management (Pending → Processing → Placed)   │
│  - Privacy Layer (SIWE Auth, Confidential State)        │
│  - Collateral Management (mUSDC)                         │
│  - ProxiedBet Tracking                                   │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│           Bet Router ROFL (Python Service)               │
│  - Event Listener (BetSlipCreated, Selling Updates)     │
│  - Optimal Bet Allocation (LMSR Calculator)             │
│  - Cross-chain Execution                                 │
│  - Result Recording                                      │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│         Marketplace Adapter REST API (Hono)              │
│  - Solana Adapter (LMSR Markets)                        │
│  - Price Fetching                                        │
│  - Buy/Sell Share Execution                             │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│              External Marketplaces                       │
│  - Slaughterhouse Predictions (Solana)                  │
│  - Terminal Degeneracy Labs (Solana)                    │
│  - Degen Execution Chamber (Solana)                     │
│  - Nihilistic Prophet Syndicate (Solana)                │
└─────────────────────────────────────────────────────────┘

Supporting Services:
┌─────────────────────────────────────────────────────────┐
│  Knowledge Graph (The Graph GRC-20)                     │
│  - Market Discovery                                      │
│  - Entity Relationships                                  │
│  - 18 Published Entities                                │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  AI Agent (Fetch.ai uAgents)                            │
│  - Market Recommendations                                │
│  - Natural Language Queries                              │
│  - OpenAI Integration                                    │
└─────────────────────────────────────────────────────────┘
```

### OmniMarkets Architecture (Extended)

```
┌─────────────────────────────────────────────────────────┐
│         Frontend (Next.js Web + React Native)            │
│  - Unified Dashboard (Public + Private Markets)          │
│  - Market Creation (Public/Subjective)                   │
│  - Dispute Center                                        │
│  - Portfolio & Admin                                     │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│              Smart Contracts Layer                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │ BNB Chain (opBNB)                               │   │
│  │ - MarketAggregator.sol                          │   │
│  │ - PolyBetAdapters.sol                           │   │
│  │ - SubjectiveMarketFactory.sol                   │   │
│  │ - AIOracleDispute.sol                           │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Oasis Sapphire                                  │   │
│  │ - ConfidentialBet.sol                           │   │
│  │ - ZKAttestationVerifier.sol                     │   │
│  │ - MPCVerifierCoordinator.sol                    │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│              Offchain Services (Node.js)                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │ AI Oracle Service                               │   │
│  │ - monitor.py: Event monitoring & anomaly detect │   │
│  │ - proof_generator.py: zkSNARK proof generation  │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Market Syncer                                   │   │
│  │ - sync.js: Cross-protocol data aggregation      │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Subjective Oracle                               │   │
│  │ - attest.js: Private attestation handling       │   │
│  │ - mpc_vote.js: MPC threshold voting             │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Dispute Bot                                     │   │
│  │ - bot.js: Auto-dispute & reward claiming        │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│         SDK & Shared Libraries (TypeScript)              │
│  - Types, ABIs, Utils                                    │
│  - Cross-chain helpers                                   │
│  - ZK proof utilities                                    │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Core Components Deep Dive

### 2.1 Smart Contracts

#### PolyBets: PolyBet.sol

**Location**: `/contracts/contracts/polybet.sol`

**Key Features**:
- **BetSlip Management**: Tracks user bets across multiple markets
- **Privacy**: Uses Oasis Sapphire's confidential computing + SIWE authentication
- **Collateral**: ERC20 (mUSDC) token handling with SafeERC20
- **ProxiedBet Tracking**: Records individual bets placed on external markets
- **ROFL Integration**: Authorized origin checks for bet router service

**Data Structures**:
```solidity
struct BetSlip {
    BetSlipStrategy strategy;        // MaximizeShares | MaximizePrivacy
    uint256 initialCollateral;
    uint256 finalCollateral;
    uint256 outcomeIndex;            // 0=YES, 1=NO
    uint256 parentId;
    bool instantArbitrage;
    BetSlipStatus status;            // Pending → Processing → Placed → Selling → Closed
    string failureReason;
    bytes32[] marketplaceIds;
    bytes32[] marketIds;
    bytes32[] proxiedBets;
}

struct ProxiedBet {
    bytes32 id;
    uint256 betSlipId;
    uint256 marketplaceId;
    uint256 marketId;
    uint256 optionIndex;
    uint256 originalCollateralAmount;
    uint256 finalCollateralAmount;
    uint256 sharesBought;
    uint256 sharesSold;
    BetOutcome outcome;              // None | Placed | Failed | Sold | Won | Lost | Draw | Void
    string failureReason;
}

struct Marketplace {
    uint256 warpRouterId;
    uint256 chainId;
    ChainFamily chainFamily;         // EVM | SVM
    string name;
    string marketplaceProxy;
    PricingStrategy pricingStrategy; // ORDERBOOK | AMM | LMSR
}
```

**Key Functions**:
- `placeBet()`: User initiates bet slip
- `recordProxiedBetPlaced()`: ROFL records successful bet
- `recordProxiedBetSold()`: ROFL records bet sale
- `recordProxiedBetClosed()`: ROFL records market resolution
- `withdrawWinnings()`: User claims winnings

#### OmniMarkets: Extended Contract Suite

**MarketAggregator.sol** (NEW):
- Unified interface for all market types
- Cross-protocol routing logic
- Liquidity aggregation
- Price normalization

**SubjectiveMarketFactory.sol** (NEW):
- Private market creation
- Verifier circle management
- Access control (invite-only)
- Market metadata storage

**AIOracleDispute.sol** (NEW):
- Dispute submission & tracking
- AI oracle integration
- Evidence storage
- Reward pool management

**ZKAttestationVerifier.sol** (NEW):
- zkSNARK/zkSTARK proof verification
- Attestation validation
- Privacy-preserving outcome verification

**MPCVerifierCoordinator.sol** (NEW):
- Multi-party computation coordination
- Threshold voting logic
- Secure aggregation
- Result finalization

**ConfidentialBet.sol** (NEW):
- Encrypted bet data
- Private order matching
- Hidden positions
- Confidential settlement

---

### 2.2 Bet Routing & Execution

#### PolyBets: Bet Router ROFL

**Location**: `/apps/bet-router-rofl/`

**Technology**: Python (Web3.py, Oasis ROFL)

**Core Flow**:
```python
1. Event Listener (main.py)
   ├─> Listen for BetSlipCreated events
   ├─> Decode marketplace & market IDs
   └─> Route to buy flow

2. Optimal Allocation (bet_execution/optimal_betting.py)
   ├─> Fetch LMSR pool states
   ├─> Calculate price impact
   ├─> Optimize allocation across pools
   └─> Return allocation strategy

3. Bet Execution (bet_execution/bet_executor.py)
   ├─> Map marketplace IDs to API endpoints
   ├─> Execute buy-shares requests
   ├─> Handle responses & errors
   └─> Return successful bets

4. Contract Recording (main.py)
   ├─> Generate proxied bet IDs
   ├─> Call recordProxiedBetPlaced()
   ├─> Update bet slip status
   └─> Log results
```

**LMSR Optimization**:
- **File**: `bet_execution/lmsr_calculator.py`
- **Algorithm**: Logarithmic Market Scoring Rule
- **Optimization Methods**:
  - `MaximizeShares`: Minimize price impact, maximize shares
  - `MaximizePrivacy`: Add delays, rotate wallets (PoC only)

**Key Functions**:
```python
def execute_optimal_bet(
    pool_configs: List[PoolConfig],
    total_amount: float,
    option: int,
    method: OptimizationMethod
) -> OptimalBettingResult:
    # Fetch pool states
    # Calculate optimal allocation
    # Execute bets via API
    # Return results
```

#### OmniMarkets: Extended Routing

**Planned Enhancements**:
- **Node.js/TypeScript** implementation (instead of Python)
- **Multi-chain routing**: BNB Chain, Solana, Ethereum
- **Cross-chain bridging**: Hyperlane/LayerZero integration
- **Advanced strategies**:
  - Arbitrage detection & execution
  - Liquidity-aware routing
  - Gas optimization
  - MEV protection

---

### 2.3 Frontend & User Experience

#### PolyBets Frontend

**Location**: `/apps/web-frontend/`

**Tech Stack**:
- Next.js 15.3.5
- React 19
- TailwindCSS + shadcn/ui
- Radix UI components
- Wagmi + Viem (Web3)
- Reown AppKit (wallet connection)
- Recharts (data visualization)

**Pages**:
```
/                    → Market discovery & aggregation
/market/[id]         → Market detail & bet placement
/portfolio           → User bets & winnings
```

**Key Components**:
- `MarketCard`: Displays aggregated market data
- `BetSlip`: Multi-market bet creation
- `AggregateOrder`: Shows optimal routing
- `PortfolioView`: Active & closed bets

**Data Flow**:
```typescript
// Server-side data fetching (ISR)
async function fetchMarkets() {
  // 1. Query Supabase for markets + external_markets
  // 2. Fetch live prices from marketplace APIs (parallel)
  // 3. Calculate 24h volume from shares_bought/sold
  // 4. Aggregate data by parent market
  // 5. Return grouped markets
}

// Client-side rendering
<HomeClient groupedMarkets={groupedMarkets} />
```

#### OmniMarkets Frontend (Extended)

**Planned Structure**:
```
/                    → Unified dashboard (public + private)
/[marketId]          → Market detail (public/subjective)
/create/             → Market creation wizard
  /create/public     → Public market flow
  /create/private    → Subjective market flow
/disputes/           → Dispute center
  /disputes/[id]     → Dispute detail & voting
/portfolio/          → User portfolio
  /portfolio/bets    → Active & closed bets
  /portfolio/markets → Created markets
  /portfolio/liquidity → LP positions
/admin/              → Admin dashboard (role-gated)
```

**New Components**:
- `SubjectiveCreator`: Private market creation
- `VerifierCircle`: Verifier selection & management
- `DisputePanel`: Dispute submission & voting
- `AIOracleStatus`: AI oracle monitoring
- `ZKProofExplorer`: Proof verification UI
- `PrivacyToggle`: Public/private mode switcher

**Mobile App** (NEW):
- React Native
- Shared components with web
- Native wallet integration
- Push notifications for market updates

---

### 2.4 Marketplace Adapters

#### PolyBets: Solana Adapter

**Location**: `/packages/common/src/marketplace-adapters/solana-adapter.ts`

**Interface**:
```typescript
interface MarketplaceAdapter<MarketId, BuyArgs, SellArgs, PricesArgs, ClaimArgs> {
  buyShares(args: BuyArgs): Promise<{ transactionId: string; sharesMinted: number }>;
  sellShares(args: SellArgs): Promise<{ transactionId: string; collateralReceived: number }>;
  getPrices(args: PricesArgs): Promise<[number, number] | Error>;
  claimPayout(args: ClaimArgs): Promise<any>;
}
```

**Implementation**:
- Uses `@coral-xyz/anchor` for Solana program interaction
- LMSR pool state fetching
- Price calculation from pool reserves
- Buy/sell share execution via `SolanaPoolManager`

**Supported Markets**:
- Slaughterhouse Predictions
- Terminal Degeneracy Labs
- Degen Execution Chamber
- Nihilistic Prophet Syndicate

#### OmniMarkets: Multi-Chain Adapters

**Planned Adapters**:
```
adapters/
├── solana-adapter.ts        (inherited from PolyBets)
├── polymarket-adapter.ts    (Polygon orderbook)
├── bnb-adapter.ts          (BNB Chain LMSR/AMM)
├── ethereum-adapter.ts      (Ethereum markets)
└── generic-adapter.ts       (Fallback for new protocols)
```

**Enhanced Features**:
- Unified adapter interface
- Automatic chain detection
- Gas estimation & optimization
- Error handling & retries
- Rate limiting & caching

---

### 2.5 Knowledge Graph & AI Agent

#### PolyBets: Knowledge Graph

**Location**: `/apps/knowledge-graph/`

**Technology**: The Graph GRC-20 protocol

**Entities** (18 total):
- **Markets** (6): Core betting questions
- **Marketplaces** (5): Platform metadata
- **ExternalMarkets** (6): Market instances
- **Summary** (1): Ecosystem overview

**Relationships**:
```
Market --[hasExternalMarket]--> ExternalMarket
ExternalMarket --[parentOf]--> Market
ExternalMarket --[hostedOnMarketplace]--> Marketplace
```

**Deployment**:
- IPFS CID: `bafkreihjshcs5eptkqurji33wafkmyzxqqqkzbl7t6yhng42vnhnutfxwe`
- Network: The Graph Testnet
- Space ID: `0e99e2a7-16e2-40a1-a751-8d45b02b9789`

#### PolyBets: AI Agent

**Location**: `/apps/agent/polybet_agent_v3.py`

**Technology**: Fetch.ai uAgents + OpenAI

**Features**:
- Natural language market queries
- Market recommendations
- Bet slip formation assistance
- Rate limiting (30 req/hour)
- Supabase integration

**Flow**:
```python
1. User sends chat message
2. Agent queries Supabase for markets
3. OpenAI processes query & matches markets
4. Agent returns recommendations
5. User can place bets via frontend
```

#### OmniMarkets: Enhanced AI/Knowledge

**Planned Enhancements**:
- **Expanded Knowledge Graph**:
  - Dispute history
  - Oracle performance metrics
  - User reputation scores
  - Market outcome accuracy
- **Advanced AI Features**:
  - Anomaly detection (price manipulation)
  - Outcome prediction (ML models)
  - Dispute evidence analysis
  - Sentiment analysis (social media)
- **Agent Capabilities**:
  - Autonomous dispute submission
  - Market creation suggestions
  - Portfolio optimization
  - Risk assessment

---

## 3. Prediction Model Comparison

### PolyBets Prediction Model

**Type**: Aggregation-based (no native prediction)

**Approach**:
1. **Market Discovery**: Query Supabase for markets across platforms
2. **Price Aggregation**: Fetch live prices from each marketplace
3. **Optimal Routing**: Calculate best allocation using LMSR math
4. **Execution**: Place bets on external markets
5. **Result Tracking**: Monitor outcomes & settle bets

**No Native Oracle**: Relies on external marketplace oracles

**Strengths**:
- Leverages existing market liquidity
- No oracle risk (delegated to platforms)
- Simple & proven model

**Weaknesses**:
- Dependent on external oracles
- No dispute mechanism
- Limited to public markets

### OmniMarkets Prediction Model

**Type**: Hybrid (Aggregation + Native + AI-Enhanced)

**Approach**:

#### Layer 1: Aggregation (Inherited from PolyBets)
- Cross-protocol market discovery
- Price normalization
- Optimal routing

#### Layer 2: Native Markets (NEW)
- **Public Markets**: Standard prediction markets on BNB Chain
- **Subjective Markets**: Private, verifier-attested markets
- **Oracle**: AI-powered + human dispute system

#### Layer 3: AI Oracle & Dispute (NEW)

**AI Oracle Pipeline**:
```
1. Event Monitoring
   ├─> Monitor market resolutions
   ├─> Fetch external data sources (APIs, news, social)
   └─> Detect anomalies (price manipulation, false outcomes)

2. Anomaly Detection
   ├─> ML model analyzes outcome vs. evidence
   ├─> Score confidence (0-100%)
   └─> Flag suspicious markets

3. Dispute Suggestion
   ├─> Rank markets by dispute priority
   ├─> Generate evidence summary
   └─> Recommend action to dispute bots

4. ZK Proof Generation
   ├─> Generate zkSNARK of AI model's reasoning
   ├─> Publish proof on-chain
   └─> Enable verifiable AI decisions

5. Dispute Resolution
   ├─> Human validators review evidence
   ├─> Vote on outcome
   ├─> Reward correct disputants
   └─> Penalize false disputes
```

**Dispute Bot Network**:
- Autonomous bots monitor AI oracle flags
- Submit disputes with evidence
- Claim rewards for successful disputes
- Incentivized by protocol reward pool

#### Layer 4: Subjective Markets (NEW)

**Use Cases**:
- Personal events (e.g., "Will I get promoted?")
- Private group predictions (e.g., "Will our startup raise Series A?")
- Sensitive topics (e.g., health outcomes)

**Verification Flow**:
```
1. Market Creation
   ├─> Creator defines event & verifiers
   ├─> Set resolution criteria
   └─> Deploy private market contract

2. Trading
   ├─> Only invited participants can trade
   ├─> Bets encrypted via Oasis Sapphire
   └─> Positions hidden from public

3. Outcome Attestation
   ├─> Verifiers submit zkAttestation (NebulaID/zkKYC)
   ├─> Proofs verified on-chain
   └─> No personal data revealed

4. MPC Voting
   ├─> Verifiers vote on outcome
   ├─> Threshold voting (e.g., 3/5 required)
   ├─> Secure aggregation via MPC
   └─> Result published

5. Settlement
   ├─> Payouts distributed based on outcome
   ├─> Confidential transfers
   └─> Market closed
```

**Privacy Guarantees**:
- Encrypted bet data (Oasis Sapphire)
- zkAttestation (no personal data on-chain)
- MPC voting (no individual votes revealed)
- Confidential settlement

---

## 4. Technology Stack Comparison

| Component | PolyBets | OmniMarkets |
|-----------|----------|-------------|
| **Frontend** | Next.js 15, React 19 | Next.js 15, React 19, React Native |
| **Styling** | TailwindCSS, shadcn/ui | TailwindCSS, shadcn/ui, Lucide icons |
| **Web3** | Wagmi, Viem, Reown AppKit | Wagmi, Viem, Account Abstraction (ERC-4337) |
| **Backend** | Python (ROFL), Hono (API) | Node.js/TypeScript (all services) |
| **Smart Contracts** | Solidity (Oasis Sapphire) | Solidity (BNB Chain, Oasis Sapphire), Circom (zkSNARKs) |
| **Database** | Supabase (PostgreSQL) | Supabase or custom (TBD) |
| **Oracle** | External (marketplace-native) | AI-powered + human dispute |
| **Privacy** | Oasis Sapphire confidential contracts | Oasis Sapphire + zkAttestation + MPC |
| **Cross-chain** | Manual adapters | Hyperlane/LayerZero bridges |
| **AI/ML** | OpenAI (agent), None (oracle) | OpenAI (agent), Custom ML (oracle) |
| **Knowledge Graph** | The Graph GRC-20 | The Graph GRC-20 (expanded) |
| **Agent** | Fetch.ai uAgents | Fetch.ai uAgents (enhanced) |
| **Deployment** | Oasis Sapphire Testnet | BNB Chain (opBNB), Oasis Sapphire |

---

## 5. Key Differences Summary

### What PolyBets Does Well
✅ **Proven aggregation model**: Successfully routes bets across Solana markets  
✅ **Privacy-first**: Oasis Sapphire confidential contracts  
✅ **Optimal routing**: LMSR-based allocation algorithm  
✅ **Knowledge graph**: Structured market discovery  
✅ **AI agent**: Natural language market queries  
✅ **Production-ready**: Live deployment on testnet  

### What OmniMarkets Adds
🆕 **AI Oracle**: Automated outcome verification & dispute detection  
🆕 **Subjective Markets**: Private, verifier-attested markets  
🆕 **zkAttestation**: Privacy-preserving outcome verification  
🆕 **MPC Voting**: Secure threshold voting for subjective markets  
🆕 **Dispute System**: Incentivized dispute bot network  
🆕 **Multi-chain**: BNB Chain, Solana, Ethereum support  
🆕 **Account Abstraction**: Gasless transactions (ERC-4337)  
🆕 **Mobile App**: React Native mobile experience  
🆕 **Advanced Privacy**: Confidential betting & settlement  

---

## 6. Migration Path: PolyBets → OmniMarkets

### Phase 1: Foundation (Weeks 1-2)
- Set up monorepo structure
- Port PolyBet.sol to BNB Chain (opBNB)
- Migrate frontend to new structure
- Set up Node.js backend services

### Phase 2: Core Extensions (Weeks 3-4)
- Implement MarketAggregator.sol
- Build market-syncer service
- Add multi-chain adapters
- Enhance frontend with new pages

### Phase 3: AI Oracle (Weeks 5-6)
- Implement AIOracleDispute.sol
- Build ai-oracle/monitor service
- Integrate ML anomaly detection
- Create dispute-bot service

### Phase 4: Subjective Markets (Weeks 7-8)
- Implement SubjectiveMarketFactory.sol
- Build subjective-oracle services
- Integrate zkAttestation (NebulaID)
- Implement MPC voting

### Phase 5: Privacy & Advanced Features (Weeks 9-10)
- Implement ConfidentialBet.sol
- Add account abstraction (ERC-4337)
- Build mobile app
- Integrate cross-chain bridges

### Phase 6: Testing & Deployment (Weeks 11-12)
- Comprehensive testing
- Security audits
- Testnet deployment
- Mainnet launch

---

## 7. Risk Assessment

### PolyBets Risks
⚠️ **Oracle Dependency**: Relies on external marketplace oracles  
⚠️ **Limited Dispute**: No mechanism to challenge outcomes  
⚠️ **Solana-Heavy**: Most markets on Solana (chain risk)  
⚠️ **Liquidity Fragmentation**: Dependent on external liquidity  

### OmniMarkets Additional Risks
⚠️ **Complexity**: More components = more attack surface  
⚠️ **AI Oracle Risk**: ML models can be wrong or manipulated  
⚠️ **zkProof Overhead**: Proof generation/verification costs  
⚠️ **MPC Coordination**: Verifier availability & collusion risks  
⚠️ **Multi-chain Complexity**: Bridge risks & cross-chain attacks  
⚠️ **Regulatory**: Subjective markets may face legal challenges  

### Mitigation Strategies
✅ **Gradual Rollout**: Launch features incrementally  
✅ **Fallback Mechanisms**: Manual override for AI oracle  
✅ **Incentive Alignment**: Reward honest behavior, penalize attacks  
✅ **Audits**: Smart contract & security audits before mainnet  
✅ **Insurance**: Protocol insurance fund for disputes  
✅ **Compliance**: Legal review of subjective markets  

---

## Conclusion

**PolyBets** is a solid foundation for prediction market aggregation with strong privacy features. It successfully demonstrates cross-chain bet routing and optimal allocation.

**OmniMarkets** extends this foundation with:
- **AI-powered oracle** for automated verification
- **Subjective markets** for private, verifier-attested predictions
- **Enhanced privacy** with zkAttestation and MPC
- **Multi-chain support** for broader market access
- **Dispute system** for outcome challenges

The migration path is clear: inherit PolyBets' proven aggregation model, then layer on AI oracle, subjective markets, and advanced privacy features. The result is a comprehensive prediction market protocol that serves both public and private use cases with strong security and privacy guarantees.
