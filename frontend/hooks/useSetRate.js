import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

export const useSetRate = ({ address, abi }) => {
  
  const [rate, setRate] = useState('');
  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  
  const handleDeposit = async (depositAmount) => {
      try {
        writeContract({
          address,
          abi,
          functionName: 'deposit',
          value: parseEther(depositAmount),
          account: account,
        });
      } catch (error) {
        console.error("Erreur lors du dépôt :", error);
        toast.error(`Erreur lors du dépôt : ${error.shortMessage || error.message}`);
      }
    };
  
    useEffect(() => {
      if (isConfirmed) {
        toast.success("Transaction successful.");
        refetch();
      }
    }, [isConfirmed, refetch]);


  return {
    setInterest,
    data,
    isLoading,
    isError,
    isSuccess,
  };
};
