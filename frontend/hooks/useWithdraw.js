import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { toast } from 'sonner';
import { YIELD_OPTIMIZER_ADDRESS, YIELD_OPTIMIZER_ABI } from '@/utils/constants'

export const useWithdraw = (account) => {
  const [amount, setAmount] = useState('');
  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleWithdraw = async (withdrawAmount) => {
    try {
      writeContract({
        address: YIELD_OPTIMIZER_ADDRESS,
        abi: YIELD_OPTIMIZER_ABI,
        functionName: 'withdraw',
        args: [parseEther(withdrawAmount)],
        account: account,
      });
    } catch (error) {
      console.error("Erreur lors du retrait :", error);
      toast.error(`Erreur lors du retrait : ${error.shortMessage || error.message}`);
    }
  };

  return {
    amount,
    setAmount,
    handleWithdraw,
    hash,
    error,
    isPending,
    isLoading,
    isSuccess,
  };
};