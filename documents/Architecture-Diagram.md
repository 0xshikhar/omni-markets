# OmniMarkets: System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACES                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────┐              ┌──────────────────────┐    │
│  │   Web App (Next.js)  │              │  Mobile (React Native)│    │
│  │  - Dashboard         │              │  - Market Discovery   │    │
│  │  - Market Detail     │              │  - Bet Placement      │    │
│  │  - Create Market     │              │  - Portfolio          │    │
│  │  - Disputes          │              │  - Push Notifications │    │
│  │  - Portfolio         │              │                       │    │
│  └──────────┬───────────┘              └──────────┬────────────┘    │
│             │                                     │                  │
└─────────────┼─────────────────────────────────────┼──────────────────┘
              │                                     │
              └──────────────┬──────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        SHARED SDK & TYPES                            │
├─────────────────────────────────────────────────────────────────────┤
│  - TypeScript types (Market, Bet, Dispute, Oracle)                  │
│  - Contract ABIs (MarketAggregator, SubjectiveFactory, Dispute)     │
│  - Utilities (cross-chain, zk-proof, encryption)                    │
│  - API clients (markets, bets, disputes, subjective)                │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│   SMART CONTRACTS        │    │   BACKEND SERVICES       │
│   (Solidity/Circom)      │    │   (Node.js/TypeScript)   │
├──────────────────────────┤    ├──────────────────────────┤
│                          │    │                          │
│  BNB Chain (opBNB):      │    │  Market Syncer:          │
│  ┌────────────────────┐  │    │  - Fetch markets         │
│  │ MarketAggregator   │  │    │  - Normalize prices      │
│  │ - placeBet()       │  │    │  - Store in DB           │
│  │ - recordProxiedBet()│ │    │  - Cron scheduler        │
│  │ - withdrawWinnings()│ │    │                          │
│  └────────────────────┘  │    │  AI Oracle:              │
│                          │    │  - Monitor resolutions   │
│  ┌────────────────────┐  │    │  - Anomaly detection     │
│  │ PolyBetAdapters    │  │    │  - Evidence collection   │
│  │ - Solana adapter   │  │    │  - zkSNARK generation    │
│  │ - Polymarket       │  │    │                          │
│  │ - BNB markets      │  │    │  Subjective Oracle:      │
│  └────────────────────┘  │    │  - Attestation handler   │
│                          │    │  - MPC voting            │
│  ┌────────────────────┐  │    │  - Verifier manager      │
│  │ SubjectiveFactory  │  │    │                          │
│  │ - createMarket()   │  │    │  Dispute Bot:            │
│  │ - submitAttestation│  │    │  - Auto-submit disputes  │
│  │ - finalizeMarket() │  │    │  - Evidence formatter    │
│  └────────────────────┘  │    │  - Reward claimer        │
│                          │    │                          │
│  ┌────────────────────┐  │    └──────────┬───────────────┘
│  │ AIOracleDispute    │  │               │
│  │ - submitDispute()  │  │               │
│  │ - voteOnDispute()  │  │               │
│  │ - resolveDispute() │  │               │
│  │ - claimReward()    │  │               │
│  └────────────────────┘  │               │
│                          │               │
│  Oasis Sapphire:         │               │
│  ┌────────────────────┐  │               │
│  │ ConfidentialBet    │  │               │
│  │ - Encrypted bets   │  │               │
│  │ - Private positions│  │               │
│  └────────────────────┘  │               │
│                          │               │
│  ┌────────────────────┐  │               │
│  │ ZKAttestVerifier   │  │               │
│  │ - Verify zkProofs  │  │               │
│  └────────────────────┘  │               │
│                          │               │
│  ┌────────────────────┐  │               │
│  │ MPCCoordinator     │  │               │
│  │ - Threshold voting │  │               │
│  │ - Secure aggregate │  │               │
│  └────────────────────┘  │               │
└──────────┬───────────────┘               │
           │                               │
           │                               │
           └───────────┬───────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Supabase (PostgreSQL):                                              │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ Tables:                                                     │     │
