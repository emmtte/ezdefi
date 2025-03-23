'use client';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import { useFaucet } from '@/hooks/useFaucet';
import { useUsdcBalance } from '@/hooks/useUsdcBalance';
import { MINTABLE_USDC_ADDRESS } from '@/utils/constants';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";

const USDCFaucet = ({ address, refetch }) => {
    const { requestFaucet, isPending, hash, isLoading, isSuccess, error } = useFaucet({ refetch });
    const { balance, isLoading: balanceLoading, isError: balanceError, error: balanceErrorMessage, refetch: refetchBalance } = useUsdcBalance({ address });
    
    const FAUCET_AMOUNT = 10000;

    useEffect(() => {
        if (isSuccess) {
            toast("Réclamation USDC effectuée avec succès.");
            refetchBalance(); // Refresh balance after successful claim
        }
    }, [isSuccess, refetchBalance]);

    const handleClaimFaucet = () => {
        requestFaucet(FAUCET_AMOUNT);
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Faucet USDC</CardTitle>
                <div className="text-sm mt-1">
                    {balanceLoading && <span>Chargement du solde...</span>}
                    {balanceError && <span className="text-red-500">Erreur de chargement du solde: {balanceErrorMessage?.message}</span>}
                    {balance && (
                        <div className="flex items-center">
                            <span className="font-medium">Solde actuel: </span>
                            <span className="ml-1 font-semibold text-green-600">{balance} USDC</span>
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
            </CardHeader>
            <CardContent className="space-y-4">
                {hash && <div className="text-sm">Transaction Hash: {hash}</div>}
                {isLoading && <div className="text-sm text-blue-500">Réclamation en cours...</div>}
                {isSuccess && <div className="text-sm text-green-500">Réclamation réussie.</div>}
                {error && (
                    <div className="text-sm text-red-500">Erreur: {error.shortMessage || error.message}</div>
                )}
                
                <div className="text-center py-2">
                    <div className="text-lg font-medium mb-2">Réclamer {FAUCET_AMOUNT} USDC</div>
                    <div className="text-sm text-gray-600 mb-4">
                        Cliquez sur le bouton ci-dessous pour recevoir des USDC de test.
                    </div>
                </div>

                <Button 
                    onClick={handleClaimFaucet} 
                    disabled={isPending}
                    className="w-full"
                    size="lg"
                >
                    {isPending ? 'Réclamation en cours...' : 'Réclamer 10000 USDC'}
                </Button>
            </CardContent>
            <CardFooter className="pt-0">
                <div className="text-xs text-gray-500">
                    Adresse du Token USDC: {MINTABLE_USDC_ADDRESS}
                </div>
            </CardFooter>
        </Card>
    );
};

export default USDCFaucet;