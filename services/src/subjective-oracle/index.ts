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

const rpcUrl =
  process.env.BSC_RPC_URL ||
  process.env.BSC_TESTNET_RPC_URL ||
  'https://data-seed-prebsc-1-s1.bnbchain.org:8545';
const provider = new ethers.JsonRpcProvider(rpcUrl);
const privateKey = process.env.ORACLE_PRIVATE_KEY || process.env.PRIVATE_KEY;
const wallet = privateKey ? new ethers.Wallet(privateKey, provider) : null;

const FACTORY_CONTRACT = process.env.NEXT_PUBLIC_SUBJECTIVE_FACTORY_ADDRESS || '0x6E83054913aA6C616257Dae2e87BC44F9260EDc6';

const factoryAbi = [
  'function getMarket(uint256 marketId) view returns (uint256 id, string question, address creator, address[] verifiers, uint256 threshold, uint256 resolutionTime, uint8 phase, uint256 outcome, uint256 revealCount, uint256 createdAt)',
  'function startCommitPhase(uint256 marketId) external',
  'function startRevealPhase(uint256 marketId) external',
  'function forceResolveMarket(uint256 marketId) external',
  'event CommitmentSubmitted(uint256 indexed marketId, address indexed verifier)',
  'event OutcomeRevealed(uint256 indexed marketId, address indexed verifier, uint256 outcome)',
  'event MarketResolved(uint256 indexed marketId, uint256 outcome)',
  'event PhaseChanged(uint256 indexed marketId, uint8 newPhase)',
];

const INTERVAL_MS = parseInt(process.env.SUBJECTIVE_ORACLE_INTERVAL_MS || String(60_000), 10);
const COMMIT_DURATION_HOURS = 24;
const REVEAL_DURATION_HOURS = 24;

// Notify verifiers (console logs for MVP, extensible to email/push)
async function notifyVerifiers(marketId: string, question: string, phase: 'commit' | 'reveal', verifiers: string[]) {
  console.log(`[subjective-oracle] 📢 Notifying ${verifiers.length} verifiers for ${phase} phase`);
  console.log(`[subjective-oracle] Market: ${question}`);
  console.log(`[subjective-oracle] Verifiers: ${verifiers.join(', ')}`);
  
  // For MVP: Just log. Later: Send emails via SendGrid, push via Firebase, webhooks
  // Store notifications for tracking (if Notification table exists)
  for (const verifier of verifiers) {
    console.log(`[subjective-oracle] → ${verifier}: Please ${phase === 'commit' ? 'commit your outcome' : 'reveal your outcome'}`);
  }
}

// Start commit phase
async function startCommitPhase(market: any) {
  if (!wallet || !FACTORY_CONTRACT) return;

  const contract = new ethers.Contract(FACTORY_CONTRACT, factoryAbi, wallet);

  try {
    console.log(`[subjective-oracle] Starting commit phase for market ${market.id}`);

    // Call contract to start commit phase
    const tx = await contract.startCommitPhase(market.marketId);
    await tx.wait();
    console.log(`[subjective-oracle] ✅ Commit phase started on-chain: ${tx.hash}`);

    // Get verifiers from contract
    const marketData = await contract.getMarket(market.marketId);
    const verifiers = marketData.verifiers;
    console.log(`[subjective-oracle] Found ${verifiers.length} verifiers`);

    // Notify verifiers
    await notifyVerifiers(market.id, market.question, 'commit', verifiers);

    // Update market state in DB
    await prisma.market.update({
      where: { id: market.id },
      data: { status: 'commit_phase' },
    });

    console.log(`[subjective-oracle] ✅ Market updated to commit_phase in DB`);
  } catch (error: any) {
    console.error(`[subjective-oracle] Error starting commit phase:`, error.message);
  }
}

// Collect commitments from events
async function collectCommitments(marketId: number, fromBlock: number) {
  if (!FACTORY_CONTRACT) return [];

  const contract = new ethers.Contract(FACTORY_CONTRACT, factoryAbi, provider);

  try {
    const filter = contract.filters.CommitmentSubmitted(marketId);
    const events = await contract.queryFilter(filter, fromBlock, 'latest');

    return events.map(event => {
      const eventLog = event as ethers.EventLog;
      return {
        verifier: eventLog.args.verifier,
        blockNumber: event.blockNumber,
      };
    });
  } catch (error) {
    console.error('[subjective-oracle] Error collecting commitments:', error);
    return [];
  }
}

// Start reveal phase
async function startRevealPhase(market: any) {
  if (!wallet || !FACTORY_CONTRACT) return;

  const contract = new ethers.Contract(FACTORY_CONTRACT, factoryAbi, wallet);

  try {
    console.log(`[subjective-oracle] Starting reveal phase for market ${market.id}`);

    // Collect commitments
    const commitments = await collectCommitments(market.marketId, 0);
    console.log(`[subjective-oracle] Collected ${commitments.length} commitments`);

    if (commitments.length === 0) {
      console.warn('[subjective-oracle] No commitments found, cannot proceed to reveal');
      return;
    }

    // Call contract to start reveal phase
    const tx = await contract.startRevealPhase(market.marketId);
    await tx.wait();
    console.log(`[subjective-oracle] ✅ Reveal phase started on-chain: ${tx.hash}`);

    const verifiers = commitments.map(c => c.verifier);

    // Notify verifiers to reveal
    await notifyVerifiers(market.id, market.question, 'reveal', verifiers);

    // Update market state in DB
    await prisma.market.update({
      where: { id: market.id },
      data: { status: 'reveal_phase' },
    });

    console.log(`[subjective-oracle] ✅ Market updated to reveal_phase in DB`);
  } catch (error: any) {
    console.error(`[subjective-oracle] Error starting reveal phase:`, error.message);
  }
}

