import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';

const MARKET_AGGREGATOR_ADDRESS = process.env.NEXT_PUBLIC_MARKET_AGGREGATOR_ADDRESS as `0x${string}`;

const MARKET_AGGREGATOR_ABI = [
  {
    "inputs": [
      { "name": "question", "type": "string" },
      { "name": "category", "type": "string" },
      { "name": "marketType", "type": "uint8" },
      { "name": "resolutionTime", "type": "uint256" }
    ],
    "name": "createMarket",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "marketIds", "type": "uint256[]" },
      { "name": "amounts", "type": "uint256[]" },
      { "name": "outcomes", "type": "uint256[]" }
    ],
    "name": "createBetSlip",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "betSlipId", "type": "uint256" }],
    "name": "claimWinnings",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "user", "type": "address" }],
    "name": "getUserBetSlips",
    "outputs": [{ "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export function useCreateMarket() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createMarket = async (question: string, category: string, resolutionTime: number) => {
    return writeContract({
      address: MARKET_AGGREGATOR_ADDRESS,
      abi: MARKET_AGGREGATOR_ABI,
      functionName: 'createMarket',
      args: [question, category, 0, BigInt(resolutionTime)]
    });
  };

  return { createMarket, isPending: isPending || isConfirming, isSuccess, error, hash };
}

export function useCreateBetSlip() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createBetSlip = async (marketIds: number[], amounts: string[], outcomes: number[]) => {
    const totalAmount = amounts.reduce((sum, amt) => sum + parseEther(amt), 0n);

    return writeContract({
      address: MARKET_AGGREGATOR_ADDRESS,
      abi: MARKET_AGGREGATOR_ABI,
      functionName: 'createBetSlip',
      args: [
        marketIds.map(id => BigInt(id)),
        amounts.map(amt => parseEther(amt)),
        outcomes.map(o => BigInt(o))
      ],
      value: totalAmount
    });
  };

  return { createBetSlip, isPending: isPending || isConfirming, isSuccess, error, hash };
}

export function useClaimWinnings() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimWinnings = async (betSlipId: number) => {
    return writeContract({
      address: MARKET_AGGREGATOR_ADDRESS,
      abi: MARKET_AGGREGATOR_ABI,
      functionName: 'claimWinnings',
      args: [BigInt(betSlipId)]
    });
  };

  return { claimWinnings, isPending: isPending || isConfirming, isSuccess, error, hash };
}

export function useUserBetSlips(address?: `0x${string}`) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: MARKET_AGGREGATOR_ADDRESS,
    abi: MARKET_AGGREGATOR_ABI,
    functionName: 'getUserBetSlips',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  return { betSlipIds: data as bigint[] | undefined, isLoading, error, refetch };
}