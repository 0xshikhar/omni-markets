import express from 'express';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PolymarketAdapter } from './adapters/polymarket-adapter.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// Load env from services/.env (if present) then fallback to web-app/.env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Prefer monorepo root .env, fallback to web-app/.env.local for legacy
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../web-app/.env.local') });
const prisma = new PrismaClient();
const app = express();
app.use(express.json());
const PORT = parseInt(process.env.SERVICES_PORT || '4001', 10);
const SYNC_INTERVAL_MS = parseInt(process.env.SYNC_INTERVAL_MS || String(5 * 60 * 1000), 10);
const CHAIN_ID = parseInt(process.env.CHAIN_ID || '97', 10);
const AGGREGATOR_ADDRESS = process.env.NEXT_PUBLIC_MARKET_AGGREGATOR_ADDRESS || '0x0000000000000000000000000000000000000000';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const adapters = {
    polymarket: new PolymarketAdapter(),
};
async function syncPolymarket(limit = 100) {
    // Use a single parent Market (marketId=0) to attach all external Polymarket rows
    const parent = await prisma.market.upsert({
        where: {
            chainId_contractAddress_marketId: {
                chainId: CHAIN_ID,
                contractAddress: AGGREGATOR_ADDRESS,
                marketId: 0,
            },
        },
        update: {},
        create: {
            chainId: CHAIN_ID,
            contractAddress: AGGREGATOR_ADDRESS,
            marketId: 0,
            question: 'External Aggregated Markets',
            category: 'general',
            marketType: 'public',
            status: 'active',
            resolutionTime: new Date(),
            totalVolume: '0',
            creator: ZERO_ADDRESS,
        },
    });
    const markets = await adapters.polymarket.fetchMarkets(limit);
    let upserted = 0;
    for (const m of markets) {
        try {
            await prisma.externalMarket.upsert({
                where: {
                    marketplace_externalId: {
                        marketplace: 'polymarket',
                        externalId: m.externalId,
                    },
                },
                update: {
                    price: m.price,
                    liquidity: String(m.liquidity),
                    lastUpdate: m.lastUpdate,
                    marketId: parent.id,
                },
                create: {
                    marketId: parent.id,
                    marketplace: 'polymarket',
                    externalId: m.externalId,
                    price: m.price,
                    liquidity: String(m.liquidity),
                    lastUpdate: m.lastUpdate,
                },
            });
            upserted += 1;
        }
        catch (err) {
            console.error(`[syncPolymarket] Failed for ${m.externalId}:`, err);
        }
    }
    return { upserted };
}
async function syncAll() {
    console.log('[services] Sync cycle start');
    const res = await syncPolymarket(100);
    console.log(`[services] Polymarket upserted: ${res.upserted}`);
    console.log('[services] Sync cycle done');
    return { polymarket: res.upserted };
}
// Routes
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});
app.get('/markets', async (req, res) => {
    try {
        const limit = Math.min(parseInt(String(req.query.limit || '50'), 10), 200);
        const category = req.query.category ? String(req.query.category) : undefined;
        const status = req.query.status ? String(req.query.status) : undefined;
        const markets = await prisma.market.findMany({
            where: {
                ...(category ? { category } : {}),
                ...(status ? { status } : {}),
            },
            include: { externalMarkets: true },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
        res.json(markets);
    }
    catch (err) {
        console.error('[GET /markets] Error:', err);
        res.status(500).json({ error: 'internal_error' });
    }
});
app.get('/markets/external', async (req, res) => {
    try {
        const limit = Math.min(parseInt(String(req.query.limit || '100'), 10), 500);
        const marketplace = String(req.query.marketplace || 'polymarket');
        const rows = await prisma.externalMarket.findMany({
            where: { marketplace },
            orderBy: { lastUpdate: 'desc' },
            take: limit,
        });
        res.json(rows);
    }
    catch (err) {
        console.error('[GET /markets/external] Error:', err);
        res.status(500).json({ error: 'internal_error' });
    }
});
app.post('/sync', async (_req, res) => {
    try {
        const out = await syncAll();
        res.json({ ok: true, ...out });
    }
    catch (err) {
        console.error('[POST /sync] Error:', err);
        res.status(500).json({ error: 'internal_error' });
    }
});
// Start server
app.listen(PORT, () => {
    console.log(`[services] 🚀 Market-syncer REST API listening on :${PORT}`);
    console.log(`[services] Using chainId=${CHAIN_ID}, aggregator=${AGGREGATOR_ADDRESS}`);
    // Kick off periodic sync
    void syncAll();
    setInterval(() => void syncAll(), SYNC_INTERVAL_MS);
});
