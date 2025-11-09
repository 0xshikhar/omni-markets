import { PrismaClient } from '@prisma/client';
import { PolymarketAdapter } from './adapters/polymarket-adapter.js';
import dotenv from 'dotenv';

dotenv.config({ path: '../../web-app/.env.local' });

const prisma = new PrismaClient();

/**
 * Market Syncer Service
 * Fetches and normalizes market data from external sources
 */
class MarketSyncer {
  constructor() {
    this.adapters = {
      polymarket: new PolymarketAdapter()
    };
    this.syncInterval = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Sync markets from all adapters
   */
  async syncMarkets() {
    console.log('\n[MarketSyncer] Starting market sync...');
    const startTime = Date.now();

    try {
      // Fetch from Polymarket
      const polymarketMarkets = await this.adapters.polymarket.fetchMarkets();
      console.log(`[MarketSyncer] Fetched ${polymarketMarkets.length} markets from Polymarket`);

      // Upsert to database
      let upsertedCount = 0;
      for (const market of polymarketMarkets) {
        try {
          // First, find or create the parent market
          const parentMarket = await prisma.market.upsert({
            where: {
              chainId_contractAddress_marketId: {
                chainId: 97, // BSC Testnet
                contractAddress: process.env.NEXT_PUBLIC_MARKET_AGGREGATOR_ADDRESS || '0x0000000000000000000000000000000000000000',
                marketId: 0 // Will be updated when created on-chain
              }
            },
            update: {},
            create: {
              chainId: 97,
              contractAddress: process.env.NEXT_PUBLIC_MARKET_AGGREGATOR_ADDRESS || '0x0000000000000000000000000000000000000000',
              marketId: 0,
              question: market.question,
              category: market.category,
              marketType: 'public',
              status: 'active',
              resolutionTime: market.resolutionTime,
              totalVolume: 0,
              creator: '0x0000000000000000000000000000000000000000'
            }
          });

          // Then upsert the external market
          await prisma.externalMarket.upsert({
            where: {
              marketplace_externalId: {
                marketplace: market.marketplace,
                externalId: market.externalId
              }
            },
            update: {
              price: market.price,
              liquidity: market.liquidity,
              lastUpdate: market.lastUpdate
            },
            create: {
              marketId: parentMarket.id,
              marketplace: market.marketplace,
              externalId: market.externalId,
              price: market.price,
              liquidity: market.liquidity,
              lastUpdate: market.lastUpdate
            }
          });

          upsertedCount++;
        } catch (error) {
          console.error(`[MarketSyncer] Error upserting market ${market.externalId}:`, error.message);
        }
      }

      const duration = Date.now() - startTime;
      console.log(`[MarketSyncer] ✅ Synced ${upsertedCount} markets in ${duration}ms\n`);
    } catch (error) {
      console.error('[MarketSyncer] ❌ Sync failed:', error);
    }
  }

  /**
   * Start the sync loop
   */
  start() {
    console.log('[MarketSyncer] 🚀 Starting market syncer service...');
    console.log(`[MarketSyncer] Sync interval: ${this.syncInterval / 1000}s\n`);

    // Initial sync
    this.syncMarkets();

    // Schedule periodic syncs
    setInterval(() => {
      this.syncMarkets();
    }, this.syncInterval);
  }

  /**
   * Cleanup
   */
  async stop() {
    console.log('[MarketSyncer] Stopping service...');
    await prisma.$disconnect();
  }
}

// Start the service
const syncer = new MarketSyncer();
syncer.start();

// Graceful shutdown
process.on('SIGINT', async () => {
  await syncer.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await syncer.stop();
  process.exit(0);
});
