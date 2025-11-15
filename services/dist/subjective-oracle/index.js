import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../web-app/.env.local') });
const prisma = new PrismaClient();
const rpcUrl = process.env.BSC_RPC_URL ||
    process.env.BSC_TESTNET_RPC_URL ||
    'https://data-seed-prebsc-1-s1.bnbchain.org:8545';
const provider = new ethers.JsonRpcProvider(rpcUrl);
const INTERVAL_MS = parseInt(process.env.SUBJECTIVE_ORACLE_INTERVAL_MS || String(60_000), 10);
// Skeleton flow:
// 1) At/after resolutionTime, notify verifiers for commit phase
// 2) Track commitments off-chain (or on-chain if contract ready)
// 3) Transition to reveal phase and collect reveals
// 4) Compute threshold, submit to chain via factory contract
async function processMarkets() {
    const now = new Date();
    const candidates = await prisma.market.findMany({
        where: {
            marketType: 'subjective',
            status: 'active',
            resolutionTime: { lte: now },
        },
        take: 20,
    });
    for (const m of candidates) {
        // TODO: integrate with SubjectiveMarketFactory, commitments/reveals, threshold logic
        console.log('[subjective-oracle] ready for commit/reveal workflow:', m.id, m.question);
    }
}
async function start() {
    console.log('[subjective-oracle] starting...');
    await processMarkets();
    setInterval(() => void processMarkets(), INTERVAL_MS);
}
start().catch((e) => {
    console.error('[subjective-oracle] fatal:', e);
    process.exit(1);
});
