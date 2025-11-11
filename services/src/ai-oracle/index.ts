import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Env: prefer monorepo root, fallback to web-app
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../web-app/.env.local') });

const prisma = new PrismaClient();

// Basic provider (BSC testnet by default)
const rpcUrl =
  process.env.BSC_RPC_URL ||
  process.env.BSC_TESTNET_RPC_URL ||
  'https://data-seed-prebsc-1-s1.bnbchain.org:8545';
const provider = new ethers.JsonRpcProvider(rpcUrl);

const CHECK_INTERVAL_MS = parseInt(process.env.AI_CHECK_INTERVAL_MS || String(60_000), 10);

async function fetchEvidence(question: string) {
  // TODO: Integrate NewsAPI, Twitter/X, web scraping, IPFS pinning
  const lower = question.toLowerCase();
  const evidence = { sources: [] as { type: string; reason: string }[], confidence: 60 };
  if (lower.includes('test') || lower.includes('demo')) {
    evidence.confidence = 40;
    evidence.sources.push({ type: 'heuristic', reason: 'Test/demo keyword detected' });
  }
  return evidence;
}

type MinimalMarket = {
  id: string;
  chainId: number;
  question: string;
  createdAt: Date;
  totalVolume: any;
  outcome: number | null;
};

async function detectAnomalies(market: MinimalMarket) {
  const evidence = await fetchEvidence(market.question);

  // Simple scoring example
  let anomaly = 0;
  const hoursSinceCreation = (Date.now() - new Date(market.createdAt).getTime()) / 3_600_000;
  if (hoursSinceCreation < 1) anomaly += 20;
  if (Number(market.totalVolume) < 0.01) anomaly += 15;
  if (evidence.confidence < 50) anomaly += 20;

  const shouldDispute = anomaly > 40;
  const aiConfidence = Math.max(0, Math.min(100, 100 - anomaly));

  return { shouldDispute, aiConfidence, evidence };
}

async function analyzeResolvedMarkets() {
  // Pull recently resolved markets
  const resolved = await prisma.market.findMany({
    where: {
      status: 'resolved',
      updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    take: 20,
  });

  for (const m of resolved) {
    const { shouldDispute, aiConfidence, evidence } = await detectAnomalies(m);
    if (!shouldDispute) continue;

    // Record a suggested dispute entry (submitter may be the oracle wallet later)
    await prisma.dispute.create({
      data: {
        chainId: m.chainId,
        disputeId: 0, // placeholder until on-chain tx
        marketId: m.id,
        submitter: process.env.ORACLE_ADDRESS || '0x0000000000000000000000000000000000000000',
        evidenceHash: ethers.keccak256(
          ethers.toUtf8Bytes(
            JSON.stringify({ question: m.question, sources: evidence.sources, t: Date.now() })
          )
        ),
        stake: '0',
        status: 'active',
        proposedOutcome: m.outcome ?? 0,
        aiConfidence,
      },
    });
  }
}

async function start() {
  console.log('[ai-oracle] starting...');
  console.log(`[ai-oracle] rpc=${rpcUrl}`);

  await analyzeResolvedMarkets();
  setInterval(() => void analyzeResolvedMarkets(), CHECK_INTERVAL_MS);
}

// Entrypoint
start().catch((e) => {
  console.error('[ai-oracle] fatal:', e);
  process.exit(1);
});
