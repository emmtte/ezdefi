import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { toast } from 'sonner';
import { YIELD_OPTIMIZER_ADDRESS, YIELD_OPTIMIZER_ABI } from '@/utils/constants'

export const useRebalance = ( account, refetch) => {
  const [amount, setAmount] = useState('');
  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const handleRebalance = async (rebalanceAmount) => {
    try {
      writeContract({
        address: YIELD_OPTIMIZER_ADDRESS,
        abi: YIELD_OPTIMIZER_ABI,
        functionName: 'rebalance',
        account: account,
      });
    } catch (error) {
      console.error("Erreur lors du rééquilibrage :", error);
      toast(`Erreur lors du rééquilibrage : ${error.shortMessage || error.message}`);
    }
  };

  useEffect(() => {
    if (isConfirmed) {
      toast("Transaction successful.");
      setAmount('');
      refetch();
    }
  }, [isConfirmed, refetch]);

  return {
    amount,
    setAmount,
    handleRebalance,
    hash,
    error,
    isPending,
    isConfirming,
    isConfirmed,
  };
};
