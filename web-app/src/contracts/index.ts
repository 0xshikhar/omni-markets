
import deployment from "@/deployments/bscTestnet.json";
import { AI_ORACLE_DISPUTE } from "./abi/AIOracleDispute";
import { MARKET_AGGREGATOR } from "./abi/MarketAggregator";
import { SUBJECTIVE_MARKET_FACTORY } from "./abi/SubjectiveMarketFactory";

export const CHAIN_ID = deployment.chainId as 97;

export const ADDRESSES = {
  MarketAggregator: deployment.contracts.MarketAggregator as `0x${string}`,
  AIOracleDispute: deployment.contracts.AIOracleDispute as `0x${string}`,
  SubjectiveMarketFactory: deployment.contracts.SubjectiveMarketFactory as `0x${string}`,
} as const;

export const ROLES = {
  ORACLE_ROLE: deployment.roles.ORACLE_ROLE as `0x${string}`,
  ROUTER_ROLE: deployment.roles.ROUTER_ROLE as `0x${string}`,
  AI_ORACLE_ROLE: deployment.roles.AI_ORACLE_ROLE as `0x${string}`,
} as const;


export const AI_ORACLE_DISPUTE_ABI = AI_ORACLE_DISPUTE;
export const MARKET_AGGREGATOR_ABI = MARKET_AGGREGATOR;
export const SUBJECTIVE_MARKET_FACTORY_ABI = SUBJECTIVE_MARKET_FACTORY;