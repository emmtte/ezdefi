'use client';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAccount } from 'wagmi';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";

// Hook personnalisé pour récupérer les soldes des tokens
const useTokenBalances = (address) => {
  const [balances, setBalances] = useState({
    aToken: null,
    cToken: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBalances = async () => {
    if (!address) return;
    
    setIsLoading(true);
    try {
      // Remplacez cette partie par votre logique réelle pour obtenir les soldes
      // Exemple avec un appel à un contrat via wagmi
      // const aTokenBalance = await readContract({
      //   address: aTokenAddress,
      //   abi: tokenAbi,
      //   functionName: 'balanceOf',
      //   args: [address],
      // });
      // const cTokenBalance = await readContract({
      //   address: cTokenAddress,
      //   abi: tokenAbi,
      //   functionName: 'balanceOf',
      //   args: [address],
      // });
      
      // Simulation pour l'exemple
      const mockData = {
        aToken: "150",
        cToken: "100"
      };
      setBalances(mockData);
    } catch (err) {
      setError(err);
      console.error("Failed to fetch token balances:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [address]);

  return { balances, isLoading, error, refetch: fetchBalances };
};

// Hook personnalisé pour la rebalance (supposé, à adapter selon votre implémentation réelle)
const useRebalance = (address, refetch) => {
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [hash, setHash] = useState('');
  const [error, setError] = useState(null);

  const handleRebalance = async () => {
    if (!address) return;
    
    setIsPending(true);
    setIsConfirming(false);
    setIsConfirmed(false);
    setError(null);
    
    try {
      // Simulation pour l'exemple, remplacez par votre logique réelle
      // const { hash } = await writeContract({...})
      
      // Simuler une transaction
      await new Promise(resolve => setTimeout(resolve, 1000));
      setHash('0x123...456');
      setIsPending(false);
      setIsConfirming(true);
      
      // Simuler une confirmation
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsConfirming(false);
      setIsConfirmed(true);
      
      if (refetch) {
        refetch();
      }
    } catch (err) {
      setError(err);
      setIsPending(false);
      console.error("Rebalance failed:", err);
    }
  };

  return { handleRebalance, isPending, isConfirming, isConfirmed, hash, error };
};

const Rebalance = ({ refetch: parentRefetch }) => {
  const { address } = useAccount();
  const { balances, isLoading: balancesLoading, error: balancesError, refetch: refetchBalances } = useTokenBalances(address);
  
  const { handleRebalance, isPending, isConfirming, isConfirmed, hash, error } = useRebalance(address, () => {
    parentRefetch?.();
    refetchBalances();
  });

  useEffect(() => {
    if (isConfirmed) {
      toast("Rééquilibrage effectué avec succès!");
    }
  }, [isConfirmed]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Rééquilibrage des positions</CardTitle>
        <div className="space-y-2 mt-2">
          {balancesLoading ? (
            <div className="text-sm">Chargement des soldes...</div>
          ) : balancesError ? (
            <div className="text-sm text-red-500">Erreur: {balancesError?.message}</div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center">
                <span className="text-sm font-medium">Solde aToken: </span>
                <span className="ml-1 text-sm font-semibold text-blue-600">{balances?.aToken || '0'}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium">Solde cToken: </span>
                <span className="ml-1 text-sm font-semibold text-purple-600">{balances?.cToken || '0'}</span>
              </div>
              <div className="flex justify-end">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2" 
                  onClick={refetchBalances}
                >
                  ↻ Rafraîchir les soldes
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {hash && <div className="text-sm break-all">Transaction Hash: {hash}</div>}
        {isConfirming && <div className="text-sm text-blue-500">En attente de confirmation...</div>}
        {isConfirmed && <div className="text-sm text-green-500">Rééquilibrage confirmé.</div>}
        {error && (
          <div className="text-sm text-red-500">Erreur: {error.shortMessage || error.message}</div>
        )}
        
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            Le rééquilibrage optimise la distribution de vos actifs entre les aToken et cToken pour maximiser le rendement et minimiser les risques selon les conditions actuelles du marché.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {`Cette opération s'effectue automatiquement et peut engendrer des frais de transaction.`}
          </p>
        </div>
        
        <Button
          className="w-full"
          onClick={handleRebalance}
          disabled={isPending || isConfirming || !address || balancesLoading}
        >
          {isPending ? 'Rééquilibrage en cours...' : isConfirming ? 'Confirmation en cours...' : 'Rééquilibrer'}
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

export default Rebalance;