│  │ - markets (core questions)                                 │     │
│  │ - marketplaces (platforms)                                 │     │
│  │ - external_markets (market instances)                      │     │
│  │ - bet_slips (user bets)                                    │     │
│  │ - proxied_bets (individual bets)                           │     │
│  │ - disputes (outcome challenges)                            │     │
│  │ - subjective_markets (private markets)                     │     │
│  │ - attestations (zkAttestation data)                        │     │
│  │ - user_balances (winnings)                                 │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                       │
│  The Graph (Knowledge Graph):                                        │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ GRC-20 Entities:                                           │     │
│  │ - Market entities (questions, metadata)                    │     │
│  │ - Marketplace entities (platforms)                         │     │
│  │ - Relationships (hasExternalMarket, hostedOn)              │     │
│  │ - Query interface for market discovery                     │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL INTEGRATIONS                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Blockchain Networks:                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Solana     │  │  Polymarket  │  │   Ethereum   │              │
│  │   (LMSR)     │  │  (Orderbook) │  │   (Future)   │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                       │
│  External APIs:                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  OpenAI API  │  │  NewsAPI     │  │  Twitter API │              │
│  │  (AI Oracle) │  │  (Evidence)  │  │  (Sentiment) │              │
│  └──────────────┘  ┌──────────────┘  └──────────────┘              │
│                                                                       │
│  Privacy/Identity:                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  NebulaID    │  │  Biconomy    │  │  Hyperlane   │              │
│  │ (zkAttest)   │  │  (AA/Gas)    │  │  (Bridge)    │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Standard Bet Flow

```
User                Frontend            Smart Contract         Bet Router          Marketplace
 │                     │                      │                     │                   │
 │  1. Create Bet Slip │                      │                     │                   │
 │────────────────────>│                      │                     │                   │
 │                     │                      │                     │                   │
 │                     │  2. placeBet()       │                     │                   │
 │                     │─────────────────────>│                     │                   │
 │                     │                      │                     │                   │
 │                     │  3. Transfer USDC    │                     │                   │
 │                     │─────────────────────>│                     │                   │
 │                     │                      │                     │                   │
 │                     │                      │  4. BetSlipCreated  │                   │
 │                     │                      │────────────────────>│                   │
 │                     │                      │                     │                   │
 │                     │                      │                     │  5. Calculate     │
 │                     │                      │                     │     Allocation    │
 │                     │                      │                     │                   │
 │                     │                      │                     │  6. Execute Bets  │
 │                     │                      │                     │──────────────────>│
 │                     │                      │                     │                   │
 │                     │                      │                     │  7. Tx Confirmed  │
 │                     │                      │                     │<──────────────────│
 │                     │                      │                     │                   │
 │                     │                      │  8. recordProxiedBet│                   │
 │                     │                      │<────────────────────│                   │
 │                     │                      │                     │                   │
 │  9. Bet Confirmed   │                      │                     │                   │
 │<────────────────────│                      │                     │                   │
 │                     │                      │                     │                   │
```

### 2. AI Oracle & Dispute Flow

```
Market              AI Oracle           Dispute Bot         Smart Contract      Users
  │                    │                     │                     │              │
  │  1. Resolved       │                     │                     │              │
  │───────────────────>│                     │                     │              │
  │                    │                     │                     │              │
  │                    │  2. Fetch Evidence  │                     │              │
  │                    │     (News, Social)  │                     │              │
  │                    │                     │                     │              │
  │                    │  3. Run ML Model    │                     │              │
  │                    │     (Anomaly Score) │                     │              │
  │                    │                     │                     │              │
  │                    │  4. Score < 30%     │                     │              │
  │                    │     (Suspicious)    │                     │              │
  │                    │                     │                     │              │
  │                    │  5. Trigger Dispute │                     │              │
  │                    │────────────────────>│                     │              │
  │                    │                     │                     │              │
  │                    │                     │  6. submitDispute() │              │
  │                    │                     │────────────────────>│              │
  │                    │                     │                     │              │
  │                    │                     │                     │  7. Vote     │
  │                    │                     │                     │<─────────────│
  │                    │                     │                     │              │
  │                    │                     │                     │  8. Vote     │
  │                    │                     │                     │<─────────────│
  │                    │                     │                     │              │
  │                    │                     │  9. resolveDispute()│              │
  │                    │                     │────────────────────>│              │
  │                    │                     │                     │              │
  │                    │                     │  10. claimReward()  │              │
  │                    │                     │────────────────────>│              │
  │                    │                     │                     │              │
```

