import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { toast } from 'sonner';
import { MINTABLE_USDC_ABI } from '@/utils/constants'

export const useApprove = (tokenAddress, spenderAddress) => {
  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleApprove = async (amount) => {
    try {
      writeContract({
        address: tokenAddress,
        abi: MINTABLE_USDC_ABI,
        functionName: 'approve',
        args: [spenderAddress, parseEther(amount)],
      });
    } catch (error) {
      console.error("Erreur lors de l'approbation :", error);
      toast(`Erreur lors de l'approbation : ${error.shortMessage || error.message}`);
    }
  };

  return {
    handleApprove,
    hash,
    error,
    isPending,
    isLoading,
    isSuccess,
  };
};