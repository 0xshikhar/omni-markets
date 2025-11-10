import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';

const DISPUTE_ADDRESS = process.env.NEXT_PUBLIC_DISPUTE_ADDRESS as `0x${string}`;

const DISPUTE_ABI = [
  {
    "inputs": [
      { "name": "marketId", "type": "uint256" },
      { "name": "evidenceHash", "type": "bytes32" },
      { "name": "proposedOutcome", "type": "uint256" }
    ],
    "name": "submitDispute",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "disputeId", "type": "uint256" },
      { "name": "support", "type": "bool" }
    ],
    "name": "voteOnDispute",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "disputeId", "type": "uint256" }],
    "name": "getDispute",
    "outputs": [{
      "components": [
        { "name": "id", "type": "uint256" },
        { "name": "marketId", "type": "uint256" },
        { "name": "submitter", "type": "address" },
        { "name": "evidenceHash", "type": "bytes32" },
        { "name": "stake", "type": "uint256" },
        { "name": "submittedAt", "type": "uint256" },
        { "name": "status", "type": "uint8" },
        { "name": "votesFor", "type": "uint256" },
        { "name": "votesAgainst", "type": "uint256" },
        { "name": "proposedOutcome", "type": "uint256" },
        { "name": "aiConfidence", "type": "uint256" }
      ],
      "name": "",
      "type": "tuple"
    }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export function useSubmitDispute() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const submitDispute = async (marketId: number, evidenceHash: string, proposedOutcome: number, stake: string) => {
    return writeContract({
      address: DISPUTE_ADDRESS,
      abi: DISPUTE_ABI,
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
      address: DISPUTE_ADDRESS,
      abi: DISPUTE_ABI,
      functionName: 'voteOnDispute',
      args: [BigInt(disputeId), support]
    });
  };

  return { voteOnDispute, isPending: isPending || isConfirming, isSuccess, error, hash };
}

export function useDispute(disputeId?: number) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: DISPUTE_ADDRESS,
    abi: DISPUTE_ABI,
    functionName: 'getDispute',
    args: disputeId !== undefined ? [BigInt(disputeId)] : undefined,
    query: { enabled: disputeId !== undefined }
  });

  return { dispute: data, isLoading, error, refetch };
}