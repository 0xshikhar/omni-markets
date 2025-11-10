-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),
    "username" TEXT,
    "avatar" TEXT,
    "bio" TEXT,
    "NFTid" TEXT,
    "aaWallet" TEXT,
    "nonce" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Market" (
    "id" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "marketId" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "marketType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "resolutionTime" TIMESTAMP(3) NOT NULL,
    "totalVolume" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "creator" TEXT NOT NULL,
    "outcome" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Market_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalMarket" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "marketplace" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "liquidity" DECIMAL(20,8) NOT NULL,
    "lastUpdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalMarket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BetSlip" (
    "id" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "betSlipId" INTEGER NOT NULL,
    "user" TEXT NOT NULL,
    "totalAmount" DECIMAL(20,8) NOT NULL,
    "expectedPayout" DECIMAL(20,8),
    "actualPayout" DECIMAL(20,8),
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BetSlip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BetSlipMarket" (
    "id" TEXT NOT NULL,
    "betSlipId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "amount" DECIMAL(20,8) NOT NULL,
    "outcome" INTEGER NOT NULL,

    CONSTRAINT "BetSlipMarket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "disputeId" INTEGER NOT NULL,
    "marketId" TEXT NOT NULL,
    "submitter" TEXT NOT NULL,
    "evidenceHash" TEXT NOT NULL,
    "stake" DECIMAL(20,8) NOT NULL,
    "status" TEXT NOT NULL,
    "votesFor" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "votesAgainst" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "proposedOutcome" INTEGER NOT NULL,
    "aiConfidence" INTEGER,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "voter" TEXT NOT NULL,
    "support" BOOLEAN NOT NULL,
    "weight" DECIMAL(20,8) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_walletAddress_idx" ON "User"("walletAddress");

-- CreateIndex
CREATE INDEX "Market_status_category_idx" ON "Market"("status", "category");

-- CreateIndex
CREATE INDEX "Market_creator_idx" ON "Market"("creator");

-- CreateIndex
CREATE UNIQUE INDEX "Market_chainId_contractAddress_marketId_key" ON "Market"("chainId", "contractAddress", "marketId");

-- CreateIndex
CREATE INDEX "ExternalMarket_marketId_idx" ON "ExternalMarket"("marketId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalMarket_marketplace_externalId_key" ON "ExternalMarket"("marketplace", "externalId");

-- CreateIndex
CREATE INDEX "BetSlip_user_status_idx" ON "BetSlip"("user", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BetSlip_chainId_betSlipId_key" ON "BetSlip"("chainId", "betSlipId");

-- CreateIndex
CREATE INDEX "BetSlipMarket_betSlipId_idx" ON "BetSlipMarket"("betSlipId");

-- CreateIndex
CREATE INDEX "BetSlipMarket_marketId_idx" ON "BetSlipMarket"("marketId");

-- CreateIndex
CREATE UNIQUE INDEX "BetSlipMarket_betSlipId_marketId_key" ON "BetSlipMarket"("betSlipId", "marketId");

-- CreateIndex
CREATE INDEX "Dispute_status_marketId_idx" ON "Dispute"("status", "marketId");

-- CreateIndex
CREATE INDEX "Dispute_submitter_idx" ON "Dispute"("submitter");

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_chainId_disputeId_key" ON "Dispute"("chainId", "disputeId");

-- CreateIndex
CREATE INDEX "Vote_disputeId_idx" ON "Vote"("disputeId");

-- CreateIndex
CREATE INDEX "Vote_voter_idx" ON "Vote"("voter");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_disputeId_voter_key" ON "Vote"("disputeId", "voter");

-- AddForeignKey
ALTER TABLE "Market" ADD CONSTRAINT "Market_creator_fkey" FOREIGN KEY ("creator") REFERENCES "User"("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalMarket" ADD CONSTRAINT "ExternalMarket_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetSlip" ADD CONSTRAINT "BetSlip_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetSlipMarket" ADD CONSTRAINT "BetSlipMarket_betSlipId_fkey" FOREIGN KEY ("betSlipId") REFERENCES "BetSlip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetSlipMarket" ADD CONSTRAINT "BetSlipMarket_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_submitter_fkey" FOREIGN KEY ("submitter") REFERENCES "User"("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_voter_fkey" FOREIGN KEY ("voter") REFERENCES "User"("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE;
