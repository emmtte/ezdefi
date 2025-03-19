import { useState } from 'react';
import { YIELD_OPTIMIZER_ADDRESS, YIELD_OPTIMIZER_ABI } from '@/utils/constants'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

export const useAddVault = () => {
  const [newVaultAddress, setNewVaultAddress] = useState('');
  const { write: addVaultWrite, isSuccess: addVaultSuccess, isLoading: isAddingVault } = useWriteContract({
    address: YIELD_OPTIMIZER_ADDRESS,
    abi: YIELD_OPTIMIZER_ABI,
    functionName: 'addVault',
    args: [newVaultAddress],
    onSuccess: () => {
      console.error({
        title: 'Success',
        description: 'Vault added successfully!',
      });
      setNewVaultAddress('');
    },
    onError: (error) => {
      console.error({
        title: 'Error',
        description: `Error adding vault: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  return {
    newVaultAddress,
    setNewVaultAddress,
    addVaultWrite,
    isAddingVault,
  };
};
