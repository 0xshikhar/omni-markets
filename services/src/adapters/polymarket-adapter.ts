import { Polymarket } from 'polymarket-data';

export type NormalizedExternalMarket = {
  marketplace: 'polymarket';
  externalId: string;
  question: string;
  category: string;
  price: number; // basis points (0-10000)
  liquidity: number; // numeric representation; will be converted to Decimal
  resolutionTime: Date;
  lastUpdate: Date;
};

export class PolymarketAdapter {
  private client: Polymarket;

  constructor() {
    this.client = new Polymarket();
  }

  // Fetch active markets with basic liquidity filter
  async fetchMarkets(limit = 100): Promise<NormalizedExternalMarket[]> {
    try {
      const markets = await this.client.gamma.markets.listMarkets({
        closed: false,
        liquidity_num_min: 100,
        limit,
      });

      return markets.map((m: any) => ({
        marketplace: 'polymarket',
        externalId: String(m.id),
        question: String(m.question ?? ''),
        category: String(m.category ?? 'general'),
        price: Math.round(((m.outcomePrices?.[0] ?? 0.5) as number) * 10000),
        liquidity: parseFloat(String(m.liquidity ?? '0')),
        resolutionTime: new Date(m.endDate),
        lastUpdate: new Date(),
      }));
    } catch (err) {
      console.error('[PolymarketAdapter] Error fetching markets:', err);
      return [];
    }
  }

  async fetchMarket(marketId: string): Promise<NormalizedExternalMarket | null> {
    try {
      // SDK may not expose direct get-by-id; fallback to list & filter
      const markets = await this.client.gamma.markets.listMarkets({ limit: 1000 });
      const m = markets.find((x: any) => String(x.id) === String(marketId));
      if (!m) return null;
      return {
        marketplace: 'polymarket',
        externalId: String(m.id),
        question: String(m.question ?? ''),
        category: String(m.category ?? 'general'),
        price: Math.round(((m.outcomePrices?.[0] ?? 0.5) as number) * 10000),
        liquidity: parseFloat(String(m.liquidity ?? '0')),
        resolutionTime: new Date(m.endDate ?? 0),
        lastUpdate: new Date(),
      };
    } catch (err) {
      console.error(`[PolymarketAdapter] Error fetching market ${marketId}:`, err);
      return null;
    }
  }
}
