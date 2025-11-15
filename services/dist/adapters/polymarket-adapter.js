import { Polymarket } from 'polymarket-data';
export class PolymarketAdapter {
    client;
    constructor() {
        this.client = new Polymarket();
    }
    // Fetch active markets with basic liquidity filter
    async fetchMarkets(limit = 100) {
        try {
            const markets = await this.client.gamma.markets.listMarkets({
                closed: false,
                liquidity_num_min: 100,
                limit,
            });
            return markets.map((m) => ({
                marketplace: 'polymarket',
                externalId: String(m.id),
                question: String(m.question ?? ''),
                category: String(m.category ?? 'general'),
                price: Math.round((m.outcomePrices?.[0] ?? 0.5) * 10000),
                liquidity: parseFloat(String(m.liquidity ?? '0')),
                resolutionTime: new Date(m.endDate),
                lastUpdate: new Date(),
            }));
        }
        catch (err) {
            console.error('[PolymarketAdapter] Error fetching markets:', err);
            return [];
        }
    }
    async fetchMarket(marketId) {
        try {
            // SDK may not expose direct get-by-id; fallback to list & filter
            const markets = await this.client.gamma.markets.listMarkets({ limit: 1000 });
            const m = markets.find((x) => String(x.id) === String(marketId));
            if (!m)
                return null;
            return {
                marketplace: 'polymarket',
                externalId: String(m.id),
                question: String(m.question ?? ''),
                category: String(m.category ?? 'general'),
                price: Math.round((m.outcomePrices?.[0] ?? 0.5) * 10000),
                liquidity: parseFloat(String(m.liquidity ?? '0')),
                resolutionTime: new Date(m.endDate ?? 0),
                lastUpdate: new Date(),
            };
        }
        catch (err) {
            console.error(`[PolymarketAdapter] Error fetching market ${marketId}:`, err);
            return null;
        }
    }
}
