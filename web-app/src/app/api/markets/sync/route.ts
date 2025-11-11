import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { fetchPolymarketMarkets } from '@/lib/polymarket';
import { ADDRESSES, CHAIN_ID } from '@/contracts';

const prisma = new PrismaClient();

export async function POST() {
  try {
    const markets = await fetchPolymarketMarkets(100);
    const contractAddress = ADDRESSES.MarketAggregator;

    let synced = 0;
    for (const market of markets) {
      const parentMarket = await prisma.market.upsert({
        where: {
          chainId_contractAddress_marketId: {
            chainId: CHAIN_ID,
            contractAddress,
            marketId: 0
          }
        },
        update: {},
        create: {
          chainId: CHAIN_ID,
          contractAddress,
          marketId: 0,
          question: String(market.question || ''),
          category: String(market.category || 'General'),
          marketType: 'public',
          status: 'active',
          resolutionTime: new Date((Number(market.resolutionTime || 0)) * 1000),
          totalVolume: 0,
          creator: '0x0000000000000000000000000000000000000000'
        }
      });

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

      synced++;
    }

    return NextResponse.json({ success: true, synced });
  } catch (error) {
    console.error('[API] Market sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}