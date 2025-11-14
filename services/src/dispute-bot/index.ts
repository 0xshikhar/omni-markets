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

const rpcUrl =
  process.env.BSC_RPC_URL ||
  process.env.BSC_TESTNET_RPC_URL ||
  'https://data-seed-prebsc-1-s1.bnbchain.org:8545';
const provider = new ethers.JsonRpcProvider(rpcUrl);
const privateKey = process.env.DISPUTE_BOT_PRIVATE_KEY || process.env.PRIVATE_KEY;
const wallet = privateKey ? new ethers.Wallet(privateKey, provider) : null;

const DISPUTE_CONTRACT = process.env.NEXT_PUBLIC_DISPUTE_ADDRESS || '0x52EbCBf8c967Fcb4b83644626822881ADaA9bffF';

// Complete ABI for AIOracleDispute contract
const disputeAbi = [
  'function submitDispute(uint256 marketId, bytes32 evidenceHash, uint256 proposedOutcome) external payable returns (uint256)',
  'function claimReward(uint256 disputeId) external',
  'function getDispute(uint256 disputeId) view returns (tuple(uint256 id, uint256 marketId, address submitter, bytes32 evidenceHash, uint256 stake, uint256 submittedAt, uint8 status, uint256 votesFor, uint256 votesAgainst, uint256 proposedOutcome, uint256 aiConfidence))',
  'event DisputeSubmitted(uint256 indexed disputeId, uint256 indexed marketId, address indexed submitter, bytes32 evidenceHash, uint256 proposedOutcome)',
  'event DisputeResolved(uint256 indexed disputeId, bool accepted, uint256 outcome)',
  'event RewardClaimed(uint256 indexed disputeId, address indexed claimer, uint256 amount)',
];

const STAKE_WEI = ethers.parseEther(process.env.DISPUTE_STAKE_ETH || '0.1');
const MAX_CONCURRENT = parseInt(process.env.DISPUTE_MAX_CONCURRENT || '5', 10);
const INTERVAL_MS = parseInt(process.env.DISPUTE_POLL_INTERVAL_MS || String(60_000), 10);

// Track last processed block to avoid reprocessing events
let lastProcessedBlock = 0;

// Parse DisputeSubmitted events to capture disputeId
interface DisputeEvent {
  disputeId: bigint;
  marketId: bigint;
  submitter: string;
  evidenceHash: string;
  proposedOutcome: bigint;
  blockNumber: number;
  txHash: string;
}

async function parseDisputeEvents(contract: ethers.Contract, fromBlock: number): Promise<DisputeEvent[]> {
  try {
    const filter = contract.filters.DisputeSubmitted();
    const events = await contract.queryFilter(filter, fromBlock, 'latest');
    
    return events.map(event => {
      const eventLog = event as ethers.EventLog;
      return {
        disputeId: eventLog.args.disputeId,
        marketId: eventLog.args.marketId,
        submitter: eventLog.args.submitter,
        evidenceHash: eventLog.args.evidenceHash,
        proposedOutcome: eventLog.args.proposedOutcome,
        blockNumber: event.blockNumber,
        txHash: event.transactionHash,
      };
    });
  } catch (error) {
    console.error('[dispute-bot] Error parsing events:', error);
    return [];
  }
}

// Check if dispute already submitted for this market (idempotency)
async function isDisputeAlreadySubmitted(marketId: string, submitter: string): Promise<boolean> {
  const existing = await prisma.dispute.findFirst({
    where: {
      marketId,
      submitter: submitter.toLowerCase(),
      status: { in: ['active', 'resolved'] },
      disputeId: { gt: 0 }, // Already on-chain
    },
  });
  return !!existing;
}

