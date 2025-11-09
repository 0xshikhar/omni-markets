const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying OmniMarkets contracts to", hre.network.name, "\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy MarketAggregator
  console.log("📦 Deploying MarketAggregator...");
  const MarketAggregator = await ethers.getContractFactory("MarketAggregator");
  const aggregator = await MarketAggregator.deploy(deployer.address); // fee recipient
  await aggregator.waitForDeployment();
  const aggregatorAddress = await aggregator.getAddress();
  console.log("✅ MarketAggregator deployed to:", aggregatorAddress);

  // Deploy AIOracleDispute
  console.log("\n📦 Deploying AIOracleDispute...");
  const AIOracleDispute = await ethers.getContractFactory("AIOracleDispute");
  const dispute = await AIOracleDispute.deploy();
  await dispute.waitForDeployment();
  const disputeAddress = await dispute.getAddress();
  console.log("✅ AIOracleDispute deployed to:", disputeAddress);

  // Deploy SubjectiveMarketFactory
  console.log("\n📦 Deploying SubjectiveMarketFactory...");
  const SubjectiveMarketFactory = await ethers.getContractFactory("SubjectiveMarketFactory");
  const subjective = await SubjectiveMarketFactory.deploy();
  await subjective.waitForDeployment();
  const subjectiveAddress = await subjective.getAddress();
  console.log("✅ SubjectiveMarketFactory deployed to:", subjectiveAddress);

  // Setup roles
  console.log("\n🔐 Setting up roles...");
  
  // Grant ORACLE_ROLE to AIOracleDispute on MarketAggregator
  const ORACLE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ORACLE_ROLE"));
  const ROUTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ROUTER_ROLE"));
  const AI_ORACLE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("AI_ORACLE_ROLE"));
  
  await aggregator.grantRole(ORACLE_ROLE, disputeAddress);
  console.log("✅ Granted ORACLE_ROLE to AIOracleDispute");
  
  await aggregator.grantRole(ROUTER_ROLE, deployer.address);
  console.log("✅ Granted ROUTER_ROLE to deployer (for testing)");
  
  await dispute.grantRole(AI_ORACLE_ROLE, deployer.address);
  console.log("✅ Granted AI_ORACLE_ROLE to deployer (for testing)");

  // Save deployment info
  const deployment = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: deployer.address,
    contracts: {
      MarketAggregator: aggregatorAddress,
      AIOracleDispute: disputeAddress,
      SubjectiveMarketFactory: subjectiveAddress
    },
    roles: {
      ORACLE_ROLE: ORACLE_ROLE,
      ROUTER_ROLE: ROUTER_ROLE,
      AI_ORACLE_ROLE: AI_ORACLE_ROLE
    },
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber()
  };

  // Save to deployments directory
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentPath = path.join(deploymentsDir, `${hre.network.name}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log("\n📄 Deployment info saved to:", deploymentPath);

  // Also save to web-app for frontend
  const webAppDeploymentsDir = path.join(__dirname, "../../web-app/src/deployments");
  if (!fs.existsSync(webAppDeploymentsDir)) {
    fs.mkdirSync(webAppDeploymentsDir, { recursive: true });
  }

  const webAppDeploymentPath = path.join(webAppDeploymentsDir, `${hre.network.name}.json`);
  fs.writeFileSync(webAppDeploymentPath, JSON.stringify(deployment, null, 2));
  console.log("📄 Deployment info copied to web-app:", webAppDeploymentPath);

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log(JSON.stringify(deployment, null, 2));
  console.log("=".repeat(60));

  // Verification instructions
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n🔍 To verify contracts on BscScan, run:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${aggregatorAddress} "${deployer.address}"`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${disputeAddress}`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${subjectiveAddress}`);
  }

  console.log("\n✨ Deployment complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
