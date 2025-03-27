import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther } from 'viem';
import { toast } from 'sonner';
import { 
  YIELD_OPTIMIZER_ADDRESS, 
  YIELD_OPTIMIZER_ABI, 
  MINTABLE_USDC_ADDRESS, 
  MINTABLE_USDC_ABI 
} from '@/utils/constants';

export const useDeposit2 = (account, onSuccess) => {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState('idle');
  const [approveHash, setApproveHash] = useState(null);
  const [depositHash, setDepositHash] = useState(null);

  // Lecture de l'allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: MINTABLE_USDC_ADDRESS,
    abi: MINTABLE_USDC_ABI,
    functionName: 'allowance',
    args: [account, YIELD_OPTIMIZER_ADDRESS]
  });

  // Écriture pour l'approve
  const { 
    writeContract: writeApprove,
    error: approveError,
    isPending: isApprovePending
  } = useWriteContract();

  // Écriture pour le dépôt
  const { 
    writeContract: writeDeposit,
    error: depositError,
    isPending: isDepositPending
  } = useWriteContract();

  // Suivi des transactions
  const { isLoading: isApproveLoading } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: isDepositLoading, isSuccess } = useWaitForTransactionReceipt({ hash: depositHash });

  const handleDeposit = async (depositAmount) => {
    try {
      const amountWei = parseEther(depositAmount.toString());
      
      if (allowance < amountWei) {
        setStep('approving');
        writeApprove({
          address: MINTABLE_USDC_ADDRESS,
          abi: MINTABLE_USDC_ABI,
          functionName: 'approve',
          args: [YIELD_OPTIMIZER_ADDRESS, amountWei],
          account: account
        }, {
          onSuccess: (hash) => {
            setApproveHash(hash);
            toast("Autorisation en attente...");
          }
        });
      } else {
        executeDeposit(amountWei);
      }
    } catch (error) {
      toast(`Erreur: ${error.shortMessage || error.message}`);
    }
  };

  const executeDeposit = (amountWei) => {
    setStep('depositing');
    writeDeposit({
      address: YIELD_OPTIMIZER_ADDRESS,
      abi: YIELD_OPTIMIZER_ABI,
      functionName: 'deposit',
      args: [amountWei],
      account: account
    }, {
      onSuccess: (hash) => setDepositHash(hash)
    });
  };

  useEffect(() => {
    if (isSuccess) {
      setStep('idle');
      setAmount('');
      onSuccess?.();
      toast("Dépôt réussi!");
    }
  }, [isSuccess]);

  return {
    amount,
    setAmount,
    handleDeposit,
    hash: depositHash,
    error: depositError || approveError,
    isPending: isApprovePending || isDepositPending,
    isLoading: isApproveLoading || isDepositLoading,
    isSuccess,
    currentStep: step
  };
};
