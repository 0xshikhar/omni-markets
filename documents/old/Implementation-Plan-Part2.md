# OmniMarkets: Implementation Plan Part 2 - Technical Details

## Backend Services Architecture

### Market Syncer Service

**Purpose**: Aggregate market data from multiple chains and platforms

**Key Components**:
- Solana adapter (LMSR markets)
- Polymarket adapter (orderbook)
- BNB Chain adapter (AMM/LMSR)
- Price normalization engine
- Cron scheduler

**Tech Stack**: Node.js, TypeScript, @solana/web3.js, ethers.js

### AI Oracle Service

**Purpose**: Detect outcome anomalies and trigger disputes

**Key Components**:
- Event monitor (listens to market resolutions)
- Anomaly detector (ML + OpenAI)
- Evidence collector (NewsAPI, social media)
- zkSNARK proof generator (stub for MVP)

**Tech Stack**: Node.js, TypeScript, Python (ML models), OpenAI API

### Subjective Oracle Service

**Purpose**: Manage private market attestations and MPC voting

**Key Components**:
- Attestation handler
- MPC voting coordinator
- Verifier manager
- zkAttestation integration (NebulaID)

**Tech Stack**: Node.js, TypeScript, MPC libraries

### Dispute Bot Service

**Purpose**: Automatically submit disputes based on AI oracle flags

**Key Components**:
- Dispute submission engine
- Evidence formatter
- Reward claimer
- Gas optimization

**Tech Stack**: Node.js, TypeScript, ethers.js

---

## Frontend Components

### Core Pages

1. **Dashboard** (`/`): Market discovery with filters
2. **Market Detail** (`/[marketId]`): Bet placement and info
3. **Create Market** (`/create`): Public/private market wizard
4. **Disputes** (`/disputes`): Dispute center and voting
5. **Portfolio** (`/portfolio`): User bets and winnings
6. **Admin** (`/admin`): Protocol management

### Key Components

- **MarketCard**: Display market with aggregated data
- **BetSlip**: Multi-market bet creation
- **SubjectiveCreator**: Private market setup
- **VerifierCircle**: Verifier selection UI
- **DisputePanel**: Dispute submission and voting
- **AIOracleStatus**: AI confidence scores
- **ZKProofExplorer**: Proof verification UI

---

## Deployment

### Smart Contracts
- BNB Testnet → Mainnet
- Oasis Sapphire Testnet → Mainnet
- Verify on block explorers

### Services
- Docker containers on AWS ECS
- Environment variables via AWS Secrets Manager
- Monitoring with CloudWatch

### Frontend
- Vercel deployment
- Edge functions for API routes
- CDN for static assets

---

## Testing

### Unit Tests
- Smart contracts (Hardhat)
- Services (Jest)
- Frontend (Vitest + React Testing Library)

### Integration Tests
- End-to-end bet flow
- Cross-chain routing
- Dispute resolution

### Security
- Smart contract audit
- Penetration testing
- Bug bounty program

---

## Success Metrics

**MVP (Week 12)**:
- 100+ markets aggregated
- 50+ active users
- $10K+ bet volume
- 10+ subjective markets
- 5+ disputes resolved

**6 Months**:
- 1000+ markets
- 1000+ users
- $1M+ volume
- 100+ subjective markets
- 50+ disputes resolved
