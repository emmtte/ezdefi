import { useState } from 'react';
import { toast } from "sonner"
import { YIELD_OPTIMIZER_ADDRESS, YIELD_OPTIMIZER_ABI } from '@/utils/constants'

export const useAddVault = () => {
  const [newVaultAddress, setNewVaultAddress] = useState('');
  const { toast } = useToast();
  const { write: addVaultWrite, isSuccess: addVaultSuccess, isLoading: isAddingVault } = useContractWrite({
    address: YIELD_OPTIMIZER_ADDRESS,
    abi: YIELD_OPTIMIZER_ABI,
    functionName: 'addVault',
    args: [newVaultAddress],
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Vault added successfully!',
      });
      setNewVaultAddress('');
    },
    onError: (error) => {
      toast({
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
