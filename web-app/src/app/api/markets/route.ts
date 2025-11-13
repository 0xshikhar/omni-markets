import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { publicClient } from '@/lib/onchain';
import { ADDRESSES, MARKET_AGGREGATOR_ABI } from '@/contracts';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status') || 'active';
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Try database first, but don't fail if it errors
    let markets: any[] = [];
    try {
      markets = await prisma.market.findMany({
        where: {
          ...(category && { category }),
          status
        },
        include: {
          externalMarkets: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });
    } catch (dbErr) {
      console.warn('[API] DB unavailable, falling back to on-chain:', dbErr);
    }

    // On-chain fallback if DB has no markets
    if (!markets || markets.length === 0) {
      try {
        const count = await publicClient.readContract({
          address: ADDRESSES.MarketAggregator,
          abi: MARKET_AGGREGATOR_ABI,
          functionName: 'marketCount',
        }) as bigint;

        if (count > 0n) {
          const total = Number(count);
          const toFetch = Math.min(limit, total);
          const result: any[] = [];
          // Markets are 1-indexed: if count=1, valid IDs are [1]
          for (let i = 0; i < toFetch; i++) {
            const marketId = BigInt(total - i); // newest first: count=1 → ID=1
            let m: any | null = null;
            try {
              m = await publicClient.readContract({
                address: ADDRESSES.MarketAggregator,
                abi: MARKET_AGGREGATOR_ABI,
                functionName: 'getMarket',
                args: [marketId],
              }) as any;
              console.log(`[API] Read market ${marketId}:`, m);
            } catch (err) {
              console.error(`[API] Failed to read market ${marketId}:`, err);
              continue;
            }
            if (!m) continue;

            // Extract fields from struct tuple
            const mId = m[0] ?? m.id ?? marketId;
            const question = m[1] ?? m.question ?? '';
            const category = m[2] ?? m.category ?? 'General';
            const marketType = m[3] ?? m.marketType ?? 0;
            const statusNum = Number(m[4] ?? m.status ?? 0);
            const resTimeSec = Number(m[5] ?? m.resolutionTime ?? 0);
            const totalVolume = m[6] ?? m.totalVolume ?? 0;
            const creator = m[7] ?? m.creator ?? '0x0000000000000000000000000000000000000000';

            const statusStr = statusNum === 0 ? 'active' : statusNum === 1 ? 'resolved' : 'inactive';
            if (status && status !== statusStr) continue; // honor status filter

            result.push({
              id: `${mId}`,
              marketId: Number(mId),
              question: String(question),
              category: String(category),
              status: statusStr,
              resolutionTime: new Date(resTimeSec * 1000).toISOString(),
              totalVolume: Number(totalVolume),
              creator: String(creator),
              externalMarkets: [],
            });
          }

          return NextResponse.json(result);
          }
      } catch (e) {
        // ignore fallback errors, proceed to return empty
      }
    }

    return NextResponse.json(markets || []);
}