async function submitDisputes() {
  if (!wallet || !DISPUTE_CONTRACT) {
    console.warn('[dispute-bot] wallet or contract missing; skipping on-chain submit');
    return;
  }

  const contract = new ethers.Contract(DISPUTE_CONTRACT, disputeAbi, wallet);

  // Pick up to N active AI-suggested disputes (aiConfidence low, not yet on-chain)
  const toSubmit = await prisma.dispute.findMany({
    where: { 
      status: 'active', 
      disputeId: 0, // Not yet submitted on-chain
      aiConfidence: { lt: 50 }, // Low confidence = anomaly detected
    },
    include: { market: true },
    orderBy: { submittedAt: 'asc' },
    take: MAX_CONCURRENT,
  });

  if (toSubmit.length === 0) {
    console.log('[dispute-bot] No pending disputes to submit');
    return;
  }

  console.log(`[dispute-bot] Found ${toSubmit.length} disputes to submit`);

  for (const d of toSubmit) {
    try {
      // Idempotency check
      if (await isDisputeAlreadySubmitted(d.marketId, wallet.address)) {
        console.log(`[dispute-bot] Dispute already exists for market ${d.marketId}, removing duplicate`);
        await prisma.dispute.delete({ where: { id: d.id } });
        continue;
      }

      if (!d.market) {
        console.warn(`[dispute-bot] Market not found for dispute ${d.id}`);
        continue;
      }

      console.log(`[dispute-bot] Submitting dispute for market ${d.market.marketId}...`);

      const tx = await contract.submitDispute(
        d.market.marketId, 
        d.evidenceHash, 
        d.proposedOutcome, 
        { value: STAKE_WEI }
      );

      console.log(`[dispute-bot] Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`[dispute-bot] Transaction confirmed in block ${receipt.blockNumber}`);

      // Parse event to get disputeId
      const events = await parseDisputeEvents(contract, receipt.blockNumber);
      const submittedEvent = events.find(e => e.txHash === receipt.hash);

      if (submittedEvent) {
        // Update DB with on-chain disputeId
        await prisma.dispute.update({
          where: { id: d.id },
          data: {
            disputeId: Number(submittedEvent.disputeId),
            stake: ethers.formatEther(STAKE_WEI),
            chainId: 97, // BSC Testnet
          },
        });
        console.log(`[dispute-bot] ✅ Dispute submitted with ID: ${submittedEvent.disputeId}`);
      } else {
        console.warn('[dispute-bot] Could not find DisputeSubmitted event in receipt');
      }

      // Rate limiting to avoid spamming
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (e: any) {
      console.error(`[dispute-bot] Failed to submit dispute for market ${d.marketId}:`, e.message);
    }
  }
}

async function claimResolvedRewards() {
  if (!wallet || !DISPUTE_CONTRACT) return;
  const contract = new ethers.Contract(DISPUTE_CONTRACT, disputeAbi, wallet);

  // Find resolved disputes where we were the submitter
  const resolved = await prisma.dispute.findMany({ 
    where: { 
      status: 'resolved',
      submitter: wallet.address.toLowerCase(),
      disputeId: { gt: 0 }, // Must be on-chain
    }, 
    take: 20 
  });

  if (resolved.length === 0) {
    console.log('[dispute-bot] No resolved disputes to claim');
    return;
  }

  console.log(`[dispute-bot] Checking ${resolved.length} resolved disputes for rewards...`);

  for (const d of resolved) {
    try {
      // Check on-chain status first
      const disputeInfo = await contract.getDispute(d.disputeId);
      
      // Status: 0=Active, 1=Resolved, 2=Rejected, 3=Expired
      if (disputeInfo.status !== 1) {
        console.log(`[dispute-bot] Dispute ${d.disputeId} status is ${disputeInfo.status}, skipping`);
        continue;
      }

      console.log(`[dispute-bot] Claiming reward for dispute ${d.disputeId}...`);
      
      const tx = await contract.claimReward(d.disputeId);
      await tx.wait();
      
      console.log(`[dispute-bot] ✅ Claimed reward for dispute ${d.disputeId}`);

      // Update DB to mark as claimed
      await prisma.dispute.update({
        where: { id: d.id },
        data: { status: 'claimed' },
      });

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (e: any) {
      // If error is "already claimed", that's fine
      if (e.message?.includes('already claimed') || e.message?.includes('AlreadyClaimed')) {
        console.log(`[dispute-bot] Reward already claimed for dispute ${d.disputeId}`);
        await prisma.dispute.update({
          where: { id: d.id },
          data: { status: 'claimed' },
        });
      } else {
        console.error(`[dispute-bot] Failed to claim reward for dispute ${d.disputeId}:`, e.message);
      }
    }
  }
}

// Sync on-chain dispute states with DB
async function syncDisputeStates() {
  if (!wallet || !DISPUTE_CONTRACT) return;

  const contract = new ethers.Contract(DISPUTE_CONTRACT, disputeAbi, provider);

  // Get current block
  const currentBlock = await provider.getBlockNumber();

  // Parse new events since last check
  const events = await parseDisputeEvents(contract, lastProcessedBlock + 1);
  
  if (events.length > 0) {
    console.log(`[dispute-bot] Found ${events.length} new dispute events`);
    
    for (const event of events) {
      // Update DB if we have this dispute
      const dispute = await prisma.dispute.findFirst({
        where: {
          marketId: { contains: event.marketId.toString() },
          submitter: event.submitter.toLowerCase(),
        },
      });

      if (dispute && dispute.disputeId === 0) {
        await prisma.dispute.update({
          where: { id: dispute.id },
          data: { disputeId: Number(event.disputeId) },
        });
        console.log(`[dispute-bot] Synced disputeId ${event.disputeId} to DB`);
      }
    }
  }

  lastProcessedBlock = currentBlock;
}

async function loop() {
  try {
    console.log('[dispute-bot] === Starting cycle ===');
    await syncDisputeStates();
    await submitDisputes();
    await claimResolvedRewards();
    console.log('[dispute-bot] === Cycle complete ===\n');
  } catch (error) {
    console.error('[dispute-bot] Cycle error:', error);
  }
}

async function start() {
  console.log('[dispute-bot] 🤖 Starting automated dispute bot...');
  console.log(`[dispute-bot] Wallet: ${wallet?.address || 'NOT CONFIGURED'}`);
  console.log(`[dispute-bot] Contract: ${DISPUTE_CONTRACT}`);
  console.log(`[dispute-bot] Stake per dispute: ${ethers.formatEther(STAKE_WEI)} BNB`);
  console.log(`[dispute-bot] Poll interval: ${INTERVAL_MS / 1000}s\n`);

  if (!wallet) {
    console.error('[dispute-bot] ❌ No wallet configured. Set DISPUTE_BOT_PRIVATE_KEY or PRIVATE_KEY');
    process.exit(1);
  }

  // Get starting block
  lastProcessedBlock = await provider.getBlockNumber();
  console.log(`[dispute-bot] Starting from block ${lastProcessedBlock}\n`);

  await loop();
  setInterval(() => void loop(), INTERVAL_MS);
}

start().catch((e) => {
  console.error('[dispute-bot] fatal:', e);
  process.exit(1);
});
