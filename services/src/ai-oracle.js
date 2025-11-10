import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '../../web-app/.env.local' });

const prisma = new PrismaClient();

/**
 * AI Oracle Service
 * Monitors market resolutions and detects anomalies
 */
class AIOracleService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(
      process.env.BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.bnbchain.org:8545'
    );
    
    this.wallet = new ethers.Wallet(
      process.env.ORACLE_PRIVATE_KEY || process.env.PRIVATE_KEY,
      this.provider
    );

    // Load contract ABIs and addresses
    this.loadContracts();
    
    this.checkInterval = 60 * 1000; // Check every minute
  }

  /**
   * Load contract instances
   */
  loadContracts() {
    try {
      const deploymentPath = path.join(__dirname, '../../../contracts/deployments/bscTestnet.json');
      
      if (!fs.existsSync(deploymentPath)) {
        console.warn('[AIOracleService] ⚠️  No deployment file found. Please deploy contracts first.');
        return;
      }

      const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
      
      // Simple ABI for the functions we need
      const disputeABI = [
        'function suggestDispute(uint256 marketId, bytes32 evidenceHash, uint256 confidence) external',
        'function updateAIConfidence(uint256 disputeId, uint256 confidence) external',
        'event DisputeSubmitted(uint256 indexed disputeId, uint256 indexed marketId, address indexed submitter, bytes32 evidenceHash, uint256 proposedOutcome)'
      ];

      this.disputeContract = new ethers.Contract(
        deployment.contracts.AIOracleDispute,
        disputeABI,
        this.wallet
      );

      console.log('[AIOracleService] ✅ Contracts loaded');
    } catch (error) {
      console.error('[AIOracleService] Error loading contracts:', error.message);
    }
  }

  /**
   * Fetch evidence for a market from external sources
   */
  async fetchEvidence(question) {
    const evidence = {
      sources: [],
      confidence: 50 // Default neutral confidence
    };

    try {
      // Simplified evidence fetching (in production, use NewsAPI, Twitter API, etc.)
      // For now, we'll use a simple heuristic based on question keywords
      
      const keywords = question.toLowerCase();
      
      // Check for common patterns that might indicate manipulation
      if (keywords.includes('test') || keywords.includes('demo')) {
        evidence.confidence = 30; // Low confidence for test markets
        evidence.sources.push({
          type: 'heuristic',
          reason: 'Test/demo market detected'
        });
      }
      
      // In production, you would:
      // 1. Query NewsAPI for recent articles
      // 2. Check Twitter/X for sentiment
      // 3. Verify against known data sources
      // 4. Use ML model to analyze evidence
      
      return evidence;
    } catch (error) {
      console.error('[AIOracleService] Error fetching evidence:', error.message);
      return evidence;
    }
  }

  /**
   * Detect anomalies in market resolution
   */
  async detectAnomalies(market) {
    console.log(`[AIOracleService] Analyzing market ${market.id}: "${market.question}"`);

    const evidence = await this.fetchEvidence(market.question);
    
    // Calculate anomaly score
    let anomalyScore = 0;
    
    // Check 1: Unusual resolution time
    const timeSinceCreation = Date.now() - new Date(market.createdAt).getTime();
    if (timeSinceCreation < 60 * 60 * 1000) { // Less than 1 hour
      anomalyScore += 20;
      evidence.sources.push({
        type: 'timing',
        reason: 'Market resolved too quickly'
      });
    }

    // Check 2: Low volume
    if (parseFloat(market.totalVolume) < 0.01) {
      anomalyScore += 15;
      evidence.sources.push({
        type: 'volume',
        reason: 'Suspiciously low trading volume'
      });
    }

    // Check 3: Evidence confidence
    if (evidence.confidence < 50) {
      anomalyScore += evidence.confidence;
    }

    const shouldDispute = anomalyScore > 40;
    const confidence = 100 - anomalyScore;

    console.log(`[AIOracleService] Anomaly score: ${anomalyScore}, Confidence: ${confidence}%`);
    
    if (shouldDispute) {
      console.log(`[AIOracleService] 🚨 Anomaly detected! Suggesting dispute...`);
      await this.suggestDispute(market, evidence, confidence);
    } else {
      console.log(`[AIOracleService] ✅ Market appears legitimate`);
    }

    return {
      shouldDispute,
      anomalyScore,
      confidence,
      evidence
    };
  }

  /**
   * Suggest a dispute on-chain
   */
  async suggestDispute(market, evidence, confidence) {
    if (!this.disputeContract) {
      console.log('[AIOracleService] ⚠️  Dispute contract not loaded, skipping on-chain suggestion');
      return;
    }

    try {
      // Create evidence hash (in production, upload to IPFS)
      const evidenceData = JSON.stringify({
        marketId: market.id,
        question: market.question,
        sources: evidence.sources,
        timestamp: new Date().toISOString()
      });
      
      const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes(evidenceData));
      
      // Suggest dispute on-chain
      const tx = await this.disputeContract.suggestDispute(
        market.marketId,
        evidenceHash,
        confidence
      );
      
      await tx.wait();
      
      console.log(`[AIOracleService] ✅ Dispute suggestion submitted: ${tx.hash}`);
      
      // Store in database
      await prisma.dispute.create({
        data: {
          chainId: market.chainId,
          disputeId: 0, // Will be updated when dispute is actually submitted
          marketId: market.id,
          submitter: this.wallet.address,
          evidenceHash: evidenceHash,
          stake: 0,
          status: 'active',
          proposedOutcome: market.outcome || 0,
          aiConfidence: confidence
        }
      });
      
    } catch (error) {
      console.error('[AIOracleService] Error suggesting dispute:', error.message);
    }
  }

  /**
   * Monitor resolved markets
   */
  async monitorMarkets() {
    try {
      // Fetch recently resolved markets
      const resolvedMarkets = await prisma.market.findMany({
        where: {
          status: 'resolved',
          updatedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        take: 10
      });

      if (resolvedMarkets.length === 0) {
        console.log('[AIOracleService] No recently resolved markets to analyze');
        return;
      }

      console.log(`\n[AIOracleService] Analyzing ${resolvedMarkets.length} resolved markets...`);

      for (const market of resolvedMarkets) {
        await this.detectAnomalies(market);
      }

      console.log('[AIOracleService] Analysis complete\n');
    } catch (error) {
      console.error('[AIOracleService] Error monitoring markets:', error);
    }
  }

  /**
   * Start the monitoring service
   */
  start() {
    console.log('[AIOracleService] 🚀 Starting AI oracle service...');
    console.log(`[AIOracleService] Oracle address: ${this.wallet.address}`);
    console.log(`[AIOracleService] Check interval: ${this.checkInterval / 1000}s\n`);

    // Initial check
    this.monitorMarkets();

    // Schedule periodic checks
    setInterval(() => {
      this.monitorMarkets();
    }, this.checkInterval);
  }

  /**
   * Cleanup
   */
  async stop() {
    console.log('[AIOracleService] Stopping service...');
    await prisma.$disconnect();
  }
}

// Start the service
const oracle = new AIOracleService();
oracle.start();

// Graceful shutdown
process.on('SIGINT', async () => {
  await oracle.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await oracle.stop();
  process.exit(0);
});
