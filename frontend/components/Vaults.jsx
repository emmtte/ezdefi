'use client';

import { useState, useEffect } from 'react';
import { useAccount, useContractRead } from 'wagmi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { toast as shadcnToast } from '@/components/ui/toast';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/utils/constants';
import useAddVault from '@/hooks/useAddVault';
import useRemoveVault from '@/hooks/useRemoveVault';

const VaultManagement = () => {
  const { address, isConnected } = useAccount();
  const [isOwner, setIsOwner] = useState(false);
  const { toast } = useToast();

  const { data: ownerAddress } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'owner',
  });

  const {
    newVaultAddress,
    setNewVaultAddress,
    addVaultWrite,
    isAddingVault,
  } = useAddVault(CONTRACT_ADDRESS, CONTRACT_ABI);

  const {
    removeVaultAddress,
    setRemoveVaultAddress,
    removeVaultWrite,
    isRemovingVault,
  } = useRemoveVault(CONTRACT_ADDRESS, CONTRACT_ABI);

  useEffect(() => {
    if (isConnected && ownerAddress && address) {
      setIsOwner(address.toLowerCase() === ownerAddress?.toLowerCase());
    } else {
      setIsOwner(false);
    }
  }, [isConnected, ownerAddress, address]);

  if (!isOwner) {
    return null;
  }

  return (
    <div>
      <Dialog>
        <DialogTrigger asChild>
          <Button>Manage Vaults</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Vault Management</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="new-vault" className="text-right">
                Add Vault:
              </label>
              <Input
                id="new-vault"
                value={newVaultAddress}
                onChange={(e) => setNewVaultAddress(e.target.value)}
                className="col-span-3"
              />
            </div>
            <Button
              onClick={() => addVaultWrite?.()}
              disabled={!newVaultAddress || isAddingVault}
            >
              {isAddingVault ? 'Adding...' : 'Add Vault'}
            </Button>

            <div className="grid grid-cols-4 items-center gap-4 mt-4">
              <label htmlFor="remove-vault" className="text-right">
                Remove Vault:
              </label>
              <Input
                id="remove-vault"
                value={removeVaultAddress}
                onChange={(e) => setRemoveVaultAddress(e.target.value)}
                className="col-span-3"
              />
            </div>
            <Button
              onClick={() => removeVaultWrite?.()}
              disabled={!removeVaultAddress || isRemovingVault}
            >
              {isRemovingVault ? 'Removing...' : 'Remove Vault'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <shadcnToast />
    </div>
  );
};

export default VaultManagement;