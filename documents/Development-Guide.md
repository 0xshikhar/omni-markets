# OmniMarkets Development Guide
## Quick Start for BSC Implementation

---

## Prerequisites

- Node.js 20+
- Bun (recommended) or npm/pnpm
- Git
- MetaMask with BSC Testnet configured
- BSC Testnet BNB (from faucet)

---

## Project Setup

### 1. Initialize repo ( wont use monorepo for easy deployments)

```bash
# Create project structure
mkdir omni-markets && cd omni-markets

# Initialize with Bun
bun init

# Create workspace structure
mkdir -p contracts services/{market-syncer,ai-oracle,dispute-bot,subjective-oracle}
mkdir -p frontend shared/{types,utils,sdk} docs scripts
```

### 2. Configure Workspace

**package.json** (root):
```json
{
  "name": "omni-markets",
  "private": true,
  "workspaces": [
    "contracts",
    "services/*",
    "frontend",
    "shared/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "turbo": "^1.11.0",
    "typescript": "^5.3.0"
  }
}
```

**turbo.json**:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"]
    },
    "lint": {}
  }
}
```

---

## Smart Contracts Setup (setup already done)

### 1. Initialize Hardhat

```bash
cd contracts
bun init
bun add -D hardhat @nomicfoundation/hardhat-toolbox
bunx hardhat init
```

### 2. Configure Hardhat

**hardhat.config.ts**:
```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
      chainId: 97,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    },
    bscMainnet: {
      url: "https://bsc-dataseed.bnbchain.org",
      chainId: 56,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  },
  etherscan: {
    apiKey: {
      bscTestnet: process.env.BSCSCAN_API_KEY || "",
      bsc: process.env.BSCSCAN_API_KEY || ""
    }
  }
};

export default config;
```

### 3. Install Dependencies

```bash
bun add @openzeppelin/contracts
bun add -D @types/node dotenv
```

### 4. Create Deployment Scripts

**scripts/deploy-all.ts**:
```typescript
import { ethers } from "hardhat";

