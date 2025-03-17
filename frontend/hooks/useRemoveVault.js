// hooks/useRemoveVault.js
import { useState } from 'react';
import { useContractWrite } from 'wagmi';
import { useToast } from '@/components/ui/use-toast';

const useRemoveVault = (contractAddress, contractABI) => {
  const [removeVaultAddress, setRemoveVaultAddress] = useState('');
  const { toast } = useToast();
  const { write: removeVaultWrite, isSuccess: removeVaultSuccess, isLoading: isRemovingVault } = useContractWrite({
    address: contractAddress,
    abi: contractABI,
    functionName: 'removeVault',
    args: [removeVaultAddress],
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Vault removed successfully!',
      });
      setRemoveVaultAddress('');
    },
    onError: (error) => {
      toast({
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

export default useRemoveVault;