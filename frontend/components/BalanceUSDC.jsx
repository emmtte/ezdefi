'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAccount } from 'wagmi';
import { useUsdcBalance } from '@/hooks/useUsdcBalance';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const BalanceUSDC = () => {
  const { address } = useAccount();
  
  const { 
    balance: usdcBalance, 
    isLoading: balanceLoading, 
    isError: balanceError, 
    error: balanceErrorMessage, 
    refetch: refetchBalance 
  } = useUsdcBalance({ address });

  return (
    <Card className="w-full max-w-md mx-auto mb-6">
      <CardHeader>
        <CardTitle>Mon solde USDC</CardTitle>
      </CardHeader>
      
      <CardContent>
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
      </CardContent>
    </Card>
  );
};

export default BalanceUSDC;