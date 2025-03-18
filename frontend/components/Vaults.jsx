'use client';

import { useAccount } from 'wagmi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAddVault } from '@/hooks/useAddVault';
import { useRemoveVault } from '@/hooks/useRemoveVault';


export const VaultManagement = () => {
  const { address, isConnected } = useAccount();
  const isOwner = useOwnerCheck(address)
  const { newVaultAddress, setNewVaultAddress, addVaultWrite, isAddingVault } = useAddVault();
  const { removeVaultAddress, setRemoveVaultAddress, removeVaultWrite, isRemovingVault } = useRemoveVault();

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
