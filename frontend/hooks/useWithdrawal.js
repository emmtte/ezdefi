import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { toast } from 'sonner';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/utils/constants'

const useWithdrawal = ( account, refetch) => {
  const [amount, setAmount] = useState('');
  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const handleWithdraw = async (withdrawalAmount) => {
    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'withdraw',
        args: [parseEther(withdrawalAmount)],
        account: account,
      });
    } catch (error) {
      console.error("Erreur lors du retrait :", error);
      toast.error(`Erreur lors du retrait : ${error.shortMessage || error.message}`);
    }
  };

  useEffect(() => {
    if (isConfirmed) {
      toast.success("Transaction successful.");
      setAmount('');
      refetch();
    }
  }, [isConfirmed, refetch]);

  return {
    amount,
    setAmount,
    handleWithdraw,
    hash,
    error,
    isPending,
    isConfirming,
    isConfirmed,
  };
};

export default useWithdrawal;