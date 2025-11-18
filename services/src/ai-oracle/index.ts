import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Env: prefer monorepo root, fallback to web-app
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../web-app/.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../../web-app/.env') });

const prisma = new PrismaClient();

// Basic provider (BSC testnet by default)
const rpcUrl =
  process.env.BSC_RPC_URL ||
  process.env.BSC_TESTNET_RPC_URL ||
  'https://data-seed-prebsc-1-s1.bnbchain.org:8545';
const provider = new ethers.JsonRpcProvider(rpcUrl);
const privateKey = process.env.ORACLE_PRIVATE_KEY || process.env.PRIVATE_KEY;
const wallet = privateKey ? new ethers.Wallet(privateKey, provider) : null;

const CHECK_INTERVAL_MS = parseInt(process.env.AI_CHECK_INTERVAL_MS || String(60_000), 10);

// AI Provider selection
const AI_PROVIDER = process.env.AI_PROVIDER || 'google'; // 'openai' or 'google'

// Fetch evidence from NewsAPI
async function fetchNewsEvidence(question: string) {
  if (!process.env.NEWS_API_KEY) {
    console.warn('[ai-oracle] NewsAPI key not configured');
    return [];
  }

  try {
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(question)}&apiKey=${process.env.NEWS_API_KEY}&pageSize=5&sortBy=relevancy&language=en`
    );
    const data = await response.json();

    if (data.status !== 'ok') {
      console.warn('[ai-oracle] NewsAPI error:', data.message);
      return [];
    }

    return data.articles?.map((article: any) => ({
      source: 'NewsAPI',
      title: article.title,
      content: article.description || article.content?.substring(0, 200),
      url: article.url,
      publishedAt: article.publishedAt,
    })) || [];
  } catch (error) {
    console.error('[ai-oracle] NewsAPI error:', error);
    return [];
  }
}

// Fetch evidence from Wikipedia
async function fetchWikipediaEvidence(question: string) {
  try {
    const searchQuery = question.split(' ').slice(0, 5).join(' ');
    const response = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&format=json&origin=*`
    );
    const data = await response.json();

    return data.query?.search?.slice(0, 3).map((result: any) => ({
      source: 'Wikipedia',
      title: result.title,
      content: result.snippet.replace(/<[^>]*>/g, ''),
      url: `https://en.wikipedia.org/?curid=${result.pageid}`,
    })) || [];
  } catch (error) {
    console.error('[ai-oracle] Wikipedia error:', error);
    return [];
  }
}

// Fetch all evidence
async function fetchEvidence(question: string) {
  console.log(`[ai-oracle] Fetching evidence for: "${question}"`);
  
  const [news, wiki] = await Promise.all([
    fetchNewsEvidence(question),
    fetchWikipediaEvidence(question),
  ]);

  const allEvidence = [...news, ...wiki];
  console.log(`[ai-oracle] Fetched ${allEvidence.length} pieces of evidence (${news.length} news, ${wiki.length} wiki)`);
  
  return allEvidence;
}

type MinimalMarket = {
  id: string;
  chainId: number;
  marketId: number;
  question: string;
  createdAt: Date;
  totalVolume: any;
  outcome: number | null;
};

// Analyze evidence with AI
async function analyzeWithAI(question: string, outcome: number, evidence: any[]) {
  if (!process.env.OPENAI_API_KEY && !process.env.GOOGLE_API_KEY) {
    console.warn('[ai-oracle] No AI API keys configured, using heuristics');
    return { confidence: 50, reasoning: 'AI not configured', verdict: 'UNCLEAR' };
  }

  const evidenceText = evidence
    .map(e => `[${e.source}] ${e.title || ''}\n${e.content}`)
    .join('\n\n');

  const prompt = `You are verifying a prediction market outcome.

Market Question: "${question}"
Proposed Outcome: ${outcome === 1 ? 'YES' : 'NO'}

Evidence:
${evidenceText || 'No external evidence available'}

Task: Analyze if the proposed outcome is correct based on the evidence.

Respond in JSON format:
{
  "confidence": <0-100>,
  "reasoning": "<brief explanation>",
  "verdict": "CORRECT" | "INCORRECT" | "UNCLEAR"
}

Confidence scale:
- 90-100: Strong evidence supports outcome
- 70-89: Moderate evidence supports outcome
- 50-69: Weak evidence or conflicting signals
- 30-49: Evidence suggests opposite outcome
- 0-29: Strong evidence contradicts outcome`;

  try {
    const model = AI_PROVIDER === 'google' 
      ? google('gemini-1.5-flash')
      : openai('gpt-4o-mini');

    const { text } = await generateText({
      model,
      prompt,
      temperature: 0.3,
    });

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('[ai-oracle] Could not parse AI response as JSON');
      return { confidence: 50, reasoning: 'Failed to parse AI response', verdict: 'UNCLEAR' };
    }

    const result = JSON.parse(jsonMatch[0]);
    return {
      confidence: result.confidence || 50,
      reasoning: result.reasoning || 'No reasoning provided',
      verdict: result.verdict || 'UNCLEAR',
    };
  } catch (error: any) {
    console.error('[ai-oracle] AI analysis error:', error.message);
    return { confidence: 50, reasoning: 'AI analysis failed', verdict: 'UNCLEAR' };
  }
}

