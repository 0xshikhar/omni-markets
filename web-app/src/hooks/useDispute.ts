import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { ADDRESSES, AI_ORACLE_DISPUTE_ABI } from '@/contracts';

export function useSubmitDispute() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const submitDispute = async (marketId: number, evidenceHash: string, proposedOutcome: number, stake: string) => {
    return writeContract({
      address: ADDRESSES.AIOracleDispute,
      abi: AI_ORACLE_DISPUTE_ABI,
      functionName: 'submitDispute',
      args: [BigInt(marketId), evidenceHash as `0x${string}`, BigInt(proposedOutcome)],
      value: parseEther(stake)
    });
  };

  return { submitDispute, isPending: isPending || isConfirming, isSuccess, error, hash };
}

export function useVoteOnDispute() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const voteOnDispute = async (disputeId: number, support: boolean) => {
    return writeContract({
      address: ADDRESSES.AIOracleDispute,
      abi: AI_ORACLE_DISPUTE_ABI,
      functionName: 'voteOnDispute',
      args: [BigInt(disputeId), support]
    });
  };

  return { voteOnDispute, isPending: isPending || isConfirming, isSuccess, error, hash };
}

export function useDispute(disputeId?: number) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: ADDRESSES.AIOracleDispute,
    abi: AI_ORACLE_DISPUTE_ABI,
    functionName: 'getDispute',
    args: disputeId !== undefined ? [BigInt(disputeId)] : undefined,
    query: { enabled: disputeId !== undefined }
  });

  return { dispute: data, isLoading, error, refetch };
}