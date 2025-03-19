'use client';
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAccount } from 'wagmi';
import { useWithdrawal } from '@/hooks/useWithdrawal';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";

// Hook personnalisé pour récupérer le montant disponible à retirer
const useWithdrawableAmount = (address) => {
  const [withdrawableAmount, setWithdrawableAmount] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWithdrawableAmount = async () => {
    if (!address) return;
    
    setIsLoading(true);
    try {
      // Remplacez cette partie par votre logique réelle pour obtenir le montant retirable
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
      setWithdrawableAmount(mockData);
    } catch (err) {
      setError(err);
      console.error("Failed to fetch withdrawable amount:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawableAmount();
  }, [address]);

  return { withdrawableAmount, isLoading, error, refetch: fetchWithdrawableAmount };
};

const Withdraw = ({ refetch: parentRefetch }) => {
  const { address } = useAccount();
  const [amount, setAmount] = useState('');
  
  // Je suppose que votre hook useWithdrawal a une structure similaire à useDeposit
  const { handleWithdraw, hash, error, isPending, isConfirming, isConfirmed } = useWithdrawal(address, () => {
    parentRefetch?.();
    refetchWithdrawable();
  });
  
  const { withdrawableAmount, isLoading: withdrawableLoading, error: withdrawableError, refetch: refetchWithdrawable } = useWithdrawableAmount(address);

  useEffect(() => {
    if (isConfirmed) {
      toast("Retrait effectué avec succès!");
      setAmount('');
    }
  }, [isConfirmed]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Retrait USDC</CardTitle>
        <div className="space-y-2 mt-2">
          <div className="text-sm">
            {withdrawableLoading ? (
              <span>Chargement du montant disponible...</span>
            ) : withdrawableError ? (
              <span className="text-red-500">Erreur: {withdrawableError?.message}</span>
            ) : (
              <div className="flex items-center">
                <span className="font-medium">Disponible au retrait: </span>
                <span className="ml-1 font-semibold text-green-600">{withdrawableAmount || '0'} USDC</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-2 h-6 px-2" 
                  onClick={refetchWithdrawable}
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
          <Label htmlFor="withdraw-amount">Montant à retirer (USDC)</Label>
          <div className="flex space-x-2">
            <Input
              id="withdraw-amount"
              type="number"
              placeholder="Montant en USDC"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="1"
              disabled={isPending || isConfirming}
            />
            {withdrawableAmount && (
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setAmount(withdrawableAmount)}
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
          onClick={() => handleWithdraw(amount)}
          disabled={isPending || isConfirming || !amount || Number(amount) <= 0 || Number(amount) > Number(withdrawableAmount)}
        >
          {isPending || isConfirming ? 'Retrait en cours...' : 'Retirer'}
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