async function detectAnomalies(market: MinimalMarket) {
  console.log(`[ai-oracle] Analyzing market ${market.id}: "${market.question}"`);

  // Fetch evidence
  const evidence = await fetchEvidence(market.question);

  // Analyze with AI if evidence available
  let aiAnalysis = { confidence: 50, reasoning: 'No analysis', verdict: 'UNCLEAR' };
  
  if (evidence.length > 0) {
    aiAnalysis = await analyzeWithAI(market.question, market.outcome || 0, evidence);
    console.log(`[ai-oracle] AI confidence: ${aiAnalysis.confidence}%`);
    console.log(`[ai-oracle] AI reasoning: ${aiAnalysis.reasoning}`);
  } else {
    console.log('[ai-oracle] No evidence found, using heuristics only');
  }

  // Combine AI analysis with heuristic checks
  let anomalyScore = 0;

  // Check 1: AI confidence (low confidence = potential anomaly)
  if (aiAnalysis.confidence < 50) {
    anomalyScore += (50 - aiAnalysis.confidence);
  }

  // Check 2: Timing (resolved too quickly)
  const hoursSinceCreation = (Date.now() - new Date(market.createdAt).getTime()) / 3_600_000;
  if (hoursSinceCreation < 1) {
    anomalyScore += 20;
    console.log('[ai-oracle] ⚠️ Market resolved very quickly (<1h)');
  }

  // Check 3: Volume (suspiciously low)
  if (Number(market.totalVolume) < 0.01) {
    anomalyScore += 15;
    console.log('[ai-oracle] ⚠️ Very low volume');
  }

  // Check 4: Verdict mismatch
  if (aiAnalysis.verdict === 'INCORRECT') {
    anomalyScore += 30;
    console.log('[ai-oracle] ⚠️ AI verdict: INCORRECT');
  }

  const shouldDispute = anomalyScore > 40;
  const finalConfidence = Math.max(0, Math.min(100, 100 - anomalyScore));

  console.log(`[ai-oracle] Anomaly score: ${anomalyScore}, Final confidence: ${finalConfidence}%, Should dispute: ${shouldDispute}`);

  return { 
    shouldDispute, 
    aiConfidence: finalConfidence, 
    evidence,
    reasoning: aiAnalysis.reasoning,
    verdict: aiAnalysis.verdict,
  };
}

async function analyzeResolvedMarkets() {
  // Pull recently resolved markets (last 24 hours)
  const resolved = await prisma.market.findMany({
    where: {
      status: 'resolved',
      updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    take: 5, // Limit to avoid rate limits
  });

  if (resolved.length === 0) {
    console.log('[ai-oracle] No recently resolved markets to analyze');
    return;
  }

  console.log(`[ai-oracle] Analyzing ${resolved.length} recently resolved markets...`);

  for (const m of resolved) {
    try {
      // Check if we already created a dispute for this market
      const existingDispute = await prisma.dispute.findFirst({
        where: {
          marketId: m.id,
          submitter: wallet?.address.toLowerCase() || 'oracle',
        },
      });

      if (existingDispute) {
        console.log(`[ai-oracle] Dispute already exists for market ${m.id}, skipping`);
        continue;
      }

      const { shouldDispute, aiConfidence, evidence, reasoning, verdict } = await detectAnomalies(m);
      
      if (!shouldDispute) {
        console.log(`[ai-oracle] ✅ Market ${m.id} appears legitimate (confidence: ${aiConfidence}%)`);
        continue;
      }

      console.log(`[ai-oracle] 🚨 Anomaly detected in market ${m.id}`);
      console.log(`[ai-oracle] Creating dispute suggestion...`);

      // Create evidence package
      const evidenceData = {
        marketId: m.id,
        question: m.question,
        proposedOutcome: m.outcome,
        aiConfidence,
        reasoning,
        verdict,
        evidence: evidence.map(e => ({
          source: e.source,
          title: e.title,
          content: e.content,
          url: e.url,
        })),
        timestamp: new Date().toISOString(),
      };

      const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(evidenceData)));

      // Record a suggested dispute entry for dispute-bot to pick up
      await prisma.dispute.create({
        data: {
          chainId: m.chainId,
          disputeId: 0, // Will be set when submitted on-chain by dispute-bot
          marketId: m.id,
          submitter: wallet?.address.toLowerCase() || process.env.ORACLE_ADDRESS || '0x0000000000000000000000000000000000000000',
          evidenceHash,
          stake: '0',
          status: 'active',
          proposedOutcome: m.outcome === 1 ? 0 : 1, // Dispute the current outcome
          aiConfidence,
        },
      });

      console.log(`[ai-oracle] ✅ Dispute suggestion created for market ${m.id}`);
      console.log(`[ai-oracle] Evidence hash: ${evidenceHash}`);

      // Rate limiting to avoid API abuse
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error: any) {
      console.error(`[ai-oracle] Error analyzing market ${m.id}:`, error.message);
    }
  }
}

async function start() {
  console.log('[ai-oracle] 🤖 Starting AI-powered oracle...');
  console.log(`[ai-oracle] RPC: ${rpcUrl}`);
  console.log(`[ai-oracle] AI Provider: ${AI_PROVIDER}`);
  console.log(`[ai-oracle] Oracle wallet: ${wallet?.address || 'NOT CONFIGURED'}`);
  console.log(`[ai-oracle] NewsAPI: ${process.env.NEWS_API_KEY ? 'Configured' : 'Not configured'}`);
  console.log(`[ai-oracle] Check interval: ${CHECK_INTERVAL_MS / 1000}s\n`);

  await analyzeResolvedMarkets();
  setInterval(() => void analyzeResolvedMarkets(), CHECK_INTERVAL_MS);
}

// Entrypoint
start().catch((e) => {
  console.error('[ai-oracle] fatal:', e);
  process.exit(1);
});
