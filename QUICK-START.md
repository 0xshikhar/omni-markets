# Quick Start Guide - Services Setup

## Prerequisites

1. **API Keys** (add to `.env` in repo root):
```bash
# Required for AI Oracle
OPENAI_API_KEY=sk-ant-...  # Get from https://console.anthropic.com
# OR
GOOGLE_API_KEY=...  # Get from https://aistudio.google.com

# Optional but recommended
NEWS_API_KEY="644de33dc41c4fc2930a076a447dfcdf"
  # Get from https://newsapi.org (free tier)

# Required for all services
PRIVATE_KEY=<your-wallet-private-key>  # Wallet with BNB for gas

# Contract addresses (already configured)
NEXT_PUBLIC_DISPUTE_ADDRESS=0x52EbCBf8c967Fcb4b83644626822881ADaA9bffF
NEXT_PUBLIC_SUBJECTIVE_FACTORY_ADDRESS=0x6E83054913aA6C616257Dae2e87BC44F9260EDc6
NEXT_PUBLIC_MARKET_AGGREGATOR_ADDRESS=0xC284Be07898768F0818aAeC84A0bD95Bc5275670

# Optional configuration
AI_PROVIDER=anthropic  # or 'google'
DISPUTE_STAKE_ETH=0.1
AI_CHECK_INTERVAL_MS=60000
DISPUTE_POLL_INTERVAL_MS=60000
SUBJECTIVE_ORACLE_INTERVAL_MS=60000
```

2. **Install Dependencies**:
```bash
cd services
npm install
```

3. **Generate Prisma Client**:
```bash
npm run prisma:generate
```

## Running Services

### Option 1: Run All Services (Recommended)

Open 4 terminal windows:

**Terminal 1 - Market Syncer**:
```bash
cd services
npm run dev:syncer
```

**Terminal 2 - AI Oracle**:
```bash
cd services
npm run dev:ai
```

**Terminal 3 - Dispute Bot**:
```bash
cd services
npm run dev:dispute
```

**Terminal 4 - Subjective Oracle**:
```bash
cd services
npm run dev:subjective
```

### Option 2: Run Individual Services

```bash
# Market syncer only
npm run dev:syncer

# AI oracle only
npm run dev:ai

# Dispute bot only
npm run dev:dispute

# Subjective oracle only
npm run dev:subjective
```

## Verify Services Are Running

### Market Syncer
- Should see: `[market-syncer] Server listening on port 4001`
- Test: `curl http://localhost:4001/health`
- Should return: `{"status":"ok"}`

### AI Oracle
- Should see: `[ai-oracle] 🤖 Starting AI-powered oracle...`
- Should see: `[ai-oracle] AI Provider: anthropic` (or google)
- Should see: `[ai-oracle] NewsAPI: Configured` (if you have API key)

### Dispute Bot
- Should see: `[dispute-bot] 🤖 Starting automated dispute bot...`
- Should see: `[dispute-bot] Wallet: 0x...` (your wallet address)
- Should see: `[dispute-bot] Stake per dispute: 0.1 BNB`

### Subjective Oracle
- Should see: `[subjective-oracle] 🔮 Starting subjective oracle...`
- Should see: `[subjective-oracle] Wallet: 0x...`
- Should see: `[subjective-oracle] Commit duration: 24h`

## Testing the Flow

### 1. Test AI Oracle + Dispute Bot

**Create a test market** (via frontend or contract):
```typescript
// Example: Create a market that will be flagged as anomalous
question: "Test market - will be disputed"
resolutionTime: <now + 1 hour>
```

**Resolve the market quickly** (within 1 hour):
```typescript
// This will trigger anomaly detection (resolved too quickly)
outcome: 1 (YES)
```

**Watch the logs**:
1. AI Oracle should detect anomaly:
   ```
   [ai-oracle] ⚠️ Market resolved very quickly (<1h)
   [ai-oracle] 🚨 Anomaly detected in market <id>
   [ai-oracle] ✅ Dispute suggestion created
   ```

