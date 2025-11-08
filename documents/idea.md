TL;DR
OmniMarkets will be an aggregated prediction market protocol featuring:

Unified cross-platform order routing (PolyBet-style)
AI-protected Oracle/Dispute Layer (PredictLayer)
Private subjective prediction markets (zkKYC, NebulaID + MPC/AA -- will be implemented later)
End-to-end privacy and gasless UX on BNB (opBNB) & Oasis Sapphire 
1. App Structure
Monorepo Structure

/contracts         # Solidity for markets, oracles, privacy, MPC hooks
/frontend          # React/Next (web), React Native (mobile)
/services          # Oracle bots, AI, verifiers, bet router
/shared            # Common types, ABI, SDK
/scripts           # Automation, deployment, testing
/docs              # Documentation & technical specs (this file)
2. Core Features & Modules
2.1 Market Aggregator (PolyBet layer)
AggregatorEngine:

Fetches open markets from integrated protocols (Polymarket, Azuro, etc)
Normalizes pricing/liquidity
Function: aggregateMarkets()
OrderRouter:

Routes bet orders to best-priced markets
Handles liquidity-splitting and fallback paths
Function: routeOrder(betParams)
MarketAdapters:

One adapter per source protocol (PolymarketAdapter, AzuroAdapter, SubjectiveAdapter)
Standardizes API for bet, settle, resolve
Function: placeBet(), fetchLiquidity()
CrossChainManager:

Handles bridging and relaying orders between chains (BNB, Solana, etc)
Function: bridgeOrder(), getCrossChainStatus()
2.2 PredictLayer - AI Oracle + Dispute Protection
AIOracleMonitor:

Watches market resolutions
Uses NLP/AI agents to cross-verify event results vs public APIs/news
Function: detectAnomaly(marketId), suggestDispute(marketId)
DisputeBotNetwork:

Autonomous bots that auto-submit disputes based on OracleMonitor findings
Incentive module to reward honest actors
Function: submitDispute(), claimDisputeReward()
ZKVerificationModule:

Generates/verifies ZK proofs for AI oracle decisions (using Circom/Noir circuits)
Function: generateProof(input, modelOutput), verifyProof(proof)
2.3 SubjectiveMarkets - Private Markets Protocol
SubjectiveMarketFactory:

Lets users create private or semi-private markets (new event types, custom question flows)
Function: createMarket(type, params, verifierCircle)
ZKAttestationModule (NebulaID):

Handles zkKYC/identity proofs and private outcome attestations
Function: submitAttestation(marketId, proof), verifyAttestation(proof)
MPCVerifierCoordinator:

Coordinates outcome voting among verifier circles (using MPC or threshold crypto)
Function: collectVotes(marketId, verifiers), finalResult(marketId)
PrivateSettlementEngine:

Triggers payout based on MPC group outcome, maintains privacy for votes
Function: settleMarket(marketId, result)
2.4 Privacy & AA Infrastructure
PrivacyContracts:

On Oasis Sapphire—confidential trading, hidden balances, private bet settlement
Function: privateTransfer(), confidentialBet()
AccountAbstractionHandler:

Implements social login, gasless flows, sponsorship management
Function: onboardWithSocial(), sponsorTx(tx)
2.5 Frontend (Web & Mobile)
UnifiedDashboard:

Market discovery (public & private), user portfolio, dispute center
Components: MarketList, BetSlip, MyMarkets, Disputes
MarketCreationWizard:

Multistep flow to create public/private markets with verifier selection
AI Oracle Explorer:

UI for dispute history, AI-based market monitoring visualizations
MobileCore:

React Native module for placing/settling bets, push notifications for disputes
2.6 Services & Offchain Bots
OracleService:

Persistent job to fetch external event outcomes, trigger PredictLayer as soon as market approaches resolution
Function: fetchExternalOutcome(marketId)
MarketSyncer:

Indexes/refreshes active market data from all platforms for aggregator
Function: syncMarkets()
VerifierBot:

Pushes vote requests to verifiers for subjective markets
3. Key Function Names (Solidity/TS/Python)
aggregateMarkets()
routeOrder(betParams)
placeBet(marketId, betType, amount)
settleMarket(marketId, result)
detectAnomaly(marketId)
suggestDispute(marketId)
submitDispute(marketId, evidence)
claimDisputeReward(disputeId)
generateProof(input, output)
verifyProof(proof)
createMarket(type, params, verifiers)
submitAttestation(marketId, proof)
collectVotes(marketId, verifiers)
onboardWithSocial(email)
sponsorTx(txData)
fetchExternalOutcome(marketId)
syncMarkets()
4. Technologies/Frameworks
Smart Contracts: Solidity (BNB, Sapphire), Anchor (Solana)
ZK Circuits: Circom, Noir
AI Layer: Python + OpenAI/GPT/Claude + TLSNotary
MPC/Threshold: Typescript/Javascript (Lit Protocol, Threshold, NebulaID flows)
Frontend: Next.js, React Native, Wagmi
AA/Wallet: ERC-4337 SDK, Biconomy/Particle
Confidential Compute: Oasis Sapphire, TEE frameworks
5. MVP Feature Priorities
Market aggregator & order routing (PolyBet layer)
AI Oracle + Dispute flow (PredictLayer)
SubjectiveMarkets base (private event, verification circle)
Seamless frontend with both flows integrated
Privacy contract skeleton (expand post-hackathon)
6. Integration Notes
Use common ABI and types for all bet/order/settlement flows
All confidential/subjective flows routed via separate privacy-preserving contracts/services
Oracle bots and market syncer must be modular for easy extension
7. Stretch Goals
Arbitrage automation module
Cross-chain order batching (multi-market, multi-chain basket bets)
DeFi LP interface for pooled liquidity on subjective markets
Offchain AI explainability dashboard (explain why disputes were flagged)
