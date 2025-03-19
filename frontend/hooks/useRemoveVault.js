// hooks/useRemoveVault.js
import { useState } from 'react';
import { useWriteContract } from 'wagmi';
import { YIELD_OPTIMIZER_ADDRESS, YIELD_OPTIMIZER_ABI } from '@/utils/constants'

export const useRemoveVault = () => {
  const [removeVaultAddress, setRemoveVaultAddress] = useState('');
  const { write: removeVaultWrite, isSuccess: removeVaultSuccess, isLoading: isRemovingVault } = useWriteContract({
    address: YIELD_OPTIMIZER_ADDRESS,
    abi: YIELD_OPTIMIZER_ABI,
    functionName: 'removeVault',
    args: [removeVaultAddress],
    onSuccess: () => {
      console.error({
        title: 'Success',
        description: 'Vault removed successfully!',
      });
      setRemoveVaultAddress('');
    },
    onError: (error) => {
      console.error({
        title: 'Error',
        description: `Error removing vault: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  return {
    removeVaultAddress,
    setRemoveVaultAddress,
    removeVaultWrite,
    isRemovingVault,
  };
};