### 3. Subjective Market Flow

```
Creator            Frontend         SubjectiveFactory      Verifiers         MPC Oracle
  │                   │                     │                  │                  │
  │  1. Create Market │                     │                  │                  │
  │──────────────────>│                     │                  │                  │
  │                   │                     │                  │                  │
  │                   │  2. createMarket()  │                  │                  │
  │                   │────────────────────>│                  │                  │
  │                   │                     │                  │                  │
  │                   │  3. Market Created  │                  │                  │
  │                   │<────────────────────│                  │                  │
  │                   │                     │                  │                  │
  │  4. Notify        │                     │                  │                  │
  │   Verifiers       │                     │                  │                  │
  │──────────────────────────────────────────────────────────>│                  │
  │                   │                     │                  │                  │
  │                   │                     │  5. Event Occurs │                  │
  │                   │                     │                  │                  │
  │                   │                     │  6. submitAttestation()             │
  │                   │                     │<─────────────────│                  │
  │                   │                     │                  │                  │
  │                   │                     │  7. submitAttestation()             │
  │                   │                     │<─────────────────│                  │
  │                   │                     │                  │                  │
  │                   │                     │  8. submitAttestation()             │
  │                   │                     │<─────────────────│                  │
  │                   │                     │                  │                  │
  │                   │                     │  9. Threshold Reached               │
  │                   │                     │                  │                  │
  │                   │                     │  10. Aggregate Votes                │
  │                   │                     │─────────────────────────────────────>│
  │                   │                     │                  │                  │
  │                   │                     │  11. Final Outcome                  │
  │                   │                     │<─────────────────────────────────────│
  │                   │                     │                  │                  │
  │                   │  12. Market Resolved│                  │                  │
  │                   │<────────────────────│                  │                  │
  │                   │                     │                  │                  │
  │  13. Payouts      │                     │                  │                  │
  │<──────────────────│                     │                  │                  │
  │                   │                     │                  │                  │
```

---

## Component Interaction Matrix