// Collect reveals from events
async function collectReveals(marketId: number, fromBlock: number) {
  if (!FACTORY_CONTRACT) return [];

  const contract = new ethers.Contract(FACTORY_CONTRACT, factoryAbi, provider);

  try {
    const filter = contract.filters.OutcomeRevealed(marketId);
    const events = await contract.queryFilter(filter, fromBlock, 'latest');

    return events.map(event => {
      const eventLog = event as ethers.EventLog;
      return {
        verifier: eventLog.args.verifier,
        outcome: Number(eventLog.args.outcome),
        blockNumber: event.blockNumber,
      };
    });
  } catch (error) {
    console.error('[subjective-oracle] Error collecting reveals:', error);
    return [];
  }
}

// Force resolve market if threshold not met
async function forceResolveMarket(market: any) {
  if (!wallet || !FACTORY_CONTRACT) return;

  const contract = new ethers.Contract(FACTORY_CONTRACT, factoryAbi, wallet);

  try {
    console.log(`[subjective-oracle] Force resolving market ${market.id}`);

    // Collect reveals
    const reveals = await collectReveals(market.marketId, 0);
    console.log(`[subjective-oracle] Collected ${reveals.length} reveals`);

    if (reveals.length === 0) {
      console.warn('[subjective-oracle] No reveals found, market may be invalid');
    }

    // Call contract to force resolve
    const tx = await contract.forceResolveMarket(market.marketId);
    await tx.wait();
    console.log(`[subjective-oracle] ✅ Market resolved on-chain: ${tx.hash}`);

    // Get final outcome from contract
    const marketData = await contract.getMarket(market.marketId);
    const finalOutcome = Number(marketData.outcome);

    console.log(`[subjective-oracle] Final outcome: ${finalOutcome === 1 ? 'YES' : 'NO'}`);

    // Update DB
    await prisma.market.update({
      where: { id: market.id },
      data: {
        status: 'resolved',
        outcome: finalOutcome,
      },
    });

    console.log(`[subjective-oracle] ✅ Market resolved in DB`);
  } catch (error: any) {
    console.error(`[subjective-oracle] Error force resolving market:`, error.message);
  }
}

// Main processing loop
async function processMarkets() {
  const now = new Date();

  try {
    // Find markets ready for commit phase (resolution time passed, still active)
    const readyForCommit = await prisma.market.findMany({
      where: {
        marketType: 'subjective',
        status: 'active',
        resolutionTime: { lte: now },
      },
      take: 5,
    });

    for (const market of readyForCommit) {
      await startCommitPhase(market);
    }

    // Find markets ready for reveal phase (24h after entering commit_phase)
    const commitCutoff = new Date(now.getTime() - COMMIT_DURATION_HOURS * 60 * 60 * 1000);
    const readyForReveal = await prisma.market.findMany({
      where: {
        marketType: 'subjective',
        status: 'commit_phase',
        updatedAt: { lte: commitCutoff },
      },
      take: 5,
    });

    for (const market of readyForReveal) {
      await startRevealPhase(market);
    }

    // Find markets ready for resolution (24h after entering reveal_phase)
    const revealCutoff = new Date(now.getTime() - REVEAL_DURATION_HOURS * 60 * 60 * 1000);
    const readyForResolution = await prisma.market.findMany({
      where: {
        marketType: 'subjective',
        status: 'reveal_phase',
        updatedAt: { lte: revealCutoff },
      },
      take: 5,
    });

    for (const market of readyForResolution) {
      await forceResolveMarket(market);
    }
  } catch (error) {
    console.error('[subjective-oracle] Error in processing loop:', error);
  }
}

async function start() {
  console.log('[subjective-oracle] 🔮 Starting subjective oracle...');
  console.log(`[subjective-oracle] Wallet: ${wallet?.address || 'NOT CONFIGURED'}`);
  console.log(`[subjective-oracle] Contract: ${FACTORY_CONTRACT}`);
  console.log(`[subjective-oracle] Commit duration: ${COMMIT_DURATION_HOURS}h`);
  console.log(`[subjective-oracle] Reveal duration: ${REVEAL_DURATION_HOURS}h`);
  console.log(`[subjective-oracle] Poll interval: ${INTERVAL_MS / 1000}s\n`);

  await processMarkets();
  setInterval(() => void processMarkets(), INTERVAL_MS);
}

start().catch((e) => {
  console.error('[subjective-oracle] fatal:', e);
  process.exit(1);
});
