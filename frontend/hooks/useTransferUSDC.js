'use client';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { MINTABLE_USDC_ADDRESS, MINTABLE_USDC_ABI } from '@/utils/constants'

export const useTransferUSDC = () => {
  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleTransfer = async (recipient, amount) => {
    if (!recipient || !amount) {
      console.error("Adresse du destinataire ou montant manquant");
      return;
    }

    try {
      const parsedAmount = parseUnits(amount.toString(), 18);
      
      writeContract({
        address: MINTABLE_USDC_ADDRESS,
        abi: MINTABLE_USDC_ABI,
        functionName: 'transfer',
        args: [recipient, parsedAmount],
      });
    } catch (error) {
      console.error("Erreur lors du transfert USDC :", error);
    }
  };

  return {
    handleTransfer,
    isPending,
    hash,
    isLoading,
    isSuccess,
    error
  };
};

export default useTransferUSDC;