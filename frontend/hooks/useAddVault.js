import { useState } from 'react';
import { useContractWrite } from 'wagmi';
import { useToast } from '@/components/ui/use-toast';

const useAddVault = (contractAddress, contractABI) => {
  const [newVaultAddress, setNewVaultAddress] = useState('');
  const { toast } = useToast();
  const { write: addVaultWrite, isSuccess: addVaultSuccess, isLoading: isAddingVault } = useContractWrite({
    address: contractAddress,
    abi: contractABI,
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

export default useAddVault;