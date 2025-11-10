# OmniMarkets - Complete Deployment Guide

## 🚀 Quick Start (5 Steps)

### Prerequisites
- Node.js 20+
- PostgreSQL database
- BSC testnet BNB (from [faucet](https://testnet.bnbchain.org/faucet-smart))
- Wallet with private key

---

## Step 1: Environment Configuration (5 min)

### 1.1 Create contracts/.env
```bash
cd contracts
cat > .env << 'EOF'
PRIVATE_KEY=0x...  # Your deployer wallet private key
BSCSCAN_API_KEY=...  # Get from https://bscscan.com/myapikey
EOF
```

### 1.2 Create web-app/.env.local
```bash
cd web-app
cat > .env.local << 'EOF'
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/omnimarkets

# BSC RPC
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.bnbchain.org:8545

# Oracle service key (can be same as PRIVATE_KEY for testing)
ORACLE_PRIVATE_KEY=0x...

# Contract addresses (will be filled after deployment)
NEXT_PUBLIC_MARKET_AGGREGATOR_ADDRESS=
NEXT_PUBLIC_DISPUTE_ADDRESS=
NEXT_PUBLIC_SUBJECTIVE_FACTORY_ADDRESS=

# WalletConnect (get from https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...

# Optional: AI features
OPENAI_API_KEY=sk-...
EOF
```

---

## Step 2: Deploy Smart Contracts (10 min)

```bash
cd contracts

# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Deploy to BSC testnet
npx hardhat run scripts/deploy-all.js --network bscTestnet
```

**Expected Output:**
```
🚀 Deploying OmniMarkets contracts to bscTestnet

📝 Deploying with account: 0x...
💰 Account balance: 0.5 ETH

📦 Deploying MarketAggregator...
✅ MarketAggregator deployed to: 0xABC...

📦 Deploying AIOracleDispute...
✅ AIOracleDispute deployed to: 0xDEF...

📦 Deploying SubjectiveMarketFactory...
✅ SubjectiveMarketFactory deployed to: 0xGHI...

🔐 Setting up roles...
✅ Granted ORACLE_ROLE to AIOracleDispute
✅ Granted ROUTER_ROLE to deployer
✅ Granted AI_ORACLE_ROLE to deployer

📄 Deployment info saved to: contracts/deployments/bscTestnet.json
📄 Deployment info copied to web-app: web-app/src/deployments/bscTestnet.json
```

### 2.1 Update Environment Variables

Copy the contract addresses from the output and update `web-app/.env.local`:

```bash
# Update these lines in web-app/.env.local
NEXT_PUBLIC_MARKET_AGGREGATOR_ADDRESS=0xABC...
NEXT_PUBLIC_DISPUTE_ADDRESS=0xDEF...
NEXT_PUBLIC_SUBJECTIVE_FACTORY_ADDRESS=0xGHI...
```

### 2.2 Verify Contracts (Optional)

```bash
# Verify MarketAggregator
npx hardhat verify --network bscTestnet 0xABC... "0xYourAddress"

# Verify AIOracleDispute
npx hardhat verify --network bscTestnet 0xDEF...

# Verify SubjectiveMarketFactory
npx hardhat verify --network bscTestnet 0xGHI...
```

---

## Step 3: Setup Database (5 min)

```bash
cd web-app

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migration
npx prisma migrate dev --name init
```

**Expected Output:**
```
✔ Generated Prisma Client
✔ Applied migration 20250112_init

Database schema updated:
  - Created table "User"
  - Created table "Market"
  - Created table "ExternalMarket"
  - Created table "BetSlip"
  - Created table "BetSlipMarket"
  - Created table "Dispute"
  - Created table "Vote"
```

### 3.1 Verify Database (Optional)

```bash
# Open Prisma Studio
npx prisma studio
```

Navigate to http://localhost:5555 to view your database.

---

## Step 4: Start Services (2 min)

### 4.1 Start Market Syncer

```bash
# Terminal 1
cd services
npm install
npm run dev
```

**Expected Output:**
```
[MarketSyncer] 🚀 Starting market syncer service...
[MarketSyncer] Sync interval: 300s

[MarketSyncer] Starting market sync...
[MarketSyncer] Fetched 42 markets from Polymarket
[MarketSyncer] ✅ Synced 42 markets in 1234ms
```

### 4.2 Start Web App

```bash
# Terminal 2
cd web-app
npm run dev
```

**Expected Output:**
```
▲ Next.js 15.0.0
- Local:        http://localhost:3000
- Network:      http://192.168.1.x:3000

✓ Ready in 2.3s
```

---

## Step 5: Test End-to-End (10 min)

### 5.1 Sync Markets

```bash
curl -X POST http://localhost:3000/api/markets/sync
```

**Expected Response:**
```json
{
  "success": true,
  "synced": 42
}
```

### 5.2 View Markets

Open http://localhost:3000/feed

You should see:
- ✅ Market cards with real Polymarket data
- ✅ Swipeable interface
- ✅ YES/NO betting options

### 5.3 Connect Wallet

1. Click "Connect Wallet"
2. Select your wallet (MetaMask, WalletConnect, etc.)
3. Switch to BSC Testnet (Chain ID: 97)
4. Approve connection

### 5.4 Place a Bet

1. Navigate to /feed
2. Select a market
3. Click YES or NO
4. Enter amount (e.g., 0.01 BNB)
5. Click "Bet X BNB on YES/NO"
6. Approve transaction in wallet
7. Wait for confirmation

### 5.5 Verify Transaction

1. Check transaction on [BSC Testnet Explorer](https://testnet.bscscan.com)
2. Verify bet in database:
   ```bash
   cd web-app
   npx prisma studio
   ```
3. Check BetSlip table for your bet

---

## 🧪 Testing Checklist

### Smart Contracts
- [ ] MarketAggregator deployed
- [ ] AIOracleDispute deployed
- [ ] SubjectiveMarketFactory deployed
- [ ] Roles configured correctly
- [ ] Contracts verified on BscScan

### Database
- [ ] Migration successful
- [ ] All tables created
- [ ] Indices created
- [ ] Can connect with Prisma Studio

### Backend Services
- [ ] Market syncer running
- [ ] Markets syncing from Polymarket
- [ ] Data saving to database
- [ ] No errors in console

### Frontend
- [ ] App running on localhost:3000
- [ ] Markets loading on /feed
- [ ] Wallet connection working
- [ ] Can place bets
- [ ] Transactions confirming

### API Routes
- [ ] POST /api/markets/sync works
- [ ] GET /api/markets returns data
- [ ] GET /api/bets/[address] works

---

## 🐛 Troubleshooting

### Issue: Contract deployment fails with "insufficient funds"

**Solution:**
```bash
# Check your balance
npx hardhat run scripts/check-balance.js --network bscTestnet

# Get testnet BNB from faucet
# Visit: https://testnet.bnbchain.org/faucet-smart
```

### Issue: Database migration fails

**Solution:**
```bash
# Reset database
npx prisma migrate reset

# Run migration again
npx prisma migrate dev --name init
```

### Issue: Markets not syncing

**Solution:**
```bash
# Check Polymarket API manually
cd services
node -e "
const { PolymarketAdapter } = require('./src/adapters/polymarket-adapter.js');
const adapter = new PolymarketAdapter();
adapter.fetchMarkets().then(m => console.log('Markets:', m.length));
"
```

### Issue: Frontend can't connect to contracts

**Solution:**
1. Verify contract addresses in `.env.local`
2. Check wallet is on BSC Testnet (Chain ID: 97)
3. Clear browser cache and reload
4. Check browser console for errors

### Issue: Transaction fails

**Solution:**
1. Check you have enough BNB for gas
2. Verify contract address is correct
3. Check transaction on BscScan for error message
4. Ensure wallet is connected to BSC Testnet

---

## 📊 Monitoring

### Check Service Health

```bash
# Market syncer logs
cd services
npm run dev
# Watch for "✅ Synced X markets"

# Web app logs
cd web-app
npm run dev
# Watch for API requests
```

### Check Database

```bash
cd web-app
npx prisma studio
```

View:
- **Markets**: Should have 40+ entries
- **ExternalMarkets**: Should have 40+ entries
- **BetSlips**: Should show your test bets

### Check Contracts

Visit [BSC Testnet Explorer](https://testnet.bscscan.com):
1. Search for your contract addresses
2. View transactions
3. Check events emitted

---

## 🚀 Production Deployment

### Prerequisites
- BSC mainnet BNB
- Production database (e.g., Supabase, Railway)
- Domain name
- SSL certificate

### Steps

1. **Update Environment**
   ```bash
   # Use mainnet RPC
   BSC_RPC_URL=https://bsc-dataseed.bnbchain.org
   
   # Use production database
   DATABASE_URL=postgresql://prod-user:pass@prod-host:5432/omnimarkets
   ```

2. **Deploy Contracts to Mainnet**
   ```bash
   npx hardhat run scripts/deploy-all.js --network bscMainnet
   ```

3. **Deploy Frontend**
   ```bash
   # Vercel
   vercel --prod
   
   # Or Railway
   railway up
   ```

4. **Deploy Services**
   ```bash
   # Railway
   cd services
   railway up
   
   # Or Docker
   docker build -t omni-markets-services .
   docker run -d omni-markets-services
   ```

5. **Monitor**
   - Set up error tracking (Sentry)
   - Set up uptime monitoring (UptimeRobot)
   - Set up analytics (PostHog)

---

## 📈 Performance Optimization

### Database
- [ ] Add connection pooling
- [ ] Enable query caching
- [ ] Add database indices
- [ ] Use read replicas

### Frontend
- [ ] Enable Next.js caching
- [ ] Optimize images
- [ ] Code splitting
- [ ] CDN for static assets

### Contracts
- [ ] Gas optimization
- [ ] Batch operations
- [ ] Use events for data

---

## 🔒 Security Checklist

### Contracts
- [ ] Access control implemented
- [ ] Reentrancy guards
- [ ] Input validation
- [ ] Emergency pause
- [ ] Security audit

### Backend
- [ ] Rate limiting
- [ ] Input sanitization
- [ ] Secure key storage
- [ ] CORS configured
- [ ] Error handling

### Frontend
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Secure wallet connection
- [ ] Transaction validation

---

## 📞 Support

- **Documentation**: `/omni-markets/documents/`
- **GitHub Issues**: Create issue for bugs
- **Discord**: Join community for help

---

## ✅ Final Checklist

Before going live:

- [ ] All contracts deployed and verified
- [ ] Database migrated and tested
- [ ] All services running without errors
- [ ] Frontend accessible and functional
- [ ] Wallet connection working
- [ ] Can place and settle bets
- [ ] Transactions confirming on-chain
- [ ] Error handling tested
- [ ] Security measures in place
- [ ] Monitoring set up
- [ ] Backup strategy implemented
- [ ] Documentation complete

---

**Status**: Ready for Deployment 🚀

**Estimated Time**: 30-45 minutes for full setup

**Next Steps**: Follow Step 1 above to begin deployment
