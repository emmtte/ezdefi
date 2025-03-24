'use client';
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAccount } from 'wagmi';
import { useDeposit } from '@/hooks/useDeposit';
import { useApprove } from '@/hooks/useApprove';
import { useBalanceOf } from '@/hooks/useBalanceOf';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { YIELD_OPTIMIZER_ADDRESS, YIELD_OPTIMIZER_ABI, MINTABLE_USDC_ADDRESS, MINTABLE_USDC_ABI } from '@/utils/constants'

const Deposit2 = () => {
  const { address } = useAccount();
  const { 
    amount, 
    setAmount, 
    handleDeposit, 
    hash: depositHash, 
    error: depositError, 
    isPending: isDepositPending, 
    isLoading: isDepositLoading, 
    isSuccess: isDepositSuccess 
  } = useDeposit(address, () => {
    refetchBalance();
    refetchDeposited();
  });
  
  const { 
    handleApprove, 
    hash: approveHash, 
    error: approveError, 
    isPending: isApprovePending, 
    isLoading: isApproveLoading, 
    isSuccess: isApproveSuccess 
  } = useApprove(MINTABLE_USDC_ADDRESS, YIELD_OPTIMIZER_ADDRESS);
  
  const { balance: usdcBalance, isLoading: balanceLoading, refetch: refetchBalance } = useBalanceOf({ address: MINTABLE_USDC_ADDRESS, abi: MINTABLE_USDC_ABI, user: address  });
  const { balance: depositedAmount, isLoading: depositedLoading, isError: depositedError, error: depositedErrorData, refetch: refetchDeposited } = useBalanceOf({ address: YIELD_OPTIMIZER_ADDRESS, abi:YIELD_OPTIMIZER_ABI, user: address  });

  useEffect(() => {
    if (isDepositSuccess) {
      toast("Dépôt effectué avec succès!");
      setAmount('');
      refetchBalance();
      refetchDeposited();
    }
  }, [isDepositSuccess, setAmount, refetchBalance, refetchDeposited]);

  useEffect(() => {
    if (isApproveSuccess) {
      toast("Approbation effectuée avec succès!");
    }
  }, [isApproveSuccess]);

  const isValidAmount = amount && Number(amount) > 0 && Number(amount) <= Number(usdcBalance);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Dépôt USDC</CardTitle>
        <div className="space-y-2 mt-2">
          {/* Solde disponible */}
          <div className="flex items-center text-sm">
            <span className="font-medium">Solde disponible: </span>
            <span className="ml-1 font-semibold text-green-600">
              {balanceLoading ? "Chargement..." : `${usdcBalance || '0'} USDC`}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-2 h-6 px-2" 
              onClick={refetchBalance}
            >
              ↻
            </Button>
          </div>
          
          {/* Montant déjà déposé */}
          <div className="flex items-center text-sm">
            <span className="font-medium">Déjà déposé: </span>
            {depositedLoading ? (
              <span className="ml-1">Chargement...</span>
            ) : depositedError ? (
              <span className="ml-1 text-red-500">Erreur de chargement</span>
            ) : (
              <span className="ml-1 font-semibold text-blue-600">{depositedAmount || '0'} EZD</span>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-2 h-6 px-2" 
              onClick={refetchDeposited}
            >
              ↻
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Informations sur la transaction de dépôt */}
        {depositHash && <div className="text-sm break-all">Transaction Hash (Dépôt): {depositHash}</div>}
        {isDepositLoading && <div className="text-sm text-blue-500">En attente de confirmation du dépôt...</div>}
        {isDepositSuccess && <div className="text-sm text-green-500">Transaction de dépôt confirmée.</div>}
        {depositError && (
          <div className="text-sm text-red-500">Erreur de dépôt: {depositError.shortMessage || depositError.message}</div>
        )}

        {/* Informations sur la transaction d'approbation */}
        {approveHash && <div className="text-sm break-all">Transaction Hash (Approbation): {approveHash}</div>}
        {isApproveLoading && <div className="text-sm text-blue-500">{`En attente de confirmation de l'approbation...`}</div>}
        {isApproveSuccess && <div className="text-sm text-green-500">{`Transaction d'approbation confirmée.`}</div>}
        {approveError && (
          <div className="text-sm text-red-500">{`Erreur d'approbation:`} {approveError.shortMessage || approveError.message}</div>
        )}
        
        {/* Champ de saisie du montant */}
        <div className="space-y-2">
          <Label htmlFor="deposit-amount">Montant à déposer (USDC)</Label>
          <div className="flex space-x-2">
            <Input
              id="deposit-amount"
              type="number"
              placeholder="Montant en USDC"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="1"
              disabled={isDepositPending || isDepositLoading || isApprovePending || isApproveLoading}
            />
            {usdcBalance && (
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setAmount(usdcBalance)}
                disabled={isDepositPending || isDepositLoading || isApprovePending || isApproveLoading}
                className="whitespace-nowrap"
              >
                Max
              </Button>
            )}
          </div>
        </div>
        
        {/* Boutons d'approbation et de dépôt */}
        <div className="space-y-2">
          <Button
            className="w-full"
            onClick={() => handleApprove(amount)}
            disabled={isApprovePending || isApproveLoading || !isValidAmount}
          >
            {isApprovePending || isApproveLoading ? 'Approbation en cours...' : 'Approuver'}
          </Button>
          
          <Button
            className="w-full"
            onClick={() => handleDeposit(amount)}
            disabled={isDepositPending || isDepositLoading || !isValidAmount || isApprovePending || isApproveLoading}
          >
            {isDepositPending || isDepositLoading ? 'Dépôt en cours...' : 'Déposer'}
          </Button>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <div className="text-xs text-gray-500">
          Adresse du portefeuille: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Non connecté'}
        </div>
      </CardFooter>
    </Card>
  );
};

export default Deposit2;