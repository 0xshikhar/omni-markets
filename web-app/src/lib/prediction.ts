// EVM Prediction Market contract helpers
// Address is provided via env: NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS
// ABI is a minimal interface expected by the UI. Replace with your real ABI when available.

export const predictionMarketAddress = (process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`;

// Minimal ABI for demo wiring. Update to real contract ABI.
export const predictionMarketABI = [
  {
    type: "function",
    name: "createMarket",
    stateMutability: "nonpayable",
    inputs: [
      { name: "question", type: "string" },
      { name: "closeTime", type: "uint256" },
      { name: "minStakeWei", type: "uint256" },
      { name: "creatorFeeBps", type: "uint16" }
    ],
    outputs: [{ name: "marketId", type: "uint256" }]
  },
  {
    type: "function",
    name: "placePrediction",
    stateMutability: "payable",
    inputs: [
      { name: "marketId", type: "uint256" },
      { name: "isYes", type: "bool" },
      { name: "amountWei", type: "uint256" }
    ],
    outputs: []
  }
] as const;

export const predictionFns = {
  createMarket: "createMarket" as const,
  placePrediction: "placePrediction" as const,
};
