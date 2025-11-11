import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { ADDRESSES, MARKET_AGGREGATOR_ABI } from '@/contracts';

export function useCreateMarket() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createMarket = async (question: string, category: string, resolutionTime: number) => {
    return writeContract({
      address: ADDRESSES.MarketAggregator,
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
      address: ADDRESSES.MarketAggregator,
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
      address: ADDRESSES.MarketAggregator,
      abi: MARKET_AGGREGATOR_ABI,
      functionName: 'claimWinnings',
      args: [BigInt(betSlipId)]
    });
  };

  return { claimWinnings, isPending: isPending || isConfirming, isSuccess, error, hash };
}

export function useUserBetSlips(address?: `0x${string}`) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: ADDRESSES.MarketAggregator,
    abi: MARKET_AGGREGATOR_ABI,
    functionName: 'getUserBetSlips',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  return { betSlipIds: data as bigint[] | undefined, isLoading, error, refetch };
}