2. Dispute Bot should pick it up:
   ```
   [dispute-bot] Found 1 disputes to submit
   [dispute-bot] Submitting dispute for market <id>...
   [dispute-bot] ✅ Dispute submitted with ID: 1
   ```

### 2. Test Subjective Oracle

**Create a subjective market**:
```typescript
question: "Is this subjective outcome correct?"
verifiers: [0xVerifier1, 0xVerifier2, 0xVerifier3]
threshold: 2  // 2 out of 3
resolutionTime: <now + 1 hour>
```

**Wait for resolution time**, then watch logs:
```
[subjective-oracle] Starting commit phase for market <id>
[subjective-oracle] 📢 Notifying 3 verifiers for commit phase
[subjective-oracle] ✅ Commit phase started on-chain
```

**Verifiers commit** (via frontend or contract)

**After 24h** (or manually advance time for testing):
```
[subjective-oracle] Starting reveal phase for market <id>
[subjective-oracle] Collected 3 commitments
[subjective-oracle] ✅ Reveal phase started on-chain
```

**Verifiers reveal**, then after another 24h:
```
[subjective-oracle] Force resolving market <id>
[subjective-oracle] Collected 3 reveals
[subjective-oracle] Final outcome: YES
[subjective-oracle] ✅ Market resolved in DB
```

## Troubleshooting

### "No wallet configured" Error
- Make sure `PRIVATE_KEY` is set in `.env`
- Wallet must have BNB for gas on BSC Testnet
- Get testnet BNB from: https://testnet.bnbchain.org/faucet-smart

### "AI not configured" Warning
- Set either `ANTHROPIC_API_KEY` or `GOOGLE_API_KEY` in `.env`
- AI Oracle will fall back to heuristics if no API key

### "NewsAPI error" Warning
- Optional - AI Oracle works without it
- Get free API key from https://newsapi.org
- Free tier: 100 requests/day

### Prisma Errors
```bash
# Regenerate Prisma client
cd services
npm run prisma:generate

# Or from repo root
cd web-app
npx prisma generate --schema ../prisma/schema.prisma
```

### Port Already in Use (Market Syncer)
```bash
# Kill process on port 4001
lsof -ti:4001 | xargs kill -9

# Or change port in services/src/index.ts
const PORT = process.env.PORT || 4002;
```

## Monitoring

### Check Service Health

**Market Syncer**:
```bash
curl http://localhost:4001/health
curl http://localhost:4001/markets
```

**Check Database**:
```bash
cd web-app
npx prisma studio
```
- Opens UI at http://localhost:5555
- View markets, disputes, votes, etc.

### Watch Logs

**Filter by service**:
```bash
# AI Oracle only
npm run dev:ai | grep "\[ai-oracle\]"

# Dispute Bot only
npm run dev:dispute | grep "\[dispute-bot\]"
```

**Watch for errors**:
```bash
npm run dev:ai 2>&1 | grep -i error
```

## Production Deployment

### Environment Variables
- Set all API keys in production environment
- Use separate wallets for each service
- Fund wallets with sufficient BNB for gas

### Process Management
```bash
# Using PM2
npm install -g pm2

pm2 start "npm run dev:syncer" --name market-syncer
pm2 start "npm run dev:ai" --name ai-oracle
pm2 start "npm run dev:dispute" --name dispute-bot
pm2 start "npm run dev:subjective" --name subjective-oracle

pm2 logs  # View all logs
pm2 monit # Monitor resources
```

### Docker (Optional)
```dockerfile
# Dockerfile for services
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run prisma:generate
CMD ["npm", "run", "dev:syncer"]
```

## Next Steps

1. ✅ Services running
2. Test dispute flow end-to-end
3. Test subjective market flow
4. Add gasless UX (ERC-4337)
5. Deploy to production
6. Monitor and optimize

---

**Need Help?**
- Check logs for detailed error messages
- All services have extensive logging
- Each service runs independently - debug one at a time
