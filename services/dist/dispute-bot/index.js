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
const rpcUrl = process.env.BSC_RPC_URL ||
    process.env.BSC_TESTNET_RPC_URL ||
    'https://data-seed-prebsc-1-s1.bnbchain.org:8545';
const provider = new ethers.JsonRpcProvider(rpcUrl);
const privateKey = process.env.DISPUTE_BOT_PRIVATE_KEY || process.env.PRIVATE_KEY;
const wallet = privateKey ? new ethers.Wallet(privateKey, provider) : null;
const DISPUTE_CONTRACT = process.env.DISPUTE_CONTRACT_ADDRESS || '';
// Minimal ABI fragments (adjust to actual deployed contract)
const disputeAbi = [
    'function submitDispute(uint256 marketId, bytes32 evidenceHash, uint256 proposedOutcome) external payable returns (uint256)',
    'function claimReward(uint256 disputeId) external',
    'function getDispute(uint256 disputeId) view returns (tuple(uint256 id, uint256 marketId, address submitter, bytes32 evidenceHash, uint256 stake, uint8 status))',
];
const STAKE_WEI = ethers.parseEther(process.env.DISPUTE_STAKE_ETH || '0.1');
const MAX_CONCURRENT = parseInt(process.env.DISPUTE_MAX_CONCURRENT || '5', 10);
const INTERVAL_MS = parseInt(process.env.DISPUTE_POLL_INTERVAL_MS || String(60_000), 10);
async function submitDisputes() {
    if (!wallet || !DISPUTE_CONTRACT) {
        console.warn('[dispute-bot] wallet or contract missing; skipping on-chain submit');
        return;
    }
    const contract = new ethers.Contract(DISPUTE_CONTRACT, disputeAbi, wallet);
    // Pick up to N active AI-suggested disputes (aiConfidence low or placeholder)
    const toSubmit = await prisma.dispute.findMany({
        where: { status: 'active', disputeId: 0 },
        orderBy: { submittedAt: 'asc' },
        take: MAX_CONCURRENT,
    });
    for (const d of toSubmit) {
        try {
            const m = await prisma.market.findUnique({ where: { id: d.marketId } });
            if (!m)
                continue;
            const tx = await contract.submitDispute(m.marketId, d.evidenceHash, d.proposedOutcome, { value: STAKE_WEI });
            const rcpt = await tx.wait();
            console.log('[dispute-bot] submitted tx', rcpt?.hash);
            // Optionally, query emitted disputeId or set a temporary value (still 0 without events parsing)
            await prisma.dispute.update({
                where: { id: d.id },
                data: { stake: String(ethers.formatEther(STAKE_WEI)) },
            });
        }
        catch (e) {
            console.error('[dispute-bot] submit failed:', e);
        }
    }
}
async function claimResolvedRewards() {
    if (!wallet || !DISPUTE_CONTRACT)
        return;
    const contract = new ethers.Contract(DISPUTE_CONTRACT, disputeAbi, wallet);
    // Naive scan: resolved disputes in DB
    const resolved = await prisma.dispute.findMany({ where: { status: 'resolved' }, take: 20 });
    for (const d of resolved) {
        try {
            await contract.claimReward(Number(d.disputeId));
            console.log('[dispute-bot] claimed for dispute', d.disputeId);
        }
        catch (e) {
            console.error('[dispute-bot] claim failed:', e);
        }
    }
}
async function loop() {
    await submitDisputes();
    await claimResolvedRewards();
}
async function start() {
    console.log('[dispute-bot] starting...');
    await loop();
    setInterval(() => void loop(), INTERVAL_MS);
}
start().catch((e) => {
    console.error('[dispute-bot] fatal:', e);
    process.exit(1);
});
