# OmniMarkets: Quick Start Guide

## Prerequisites

- Node.js 20+
- Bun or npm/pnpm
- Git
- Docker (optional, for services)
- Metamask or compatible wallet

---

## Setup Instructions

### 1. Clone and Install

```bash
# Clone repository
git clone <repo-url>
cd omni-markets

# Install dependencies
npm install
# or
bun install

# Install dependencies for all workspaces
npm run install:all
```

### 2. Environment Setup

Create `.env` files in each workspace:

**Root `.env`**:
```bash
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

# RPC URLs
BNB_RPC_URL=https://bsc-testnet.publicnode.com
OPBNB_RPC_URL=https://opbnb-testnet-rpc.bnbchain.org
SAPPHIRE_RPC_URL=https://testnet.sapphire.oasis.dev
SOLANA_RPC_URL=https://api.devnet.solana.com

# Private Keys (for deployment)
PRIVATE_KEY=your-private-key
DISPUTE_BOT_PRIVATE_KEY=bot-private-key

# API Keys
OPENAI_API_KEY=sk-...
NEWS_API_KEY=...
BSCSCAN_API_KEY=...
```

**Frontend `.env.local`**:
```bash
NEXT_PUBLIC_AGGREGATOR_ADDRESS=0x...
NEXT_PUBLIC_DISPUTE_ADDRESS=0x...
NEXT_PUBLIC_SUBJECTIVE_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_BNB_RPC_URL=https://bsc-testnet.publicnode.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### 3. Database Setup

```bash
# Create Supabase project at https://supabase.com

# Run migrations
cd database
psql $DATABASE_URL < schema.sql

# Or use Supabase dashboard to run SQL
```

### 4. Deploy Smart Contracts

```bash
cd contracts

# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Deploy to BNB Testnet
npx hardhat run scripts/deploy-bnb.ts --network bnbTestnet

# Deploy to Oasis Sapphire Testnet
npx hardhat run scripts/deploy-sapphire.ts --network sapphireTestnet

# Save deployed addresses to .env
```

### 5. Start Services

**Option A: Docker Compose**
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

**Option B: Manual Start**
```bash
# Terminal 1: Market Syncer
cd services/market-syncer
npm run dev

# Terminal 2: AI Oracle
cd services/ai-oracle
npm run dev

# Terminal 3: Dispute Bot
cd services/dispute-bot
npm run dev
```

### 6. Start Frontend

```bash
cd frontend

# Development mode
npm run dev

# Open http://localhost:3000
```

---

## Development Workflow

### Running Tests

```bash
# Smart contracts
cd contracts
npx hardhat test

# Services
cd services/market-syncer
npm test

# Frontend
cd frontend
npm test
```

### Code Quality

```bash
# Lint all workspaces
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

### Building for Production

```bash
# Build all workspaces
npm run build

# Build specific workspace
cd frontend
npm run build
```

---

## Common Tasks

### Add a New Marketplace

1. Create adapter in `services/market-syncer/src/adapters/`
2. Implement `BaseAdapter` interface
3. Register in `MarketSyncer` class
4. Add marketplace to database
5. Update frontend marketplace config

### Create a Subjective Market

1. Connect wallet to frontend
2. Navigate to `/create/private`
3. Fill in market details
4. Select verifiers (addresses)
5. Set threshold (e.g., 3/5)
6. Deploy market

### Submit a Dispute

1. Navigate to `/disputes`
2. Click "Submit Dispute"
3. Select market
4. Provide evidence (text/links)
5. Stake required amount
6. Submit transaction

---

## Troubleshooting

### Contract Deployment Fails
- Check RPC URL is correct
- Ensure wallet has testnet funds
- Verify gas price settings

### Services Not Syncing
- Check environment variables
- Verify database connection
- Check RPC rate limits

### Frontend Not Connecting
- Clear browser cache
- Check Metamask network
- Verify contract addresses in .env

### Database Errors
- Check Supabase project status
- Verify API keys
- Check RLS policies

---

## Useful Commands

```bash
# Reset database
psql $DATABASE_URL < reset.sql

# Check contract on explorer
npx hardhat verify --network bnbTestnet <ADDRESS>

# Monitor service logs
docker-compose logs -f market-syncer

# Restart specific service
docker-compose restart ai-oracle

# Clean build artifacts
npm run clean

# Update all dependencies
npm run update:deps
```

---

## Resources

- [Documentation](./README.md)
- [Architecture](./Architecture.md)
- [API Reference](./API-Reference.md)
- [Contributing](./CONTRIBUTING.md)

---

## Support

- GitHub Issues: <repo-url>/issues
- Discord: <discord-link>
- Email: support@omnimarkets.io
