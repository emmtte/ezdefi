'use client';
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAccount } from 'wagmi';
import { useDeposit } from '@/hooks/useDeposit';
import { useUsdcBalance } from '@/hooks/useUsdcBalance';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";

// Hook personnalisé pour récupérer le montant déjà déposé
const useDepositedAmount = (address) => {
  const [depositedAmount, setDepositedAmount] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDepositedAmount = async () => {
    if (!address) return;
    
    setIsLoading(true);
    try {
      // Remplacez cette partie par votre logique réelle pour obtenir le montant déposé
      // Exemple avec un appel à un contrat via wagmi
      // const data = await readContract({
      //   address: contractAddress,
      //   abi: contractAbi,
      //   functionName: 'balanceOf',
      //   args: [address],
      // });
      // const formattedAmount = formatUnits(data, 6); // Pour USDC qui a 6 décimales
      
      // Simulation pour l'exemple
      const mockData = "250"; // Montant fictif
      setDepositedAmount(mockData);
    } catch (err) {
      setError(err);
      console.error("Failed to fetch deposited amount:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepositedAmount();
  }, [address]);

  return { depositedAmount, isLoading, error, refetch: fetchDepositedAmount };
};

const Deposit = ({ refetch: parentRefetch }) => {
  const { address } = useAccount();
  const { amount, setAmount, handleDeposit, hash, error, isPending, isConfirming, isConfirmed } = useDeposit(address, () => {
    parentRefetch?.();
    refetchBalance();
    refetchDeposited();
  });
  
  const { balance: usdcBalance, isLoading: balanceLoading, isError: balanceError, error: balanceErrorMessage, refetch: refetchBalance } = useUsdcBalance({ address });
  const { depositedAmount, isLoading: depositedLoading, error: depositedError, refetch: refetchDeposited } = useDepositedAmount(address);

  useEffect(() => {
    if (isConfirmed) {
      toast("Dépôt effectué avec succès!");
      setAmount('');
    }
  }, [isConfirmed, setAmount]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Dépôt USDC</CardTitle>
        <div className="space-y-2 mt-2">
          <div className="text-sm">
            {balanceLoading ? (
              <span>Chargement du solde disponible...</span>
            ) : balanceError ? (
              <span className="text-red-500">Erreur: {balanceErrorMessage?.message}</span>
            ) : (
              <div className="flex items-center">
                <span className="font-medium">Solde disponible: </span>
                <span className="ml-1 font-semibold text-green-600">{usdcBalance || '0'} USDC</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-2 h-6 px-2" 
                  onClick={refetchBalance}
                >
                  ↻
                </Button>
              </div>
            )}
          </div>
          
          <div className="text-sm">
            {depositedLoading ? (
              <span>Chargement du montant déposé...</span>
            ) : depositedError ? (
              <span className="text-red-500">Erreur: {depositedError?.message}</span>
            ) : (
              <div className="flex items-center">
                <span className="font-medium">Déjà déposé: </span>
                <span className="ml-1 font-semibold text-blue-600">{depositedAmount || '0'} USDC</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-2 h-6 px-2" 
                  onClick={refetchDeposited}
                >
                  ↻
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {hash && <div className="text-sm break-all">Transaction Hash: {hash}</div>}
        {isConfirming && <div className="text-sm text-blue-500">En attente de confirmation...</div>}
        {isConfirmed && <div className="text-sm text-green-500">Transaction confirmée.</div>}
        {error && (
          <div className="text-sm text-red-500">Erreur: {error.shortMessage || error.message}</div>
        )}
        
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
              disabled={isPending || isConfirming}
            />
            {usdcBalance && (
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setAmount(usdcBalance)}
                disabled={isPending || isConfirming}
                className="whitespace-nowrap"
              >
                Max
              </Button>
            )}
          </div>
        </div>
        
        <Button
          className="w-full"
          onClick={() => handleDeposit(amount)}
          disabled={isPending || isConfirming || !amount || Number(amount) <= 0 || Number(amount) > Number(usdcBalance)}
        >
          {isPending || isConfirming ? 'Dépôt en cours...' : 'Déposer'}
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

export default Deposit;