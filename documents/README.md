# OmniMarkets - Decentralized Prediction Markets on BSC

> **AI-powered prediction markets with liquidity aggregation, dispute resolution, and gasless UX**

[![BSC](https://img.shields.io/badge/BSC-Testnet-yellow)](https://testnet.bscscan.com)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Status](https://img.shields.io/badge/status-ready--for--deployment-green)](DEPLOYMENT-GUIDE.md)

---

## 🎯 Overview

OmniMarkets is a next-generation prediction market platform built on Binance Smart Chain that aggregates liquidity from multiple sources (Polymarket, BNB AMMs, Azuro), features AI-assisted oracle resolution, and provides a seamless gasless UX through ERC-4337.

### Key Features

- **🔄 Liquidity Aggregation** - Route bets across Polymarket, BNB AMMs, and other sources
- **🤖 AI Oracle** - Automated anomaly detection and dispute suggestions
- **⚡ Gasless UX** - ERC-4337 smart accounts with social login
- **🔐 Subjective Markets** - Private markets with verifier circles and commit-reveal
- **💰 Dispute System** - Community-driven resolution with rewards
- **📱 Mobile-First** - Swipeable TikTok-style interface

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  BSC Testnet/Mainnet                     │
├─────────────────────────────────────────────────────────┤
│  • MarketAggregator.sol - Market creation & settlement  │
│  • AIOracleDispute.sol - Dispute resolution & voting    │
│  • SubjectiveMarketFactory.sol - Private markets        │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│              Next.js Frontend + API Routes               │
├─────────────────────────────────────────────────────────┤
│  • Wagmi + Viem for Web3 integration                    │
│  • Privy for wallet authentication                      │
│  • shadcn/ui for components                             │
│  • API routes for data fetching                         │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│              Background Services (Node.js)               │
├─────────────────────────────────────────────────────────┤
│  • Market Syncer - Fetch Polymarket data every 5min     │
│  • AI Oracle - Monitor resolutions & detect anomalies   │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL Database (Prisma)                │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL database
- BSC testnet BNB ([get from faucet](https://testnet.bnbchain.org/faucet-smart))
- Wallet with private key

### Installation

```bash
# Clone repository
git clone <repo-url>
cd omni-markets

# Install dependencies
cd contracts && npm install
cd ../web-app && npm install
cd ../services && npm install
```

### Deploy Contracts

```bash
cd contracts

# Configure environment
cp .env.example .env
# Add your PRIVATE_KEY and BSCSCAN_API_KEY

# Deploy to BSC testnet
npx hardhat run scripts/deploy-all.js --network bscTestnet
```

### Setup Database

```bash
cd web-app

# Configure environment
cp .env.example .env.local
# Add DATABASE_URL and contract addresses

# Run migration
npx prisma migrate dev --name init
```

### Start Services

```bash
# Terminal 1: Market Syncer
cd services
npm run dev

# Terminal 2: Web App
cd web-app
npm run dev
```

### Test

Open http://localhost:3000 and:
1. Connect wallet
2. Navigate to /feed
3. Place a bet
4. Verify transaction on BscScan

---

## 📁 Project Structure

```
omni-markets/
├── contracts/                 # Smart contracts
│   ├── src/
│   │   ├── MarketAggregator.sol
│   │   ├── AIOracleDispute.sol
│   │   └── SubjectiveMarketFactory.sol
│   ├── scripts/deploy-all.js
│   └── hardhat.config.js
│
├── web-app/                   # Next.js frontend
│   ├── src/
│   │   ├── app/              # Pages & API routes
│   │   ├── components/       # UI components
│   │   ├── hooks/            # Contract hooks
│   │   └── lib/              # Utilities
│   ├── prisma/schema.prisma  # Database schema
│   └── package.json
│
├── services/                  # Background services
│   ├── src/
│   │   ├── polymarket.js     # Market syncer
│   │   ├── ai-oracle.js      # Anomaly detection
│   │   └── adapters/         # External API adapters
│   └── package.json
│
└── documents/                 # Documentation
    ├── BSC-Implementation-Plan.md
    ├── Contract-Specifications.md
    ├── Development-Guide.md
    └── DEPLOYMENT-GUIDE.md
```

---

## 🔧 Tech Stack

### Smart Contracts
- **Solidity 0.8.20** - Contract language
- **Hardhat** - Development framework
- **OpenZeppelin** - Security libraries
- **BSC** - Blockchain network

### Frontend
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Wagmi + Viem** - Web3 integration
- **Privy** - Wallet authentication
- **shadcn/ui** - UI components
- **TailwindCSS** - Styling

### Backend
- **Node.js** - Runtime
- **Prisma** - ORM
- **PostgreSQL** - Database
- **polymarket-data** - Market data SDK

### Infrastructure
- **Vercel** - Frontend hosting
- **Railway** - Backend hosting
- **BscScan** - Contract verification

---

## 📊 Smart Contracts

### MarketAggregator.sol

Main contract for market management and bet settlement.

**Key Functions:**
- `createMarket()` - Create new prediction market
- `createBetSlip()` - Place multi-market bet
- `settleBetSlip()` - Settle after resolution
- `claimWinnings()` - Claim payouts

### AIOracleDispute.sol

Handles dispute submission and community voting.

**Key Functions:**
- `submitDispute()` - Submit dispute with stake
- `voteOnDispute()` - Vote on active dispute
- `resolveDispute()` - Finalize dispute outcome
- `claimReward()` - Claim voting rewards

### SubjectiveMarketFactory.sol

Creates private markets with verifier circles.

**Key Functions:**
- `createMarket()` - Create subjective market
- `commitOutcome()` - Submit commitment
- `revealOutcome()` - Reveal vote
- `resolveMarket()` - Finalize with threshold

---

## 🎨 Frontend Pages

- **/** - Landing page with features
- **/feed** - Swipeable market cards
- **/create** - Market creation wizard
- **/disputes** - Dispute center
- **/portfolio** - User bets & winnings
- **/battles** - NFT battles (future)
- **/leaderboard** - Top predictors

---

## 🔌 API Routes

### Markets
- `POST /api/markets/sync` - Sync Polymarket data
- `GET /api/markets` - Get markets with filters
- `GET /api/markets/[id]` - Get single market

### Bets
- `GET /api/bets/[address]` - Get user's bet slips

### Disputes
- `GET /api/disputes` - Get active disputes
- `POST /api/disputes` - Submit dispute

---

## 🧪 Testing

### Run Contract Tests
```bash
cd contracts
npx hardhat test
```

### Test API Routes
```bash
# Sync markets
curl -X POST http://localhost:3000/api/markets/sync

# Get markets
curl http://localhost:3000/api/markets?category=crypto&limit=10
```

### Manual Testing
1. Deploy contracts to testnet
2. Sync markets via API
3. Connect wallet on frontend
4. Place test bet
5. Verify on BscScan

---

## 📖 Documentation

- **[DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md)** - Complete deployment instructions
- **[FINAL-IMPLEMENTATION.md](FINAL-IMPLEMENTATION.md)** - Implementation summary
- **[BSC-Implementation-Plan.md](documents/BSC-Implementation-Plan.md)** - Architecture details
- **[Contract-Specifications.md](documents/Contract-Specifications.md)** - Contract specs
- **[Development-Guide.md](documents/Development-Guide.md)** - Development workflow

---

## 🛣️ Roadmap

### ✅ Phase 1: MVP (Completed)
- Smart contracts deployed
- Frontend with market feed
- Polymarket integration
- Basic betting functionality

### 🚧 Phase 2: Enhancement (In Progress)
- [ ] Dispute resolution UI
- [ ] Portfolio tracking
- [ ] Advanced analytics
- [ ] Mobile optimization

### 📅 Phase 3: Expansion (Planned)
- [ ] Multi-chain support
- [ ] Governance token
- [ ] DAO formation
- [ ] Mobile app
- [ ] Institutional features

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 🔒 Security

- All contracts use OpenZeppelin libraries
- ReentrancyGuard on payable functions
- AccessControl for privileged operations
- Input validation on all external functions
- Emergency pause mechanism

**Security Audit**: Pending

**Bug Bounty**: Coming soon

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## 👥 Team

Built for the BNB Chain Hackathon by the OmniMarkets team.

---

## 🙏 Acknowledgments

- **BNB Chain** - Blockchain infrastructure
- **Polymarket** - Market data
- **OpenZeppelin** - Security libraries
- **Wagmi** - Web3 React hooks
- **Privy** - Wallet authentication

---

## 📞 Contact

- **Website**: https://omnimarkets.io (coming soon)
- **Twitter**: @OmniMarkets (coming soon)
- **Discord**: [Join our community](https://discord.gg/omnimarkets) (coming soon)
- **Email**: dev@omnimarkets.io

---

## ⚡ Quick Links

- [Deploy Now](DEPLOYMENT-GUIDE.md)
- [View Contracts](contracts/src/)
- [API Documentation](documents/API-DOCS.md)
- [Troubleshooting](DEPLOYMENT-GUIDE.md#troubleshooting)

---

**Built with ❤️ on Binance Smart Chain**
