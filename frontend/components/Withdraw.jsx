'use client';
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAccount } from 'wagmi';
import { useWithdraw } from '@/hooks/useWithdraw';
import { useBalanceOf } from '@/hooks/useBalanceOf';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { YIELD_OPTIMIZER_ADDRESS, YIELD_OPTIMIZER_ABI, MINTABLE_USDC_ADDRESS, MINTABLE_USDC_ABI } from '@/utils/constants'

const Withdraw = () => {
  const { address } = useAccount();
  const { amount, setAmount, handleWithdraw, hash, error, isPending, isLoading, isSuccess } = useWithdraw(address, () => {
    refetchBalance();
    refetchDeposited();
  });
  
  const { balance: usdcBalance, isLoading: balanceLoading, refetch: refetchBalance } = useBalanceOf({ address: MINTABLE_USDC_ADDRESS, abi: MINTABLE_USDC_ABI, user: address });
  const { balance: depositedAmount, isLoading: depositedLoading, isError: depositedError, error: depositedErrorData, refetch: refetchDeposited } = useBalanceOf({ address: YIELD_OPTIMIZER_ADDRESS, abi: YIELD_OPTIMIZER_ABI, user: address });

  useEffect(() => {
    if (isSuccess) {
      toast("Retrait effectué avec succès!");
      setAmount('');
      refetchBalance();
      refetchDeposited();
    }
  }, [isSuccess, setAmount, refetchBalance, refetchDeposited]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Retrait USDC</CardTitle>
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
        {/* Informations sur la transaction */}
        {hash && <div className="text-sm break-all">Transaction Hash: {hash}</div>}
        {isLoading && <div className="text-sm text-blue-500">En attente de confirmation...</div>}
        {isSuccess && <div className="text-sm text-green-500">Transaction confirmée.</div>}
        {error && (
          <div className="text-sm text-red-500">Erreur: {error.shortMessage || error.message}</div>
        )}
        
        {/* Champ de saisie du montant */}
        <div className="space-y-2">
          <Label htmlFor="withdraw-amount">Montant à retirer (EZD)</Label>
          <div className="flex space-x-2">
            <Input
              id="withdraw-amount"
              type="number"
              placeholder="Montant en EZD"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="1"
              disabled={isPending || isLoading}
            />
            {depositedAmount && (
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setAmount(depositedAmount)}
                disabled={isPending || isLoading}
                className="whitespace-nowrap"
              >
                Max
              </Button>
            )}
          </div>
        </div>
        
        {/* Bouton de retrait */}
        <Button
          className="w-full"
          onClick={() => handleWithdraw(amount)}
          disabled={isPending || isLoading || !amount || Number(amount) <= 0 || Number(amount) > Number(depositedAmount)}
        >
          {isPending || isLoading ? 'Retrait en cours...' : 'Retirer'}
        </Button>
      </CardContent>
      
      <CardFooter className="pt-0">
        <div className="text-xs text-gray-500">
          Adresse du portefeuille: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Non connecté'}
        </div>
      </CardFooter>
    </Card>
  );
};

export default Withdraw;