| Component | Interacts With | Purpose |
|-----------|----------------|---------|
| **Frontend** | Smart Contracts, Backend Services, Supabase | User interface, wallet connection, data display |
| **MarketAggregator** | PolyBetAdapters, Backend Services | Bet routing, collateral management |
| **SubjectiveFactory** | ZKAttestVerifier, MPCCoordinator | Private market creation & resolution |
| **AIOracleDispute** | AI Oracle Service, Users | Dispute management, voting, rewards |
| **Market Syncer** | External Marketplaces, Supabase | Data aggregation, price updates |
| **AI Oracle** | OpenAI, NewsAPI, Smart Contracts | Anomaly detection, evidence collection |
| **Subjective Oracle** | SubjectiveFactory, Verifiers | Attestation handling, MPC voting |
| **Dispute Bot** | AIOracleDispute, AI Oracle | Automated dispute submission |
| **Supabase** | All Services, Frontend | Data persistence, queries |
| **The Graph** | Frontend, AI Agent | Market discovery, relationships |

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION ENVIRONMENT                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Frontend (Vercel):                                          │
│  ┌────────────────────────────────────────────────────┐     │
│  │ - Next.js app deployed to Edge Network             │     │
│  │ - Automatic deployments from main branch           │     │
│  │ - Environment variables via Vercel dashboard       │     │
│  │ - CDN for static assets                            │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
│  Backend Services (AWS ECS):                                 │
│  ┌────────────────────────────────────────────────────┐     │
│  │ Docker Containers:                                 │     │
│  │ - market-syncer (Fargate task)                     │     │
│  │ - ai-oracle (Fargate task)                         │     │
│  │ - subjective-oracle (Fargate task)                 │     │
│  │ - dispute-bot (Fargate task)                       │     │
│  │                                                     │     │
│  │ Load Balancer (ALB)                                │     │
│  │ Auto-scaling (CPU/Memory based)                    │     │
│  │ CloudWatch Logs & Metrics                          │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
│  Database (Supabase):                                        │
│  ┌────────────────────────────────────────────────────┐     │
│  │ - Managed PostgreSQL                               │     │
│  │ - Automatic backups                                │     │
│  │ - Connection pooling                               │     │
│  │ - Row Level Security enabled                       │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
│  Smart Contracts:                                            │
│  ┌────────────────────────────────────────────────────┐     │
│  │ BNB Chain Mainnet:                                 │     │
│  │ - MarketAggregator                                 │     │
│  │ - PolyBetAdapters                                  │     │
│  │ - SubjectiveMarketFactory                          │     │
│  │ - AIOracleDispute                                  │     │
│  │                                                     │     │
│  │ Oasis Sapphire Mainnet:                            │     │
│  │ - ConfidentialBet                                  │     │
│  │ - ZKAttestationVerifier                            │     │
│  │ - MPCVerifierCoordinator                           │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
│  Monitoring & Logging:                                       │
│  ┌────────────────────────────────────────────────────┐     │
│  │ - Sentry (error tracking)                          │     │
│  │ - Datadog (metrics & APM)                          │     │
│  │ - CloudWatch (AWS logs)                            │     │
│  │ - Grafana (dashboards)                             │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Layer 1: Smart Contract Security                            │
│  ┌────────────────────────────────────────────────────┐     │
│  │ - Access control (Ownable, role-based)             │     │
│  │ - Reentrancy guards                                │     │
│  │ - SafeERC20 for token transfers                    │     │
│  │ - Pausable contracts                               │     │
│  │ - Timelock for admin actions                       │     │
│  │ - External audits (CertiK, OpenZeppelin)           │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
│  Layer 2: Privacy & Encryption                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │ - Oasis Sapphire confidential contracts            │     │
│  │ - zkSNARK proofs for attestations                  │     │
│  │ - MPC for threshold voting                         │     │
│  │ - Encrypted bet data                               │     │
│  │ - Anonymous dispute submission                     │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
│  Layer 3: Backend Security                                   │
│  ┌────────────────────────────────────────────────────┐     │
│  │ - API rate limiting                                │     │
│  │ - JWT authentication                               │     │
│  │ - Environment variable encryption (AWS Secrets)    │     │
│  │ - HTTPS only                                       │     │
│  │ - CORS policies                                    │     │
│  │ - Input validation & sanitization                  │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
│  Layer 4: Database Security                                  │
│  ┌────────────────────────────────────────────────────┐     │
│  │ - Row Level Security (RLS)                         │     │
│  │ - Encrypted at rest                                │     │
│  │ - Encrypted in transit (SSL)                       │     │
│  │ - Regular backups                                  │     │
│  │ - Audit logs                                       │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
│  Layer 5: Infrastructure Security                            │
│  ┌────────────────────────────────────────────────────┐     │
│  │ - VPC isolation                                    │     │
│  │ - Security groups (firewall rules)                 │     │
│  │ - DDoS protection (Cloudflare)                     │     │
│  │ - WAF (Web Application Firewall)                   │     │
│  │ - Regular security scans                           │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Scalability Considerations

### Horizontal Scaling
- **Frontend**: Edge network (Vercel) - auto-scales
- **Services**: ECS Fargate with auto-scaling groups
- **Database**: Supabase connection pooling + read replicas

### Vertical Scaling
- **Smart Contracts**: Gas optimization, batching
- **Services**: Increase container resources as needed
- **Database**: Upgrade Supabase plan for more connections

### Caching Strategy
- **Frontend**: ISR (Incremental Static Regeneration) every 60s
- **API**: Redis cache for frequently accessed data
- **Prices**: In-memory cache with 5-minute TTL

### Load Distribution
- **Market Syncer**: Parallel fetching with Promise.all()
- **AI Oracle**: Queue-based processing (Bull/BullMQ)
- **Dispute Bot**: Rate-limited submission to avoid spam

---

This architecture supports the 12-week MVP implementation plan and can scale to handle 1000+ users and $1M+ in bet volume within 6 months post-launch.
