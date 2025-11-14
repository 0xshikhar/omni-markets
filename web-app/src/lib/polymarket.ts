import { Polymarket } from 'polymarket-data';

/**
 * Polymarket client singleton
 * Uses the community-maintained SDK for fetching market data
 */
export const polymarketClient = new Polymarket();

/**
 * Fetch active markets from Polymarket
 */
export async function fetchPolymarketMarkets(limit = 100) {
  try {
    const markets = await polymarketClient.gamma.markets.listMarkets({
      closed: false,
      liquidity_num_min: 100,
      limit,
    });

    return markets.map(market => ({
      marketplace: 'polymarket',
      externalId: market.id,
      question: market.question,
      category: market.category || 'general',
      // Convert price to basis points (0-10000)
      price: Math.round(((market.outcomePrices as number[] | undefined)?.[0] || 0.5 ) * 10000),
      liquidity: parseFloat(market.liquidity || '0'),
      resolutionTime: new Date(market.endDate || Date.now() + 24 * 60 * 60 * 1000),
      lastUpdate: new Date(),
    }));
  } catch (error) {
    console.error('[Polymarket] Error fetching markets:', error);
    return [];
  }
}

/**
 * Fetch specific market by ID
 */
export async function fetchPolymarketMarket(marketId: string) {
  try {
    // Note: The SDK might need a getMarketById method
    // For now, we'll fetch from list and filter
    const markets = await polymarketClient.gamma.markets.listMarkets({
      limit: 1000,
    });

    const market = markets.find(m => m.id === marketId);
    if (!market) return null;

    return {
      marketplace: 'polymarket',
      externalId: market.id,
      question: market.question,
      category: market.category || 'general',
      price: Math.round(((market.outcomePrices as number[] | undefined)?.[0] || 0.5) * 10000),
      liquidity: parseFloat(market.liquidity || '0'),
      resolutionTime: new Date(market.endDate || Date.now() + 24 * 60 * 60 * 1000),
      lastUpdate: new Date(),
    };
  } catch (error) {
    console.error(`[Polymarket] Error fetching market ${marketId}:`, error);
    return null;
  }
}
