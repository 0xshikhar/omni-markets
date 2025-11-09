# OmniMarkets: Project Summary

## What We've Built

A comprehensive analysis and implementation plan for **OmniMarkets**, an extended version of PolyBets with AI oracle, subjective markets, and enhanced privacy features.

---

## Key Documents Created

### 1. **Polybets-vs-OmniMarkets-Analysis.md**
Detailed comparison of PolyBets and OmniMarkets covering:
- Architecture comparison (diagrams included)
- Smart contract deep dive (PolyBet.sol vs extended suite)
- Bet routing & execution mechanisms
- Frontend & UX differences
- Marketplace adapters (Solana, Polymarket, BNB)
- Knowledge graph & AI agent integration
- Prediction model comparison (aggregation vs hybrid)
- Technology stack comparison
- Risk assessment & mitigation

**Key Findings**:
- PolyBets: Proven aggregation model with privacy (Oasis Sapphire)
- OmniMarkets: Adds AI oracle, subjective markets, zkAttestation, MPC voting
- Migration path: Inherit PolyBets foundation, layer on new features

### 2. **Implementation-Plan-Part1.md**
12-week MVP development plan with:
- **Phase 1 (Weeks 1-2)**: Foundation & setup
  - Monorepo structure
  - Smart contract porting
  - Database schema
  - Frontend foundation
- **Phase 2 (Weeks 3-4)**: Market aggregation
  - Market syncer service
  - Bet routing engine
- **Phase 3 (Weeks 5-6)**: AI oracle
  - Anomaly detection
  - Dispute system
- **Phase 4 (Weeks 7-8)**: Subjective markets
  - Smart contracts
  - Attestation & voting
- **Phase 5 (Weeks 9-10)**: Privacy & advanced features
  - Confidential contracts
  - Account abstraction
- **Phase 6 (Weeks 11-12)**: Testing & launch

**Resource Requirements**:
- Team: 2-3 full-stack, 1 smart contract, 1 DevOps, 1 ML engineer
- Infrastructure: ~$500/month (Supabase, Vercel, AWS, RPC nodes)
- Timeline: 12 weeks to MVP

### 3. **Implementation-Plan-Part2.md**
Technical implementation details:
- Smart contract code samples (MarketAggregator, SubjectiveMarketFactory, AIOracleDispute)
- Backend service architecture (Market Syncer, AI Oracle, Subjective Oracle, Dispute Bot)
- Frontend components (Dashboard, Market Detail, Bet Slip)
- Deployment strategy (Docker, Vercel, AWS)
- Testing approach

### 4. **Quick-Start-Guide.md**
Developer onboarding guide:
- Prerequisites & setup
- Environment configuration
- Database setup
- Contract deployment
- Service startup
- Development workflow
- Common tasks
- Troubleshooting

---

## PolyBets Structure Analysis

### Architecture
```
Monorepo (Turborepo/Bun workspaces)
├── apps/
│   ├── web-frontend/          (Next.js 15, React 19, TailwindCSS)
│   ├── bet-router-rofl/       (Python, Oasis ROFL)
│   ├── knowledge-graph/       (The Graph GRC-20)
│   ├── agent/                 (Fetch.ai uAgents)
│   ├── marketplace-adapter-rest-api/ (Hono)
│   └── polymarket-copier/     (Data bootstrapping)
├── contracts/                 (Hardhat, Solidity)
│   └── polybet.sol           (Main contract on Oasis Sapphire)
└── packages/
    └── common/               (Shared types, adapters, SDK)
```

### Core Flow
1. **User**: Creates bet slip on frontend (multiple markets)
2. **Smart Contract**: Receives bet, emits `BetSlipCreated` event
3. **Bet Router ROFL**: Listens for event, calculates optimal allocation
4. **Marketplace Adapters**: Execute bets on Solana markets (LMSR)
5. **Bet Router**: Records results back to smart contract
6. **User**: Withdraws winnings when markets resolve

### Key Technologies
- **Privacy**: Oasis Sapphire confidential contracts + SIWE auth
- **Optimization**: LMSR calculator for optimal bet allocation
- **Cross-chain**: Solana adapters (4 marketplaces)
- **Knowledge**: The Graph GRC-20 (18 entities published)
- **AI**: Fetch.ai agent + OpenAI for market discovery

---

## OmniMarkets Extensions

### New Features
1. **AI Oracle**
   - Monitors market resolutions
   - Detects anomalies using ML + OpenAI
   - Generates zkSNARK proofs (stub for MVP)
   - Triggers dispute bot network

2. **Subjective Markets**
   - Private market creation
   - Verifier circle selection
   - zkAttestation for outcome verification
   - MPC threshold voting
   - Confidential settlement

3. **Dispute System**
   - User/bot dispute submission
   - Evidence storage (IPFS)
   - Community voting
   - Reward distribution

4. **Enhanced Privacy**
   - Confidential betting (Oasis Sapphire)
   - zkAttestation (NebulaID)
   - MPC voting (no individual votes revealed)
   - Anonymous dispute submission

5. **Multi-chain Support**
   - BNB Chain (opBNB) - main deployment
   - Oasis Sapphire - privacy features
   - Solana - existing markets
   - Ethereum - future expansion

