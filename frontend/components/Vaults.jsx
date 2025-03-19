'use client';

import React, { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { useAddVault } from '@/hooks/useAddVault';
import { useRemoveVault } from '@/hooks/useRemoveVault';

const VaultManagement = () => {
  const { 
    newVaultAddress, 
    setNewVaultAddress, 
    addVaultWrite, 
    isLoading: isAddingVault, 
    isSuccess: addSuccess,
    error: addError,
    hash: addHash
  } = useAddVault();
  
  const { 
    removeVaultAddress, 
    setRemoveVaultAddress, 
    removeVaultWrite, 
    isLoading: isRemovingVault,
    isSuccess: removeSuccess,
    error: removeError,
    hash: removeHash
  } = useRemoveVault();

  // Handle success notifications
  useEffect(() => {
    if (addSuccess) {
      toast("Vault ajouté avec succès.");
      setNewVaultAddress('');
    }
  }, [addSuccess]);

  useEffect(() => {
    if (removeSuccess) {
      toast("Vault supprimé avec succès.");
      setRemoveVaultAddress('');
    }
  }, [removeSuccess]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Gestion des Vaults</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Vault Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Ajouter un Vault</h3>
          <div className="space-y-2">
            <Input
              id="new-vault"
              placeholder="Adresse du vault à ajouter (0x...)"
              value={newVaultAddress}
              onChange={(e) => setNewVaultAddress(e.target.value)}
            />
            
            {addHash && <div className="text-xs text-gray-500">Transaction Hash: {addHash}</div>}
            {isAddingVault && <div className="text-xs text-blue-500">Ajout en cours...</div>}
            {addSuccess && <div className="text-xs text-green-500">Vault ajouté avec succès.</div>}
            {addError && <div className="text-xs text-red-500">Erreur: {addError.shortMessage || addError.message}</div>}
            
            <Button
              onClick={() => addVaultWrite?.()}
              disabled={!newVaultAddress || isAddingVault}
              className="w-full"
            >
              {isAddingVault ? 'Ajout en cours...' : 'Ajouter Vault'}
            </Button>
          </div>
        </div>

        <hr className="my-2" />

        {/* Remove Vault Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Supprimer un Vault</h3>
          <div className="space-y-2">
            <Input
              id="remove-vault"
              placeholder="Adresse du vault à supprimer (0x...)"
              value={removeVaultAddress}
              onChange={(e) => setRemoveVaultAddress(e.target.value)}
            />
            
            {removeHash && <div className="text-xs text-gray-500">Transaction Hash: {removeHash}</div>}
            {isRemovingVault && <div className="text-xs text-blue-500">Suppression en cours...</div>}
            {removeSuccess && <div className="text-xs text-green-500">Vault supprimé avec succès.</div>}
            {removeError && <div className="text-xs text-red-500">Erreur: {removeError.shortMessage || removeError.message}</div>}
            
            <Button
              onClick={() => removeVaultWrite?.()}
              disabled={!removeVaultAddress || isRemovingVault}
              className="w-full"
            >
              {isRemovingVault ? 'Suppression en cours...' : 'Supprimer Vault'}
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-0">
        <div className="text-xs text-gray-500">
          Gestion des vaults activée
        </div>
      </CardFooter>
    </Card>
  );
};

export default VaultManagement;