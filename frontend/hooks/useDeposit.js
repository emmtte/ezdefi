import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { toast } from 'sonner';
import { YIELD_OPTIMIZER_ADDRESS, YIELD_OPTIMIZER_ABI } from '@/utils/constants'

export const useDeposit = (account) => {
  const [amount, setAmount] = useState('');
  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleDeposit = async (depositAmount) => {
    try {
      writeContract({
        address: YIELD_OPTIMIZER_ADDRESS,
        abi: YIELD_OPTIMIZER_ABI,
        functionName: 'deposit',
        args: [parseEther(depositAmount)],
        account: account,
      });
    } catch (error) {
      console.error("Erreur lors du dépôt :", error);
      toast.error(`Erreur lors du dépôt : ${error.shortMessage || error.message}`);
    }
  };

  return {
    amount,
    setAmount,
    handleDeposit,
    hash,
    error,
    isPending,
    isLoading,
    isSuccess,
  };
};