6. **Account Abstraction**
   - ERC-4337 smart accounts
   - Gasless transactions
   - Social login
   - MPC key backup

### New Smart Contracts
- `MarketAggregator.sol` - Unified bet routing
- `SubjectiveMarketFactory.sol` - Private market creation
- `AIOracleDispute.sol` - Dispute management
- `ZKAttestationVerifier.sol` - Proof verification
- `MPCVerifierCoordinator.sol` - MPC voting
- `ConfidentialBet.sol` - Private betting

### New Services (Node.js/TypeScript)
- `market-syncer` - Cross-chain data aggregation
- `ai-oracle` - Anomaly detection & monitoring
- `subjective-oracle` - Attestation & MPC voting
- `dispute-bot` - Automated dispute submission

---

## Technology Stack

### PolyBets
- **Frontend**: Next.js 15, React 19, TailwindCSS, shadcn/ui, Wagmi
- **Backend**: Python (ROFL), Hono (API)
- **Contracts**: Solidity (Oasis Sapphire)
- **Database**: Supabase
- **Blockchain**: Oasis Sapphire (main), Solana (markets)

### OmniMarkets (Extended)
- **Frontend**: Next.js 15, React Native (mobile)
- **Backend**: Node.js/TypeScript (all services)
- **Contracts**: Solidity (BNB Chain, Oasis), Circom (zkSNARKs)
- **Database**: Supabase
- **Blockchain**: BNB Chain (opBNB), Oasis Sapphire, Solana, Ethereum
- **AI/ML**: OpenAI API, Python ML models
- **Privacy**: zkAttestation, MPC libraries

---

## Implementation Approach

### Phase-by-Phase Strategy

**Phase 1-2 (Weeks 1-4)**: Foundation
- Port PolyBets core (smart contracts, frontend)
- Migrate to Node.js backend
- Set up multi-chain infrastructure

**Phase 3-4 (Weeks 5-8)**: Core Extensions
- Build AI oracle service
- Implement dispute system
- Create subjective market contracts

**Phase 5-6 (Weeks 9-12)**: Advanced Features & Launch
- Add privacy features
- Integrate account abstraction
- Comprehensive testing
- Production deployment

### Key Decisions

1. **Node.js over Python**: Better ecosystem for TypeScript monorepo
2. **BNB Chain primary**: Lower gas costs, good tooling
3. **Oasis Sapphire for privacy**: Proven confidential computing
4. **Gradual rollout**: Start with aggregation, add features incrementally
5. **MVP-first**: Focus on core features, defer mobile app to post-MVP

---

## Success Metrics

### MVP (Week 12)
- ✅ 100+ markets aggregated
- ✅ 50+ active users
- ✅ $10K+ bet volume
- ✅ 10+ subjective markets created
- ✅ 5+ disputes resolved

### 6 Months Post-Launch
- 🎯 1000+ markets
- 🎯 1000+ active users
- 🎯 $1M+ bet volume
- 🎯 100+ subjective markets
- 🎯 50+ disputes resolved
- 🎯 Mobile app launched

---

## Next Steps

### Immediate Actions
1. **Set up development environment**
   - Create monorepo structure
   - Initialize workspaces
   - Configure tooling

2. **Deploy contracts to testnet**
   - Port PolyBet.sol to MarketAggregator.sol
   - Deploy to BNB Testnet
   - Deploy to Oasis Sapphire Testnet

3. **Build market syncer**
   - Implement Solana adapter
   - Add Polymarket adapter
   - Set up cron jobs

4. **Create frontend MVP**
   - Dashboard with market list
   - Market detail page
   - Bet slip component

### Week 1 Deliverables
- [ ] Monorepo initialized
- [ ] Smart contracts deployed to testnet
- [ ] Database schema created
- [ ] Frontend showing markets from Supabase
- [ ] Market syncer running (Solana markets)

### Week 2 Deliverables
- [ ] Bet placement working end-to-end
- [ ] Portfolio page showing user bets
- [ ] Basic routing optimization
- [ ] Integration tests passing

---

## Risk Management

### Technical Risks
- **Smart contract bugs**: Mitigate with audits + extensive testing
- **AI oracle errors**: Implement human override mechanism
- **Cross-chain failures**: Fallback to single-chain operation
- **Privacy leaks**: Security audit of Oasis integration

### Product Risks
- **Low liquidity**: Bootstrap with incentives + market makers
- **Regulatory issues**: Legal review of subjective markets
- **User adoption**: Focus on UX + marketing campaign

### Operational Risks
- **Service downtime**: Implement monitoring + auto-restart
- **RPC rate limits**: Use multiple providers + caching
- **Gas price spikes**: Implement gas optimization + batching

---

## Conclusion

OmniMarkets extends PolyBets' proven prediction market aggregation model with:
- **AI-powered oracle** for automated outcome verification
- **Subjective markets** for private, verifier-attested predictions
- **Enhanced privacy** with zkAttestation and MPC voting
- **Multi-chain support** for broader market access

The 12-week implementation plan provides a clear path from foundation to MVP launch, with detailed technical specifications and risk mitigation strategies. The project is well-positioned to deliver a comprehensive prediction market protocol that serves both public and private use cases.

**Total Documentation**: 4 comprehensive documents covering analysis, implementation, and quick-start guide.
