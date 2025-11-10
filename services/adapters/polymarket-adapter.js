import fetch from 'node-fetch';

/**
 * Polymarket API Adapter
 * Fetches markets from Polymarket's Gamma API
 */
export class PolymarketAdapter {
  constructor() {
    this.baseUrl = 'https://gamma-api.polymarket.com';
  }

  /**
   * Fetch active markets from Polymarket
   */
  async fetchMarkets() {
    try {
      const response = await fetch(`${this.baseUrl}/markets?limit=100&active=true`);
      
      if (!response.ok) {
        throw new Error(`Polymarket API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform to our format
      return data.map(market => ({
        marketplace: 'polymarket',
        externalId: market.id,
        question: market.question,
        category: market.category || 'general',
        price: Math.round(parseFloat(market.outcomePrices?.[0] || 0.5) * 10000), // Convert to basis points
        liquidity: parseFloat(market.liquidity || 0),
        resolutionTime: new Date(market.endDate),
        lastUpdate: new Date()
      }));
    } catch (error) {
      console.error('[PolymarketAdapter] Error fetching markets:', error.message);
      return [];
    }
  }

  /**
   * Fetch specific market by ID
   */
  async fetchMarket(marketId) {
    try {
      const response = await fetch(`${this.baseUrl}/markets/${marketId}`);
      
      if (!response.ok) {
        throw new Error(`Polymarket API error: ${response.statusText}`);
      }

      const market = await response.json();
      
      return {
        marketplace: 'polymarket',
        externalId: market.id,
        question: market.question,
        category: market.category || 'general',
        price: Math.round(parseFloat(market.outcomePrices?.[0] || 0.5) * 10000),
        liquidity: parseFloat(market.liquidity || 0),
        resolutionTime: new Date(market.endDate),
        lastUpdate: new Date()
      };
    } catch (error) {
      console.error(`[PolymarketAdapter] Error fetching market ${marketId}:`, error.message);
      return null;
    }
  }

  /**
   * Fetch price for a specific market
   */
  async fetchPrice(marketId) {
    const market = await this.fetchMarket(marketId);
    return market ? market.price : null;
  }
}