async function main() {
  console.log("Deploying OmniMarkets contracts to BSC Testnet...\n");

  // Deploy MarketAggregator
  const MarketAggregator = await ethers.getContractFactory("MarketAggregator");
  const aggregator = await MarketAggregator.deploy();
  await aggregator.waitForDeployment();
  const aggregatorAddress = await aggregator.getAddress();
  console.log("✅ MarketAggregator deployed to:", aggregatorAddress);

  // Deploy AIOracleDispute
  const AIOracleDispute = await ethers.getContractFactory("AIOracleDispute");
  const dispute = await AIOracleDispute.deploy();
  await dispute.waitForDeployment();
  const disputeAddress = await dispute.getAddress();
  console.log("✅ AIOracleDispute deployed to:", disputeAddress);

  // Deploy SubjectiveMarketFactory
  const SubjectiveMarketFactory = await ethers.getContractFactory("SubjectiveMarketFactory");
  const subjective = await SubjectiveMarketFactory.deploy();
  await subjective.waitForDeployment();
  const subjectiveAddress = await subjective.getAddress();
  console.log("✅ SubjectiveMarketFactory deployed to:", subjectiveAddress);

  // Setup roles
  console.log("\nSetting up roles...");
  const ROUTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ROUTER_ROLE"));
  const ORACLE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ORACLE_ROLE"));
  
  await aggregator.grantRole(ORACLE_ROLE, disputeAddress);
  console.log("✅ Granted ORACLE_ROLE to AIOracleDispute");

  // Save deployment info
  const deployment = {
    network: "bscTestnet",
    chainId: 97,
    contracts: {
      MarketAggregator: aggregatorAddress,
      AIOracleDispute: disputeAddress,
      SubjectiveMarketFactory: subjectiveAddress
    },
    timestamp: new Date().toISOString()
  };

  console.log("\n📋 Deployment Summary:");
  console.log(JSON.stringify(deployment, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

---

## Database Setup

### 1. Initialize Prisma ( done)

```bash
cd shared
mkdir database && cd database
bun init
bun add prisma @prisma/client
bunx prisma init
```

### 2. Configure Prisma Schema

**prisma/schema.prisma**:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Market {
  id              Int      @id @default(autoincrement())
  chainId         Int
  contractAddress String
  marketId        Int
  question        String
  category        String
  marketType      String
  status          String
  resolutionTime  DateTime
  totalVolume     Decimal  @db.Decimal(20, 8)
  creator         String
  outcome         Int?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  externalMarkets ExternalMarket[]
  betSlips        BetSlipMarket[]
  disputes        Dispute[]
  
  @@unique([chainId, contractAddress, marketId])
  @@index([status, category])
}

model ExternalMarket {
  id          Int      @id @default(autoincrement())
  marketId    Int
  marketplace String
  externalId  String
  price       Int
  liquidity   Decimal  @db.Decimal(20, 8)
  lastUpdate  DateTime @default(now())
  
  market      Market   @relation(fields: [marketId], references: [id])
  
  @@unique([marketplace, externalId])
  @@index([marketId])
}

model BetSlip {
  id             Int      @id @default(autoincrement())
  chainId        Int
  betSlipId      Int
  user           String
  totalAmount    Decimal  @db.Decimal(20, 8)
  expectedPayout Decimal? @db.Decimal(20, 8)
  actualPayout   Decimal? @db.Decimal(20, 8)
  status         String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  markets        BetSlipMarket[]
  
  @@unique([chainId, betSlipId])
  @@index([user, status])
}

model BetSlipMarket {
  id         Int     @id @default(autoincrement())
  betSlipId  Int
  marketId   Int
  amount     Decimal @db.Decimal(20, 8)
  outcome    Int
  
  betSlip    BetSlip @relation(fields: [betSlipId], references: [id])
  market     Market  @relation(fields: [marketId], references: [id])
  
  @@unique([betSlipId, marketId])
}

model Dispute {
  id              Int      @id @default(autoincrement())
  chainId         Int
  disputeId       Int
  marketId        Int
  submitter       String
  evidenceHash    String
  stake           Decimal  @db.Decimal(20, 8)
  status          String
  votesFor        Decimal  @db.Decimal(20, 8) @default(0)
  votesAgainst    Decimal  @db.Decimal(20, 8) @default(0)
  proposedOutcome Int
  aiConfidence    Int?
  submittedAt     DateTime @default(now())
  resolvedAt      DateTime?
  
  market          Market   @relation(fields: [marketId], references: [id])
  votes           Vote[]
  
  @@unique([chainId, disputeId])
  @@index([status, marketId])
}

model Vote {
  id         Int      @id @default(autoincrement())
  disputeId  Int
  voter      String
  support    Boolean
  weight     Decimal  @db.Decimal(20, 8)
  timestamp  DateTime @default(now())
  
  dispute    Dispute  @relation(fields: [disputeId], references: [id])
  
  @@unique([disputeId, voter])
}

model User {
  id        Int      @id @default(autoincrement())
  address   String   @unique
  aaWallet  String?
  nonce     Int      @default(0)
  createdAt DateTime @default(now())
}
```

### 3. Run Migrations

```bash
# Generate Prisma client
bunx prisma generate

# Create migration
bunx prisma migrate dev --name init

# Push to database
bunx prisma db push
```

---

## Service Development

### market-syncer Service

**services/market-syncer/package.json**:
```json
{
  "name": "@omni-markets/market-syncer",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@prisma/client": "^5.7.0",
    "hono": "^3.11.0",
    "bull": "^4.12.0"
  },
  "devDependencies": {
    "tsx": "^4.7.0",
    "typescript": "^5.3.0"
  }
}
```

**services/market-syncer/src/index.ts**:
```typescript
import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { PolymarketAdapter } from './adapters/polymarket';

const app = new Hono();
const prisma = new PrismaClient();

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

// Get markets
app.get('/markets', async (c) => {
  const markets = await prisma.market.findMany({
    where: { status: 'Active' },
    include: { externalMarkets: true }
  });
  return c.json(markets);
});

// Sync job
async function syncMarkets() {
  console.log('Syncing markets...');
  
  const adapter = new PolymarketAdapter();
  const markets = await adapter.fetchMarkets();
  
  for (const market of markets) {
    await prisma.externalMarket.upsert({
      where: {
        marketplace_externalId: {
          marketplace: 'polymarket',
          externalId: market.externalId
        }
      },
      update: {
        price: market.price,
        liquidity: market.liquidity,
        lastUpdate: new Date()
      },
      create: market
    });
  }
  
  console.log(`✅ Synced ${markets.length} markets`);
}

// Run sync every 5 minutes
setInterval(syncMarkets, 5 * 60 * 1000);
syncMarkets(); // Initial sync

export default app;
```

---

## Frontend Setup

### 1. Initialize Next.js ( done)

```bash
cd frontend
bunx create-next-app@latest . --typescript --tailwind --app --use-bun
```

### 2. Install Dependencies

```bash
bun add wagmi viem @tanstack/react-query
bun add @reown/appkit @reown/appkit-adapter-wagmi
bun add @radix-ui/react-* lucide-react
bun add -D @types/node
```

### 3. Configure Wagmi

**lib/wagmi.ts**:
```typescript
import { createConfig, http } from 'wagmi';
import { bscTestnet, bsc } from 'wagmi/chains';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!;

export const wagmiAdapter = new WagmiAdapter({
  networks: [bscTestnet, bsc],
  projectId
});

export const config = wagmiAdapter.wagmiConfig;

createAppKit({
  adapters: [wagmiAdapter],
  networks: [bscTestnet, bsc],
  projectId,
  metadata: {
    name: 'OmniMarkets',
    description: 'Decentralized Prediction Markets',
    url: 'https://omnimarkets.io',
    icons: ['https://omnimarkets.io/icon.png']
  }
});
```

### 4. Create Contract Hooks

**hooks/useMarketAggregator.ts**:
```typescript
import { useReadContract, useWriteContract } from 'wagmi';
import { parseEther } from 'viem';
import { MARKET_AGGREGATOR_ABI, MARKET_AGGREGATOR_ADDRESS } from '@/lib/contracts';

export function useCreateMarket() {
  const { writeContract, isPending } = useWriteContract();
  
  const createMarket = async (
    question: string,
    category: string,
    resolutionTime: number
  ) => {
    return writeContract({
      address: MARKET_AGGREGATOR_ADDRESS,
      abi: MARKET_AGGREGATOR_ABI,
      functionName: 'createMarket',
      args: [question, category, 0, resolutionTime] // 0 = Public market
    });
  };
  
  return { createMarket, isPending };
}

export function useCreateBetSlip() {
  const { writeContract, isPending } = useWriteContract();
  
  const createBetSlip = async (
    marketIds: number[],
    amounts: string[],
    outcomes: number[]
  ) => {
    const totalAmount = amounts.reduce(
      (sum, amt) => sum + parseEther(amt),
      0n
    );
    
    return writeContract({
      address: MARKET_AGGREGATOR_ADDRESS,
      abi: MARKET_AGGREGATOR_ABI,
      functionName: 'createBetSlip',
      args: [
        marketIds,
        amounts.map(a => parseEther(a)),
        outcomes
      ],
      value: totalAmount
    });
  };
  
  return { createBetSlip, isPending };
}

export function useMarkets() {
  // Fetch from API instead of on-chain for better performance
  const { data, isLoading } = useSWR('/api/markets', fetcher);
  return { markets: data, isLoading };
}
```

---

## Environment Configuration

**.env.example**:
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/omnimarkets"

# BSC RPC
BSC_RPC_URL="https://bsc-dataseed.bnbchain.org"
BSC_TESTNET_RPC_URL="https://data-seed-prebsc-1-s1.bnbchain.org:8545"

# Private Keys (NEVER commit real keys)
PRIVATE_KEY="0x..."
ROUTER_PRIVATE_KEY="0x..."
ORACLE_PRIVATE_KEY="0x..."

# Contract Addresses (update after deployment)
NEXT_PUBLIC_MARKET_AGGREGATOR_ADDRESS="0x..."
NEXT_PUBLIC_DISPUTE_ADDRESS="0x..."
NEXT_PUBLIC_SUBJECTIVE_FACTORY_ADDRESS="0x..."

# API Keys
BSCSCAN_API_KEY="..."
OPENAI_API_KEY="sk-..."
NEWS_API_KEY="..."
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="..."

# IPFS
PINATA_API_KEY="..."
PINATA_SECRET_KEY="..."
```

---

## Development Workflow

### Daily Development

```bash
# Start all services in dev mode
bun run dev

# Or start individually
cd contracts && bun run compile
cd services/market-syncer && bun run dev
cd services/ai-oracle && bun run dev
cd frontend && bun run dev
```

### Testing

```bash
# Test contracts
cd contracts && bun run test

# Test services
cd services/market-syncer && bun run test

# Test frontend
cd frontend && bun run test
```

### Deployment

```bash
# Deploy contracts to testnet
cd contracts
bunx hardhat run scripts/deploy-all.ts --network bscTestnet

# Build services
cd services/market-syncer && bun run build
cd services/ai-oracle && bun run build

# Build frontend
cd frontend && bun run build
```

---

## Debugging Tips

### Contract Debugging

```bash
# Run Hardhat console
bunx hardhat console --network bscTestnet

# Check contract on BscScan
open "https://testnet.bscscan.com/address/<CONTRACT_ADDRESS>"

# Verify contract
bunx hardhat verify --network bscTestnet <ADDRESS> <CONSTRUCTOR_ARGS>
```

### Service Debugging

```typescript
// Add detailed logging
console.log('[market-syncer] Fetching markets...');
console.error('[market-syncer] Error:', error);

// Use debugger
import { inspect } from 'util';
console.log(inspect(data, { depth: null, colors: true }));
```

### Frontend Debugging

```typescript
// Use Wagmi devtools
import { WagmiDevtools } from 'wagmi/devtools';

<WagmiDevtools />

// Log contract calls
const { data, error } = useReadContract({
  ...config,
  onSuccess: (data) => console.log('Success:', data),
  onError: (error) => console.error('Error:', error)
});
```

---

## Common Issues & Solutions

### Issue: Transaction Reverted

**Solution**: Check contract state, gas limit, and error messages
```bash
bunx hardhat run scripts/debug-tx.ts --network bscTestnet
```

### Issue: RPC Rate Limit

**Solution**: Use multiple RPC providers with fallback
```typescript
const config = createConfig({
  chains: [bscTestnet],
  transports: {
    [bscTestnet.id]: fallback([
      http('https://bsc-testnet.publicnode.com'),
      http('https://data-seed-prebsc-1-s1.bnbchain.org:8545')
    ])
  }
});
```

### Issue: Database Connection Failed

**Solution**: Check DATABASE_URL and network access
```bash
bunx prisma db pull  # Test connection
bunx prisma studio   # Open GUI
```

---

## Next Steps

1. **Complete contract implementation** - Fill in TODOs in contracts
2. **Build adapters** - Implement Polymarket, BNB AMM adapters
3. **Create UI components** - Build MarketCard, BetSlip, etc.
4. **Set up CI/CD** - GitHub Actions for testing & deployment
5. **Write documentation** - API docs, user guides

---

## Resources

- [Hardhat Docs](https://hardhat.org/docs)
- [Wagmi Docs](https://wagmi.sh)
- [Prisma Docs](https://www.prisma.io/docs)
- [BSC Docs](https://docs.bnbchain.org)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
