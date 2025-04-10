'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import Rate from './Rate';
import { useRebalance } from '@/hooks/useRebalance';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';

const VaultsRebalance = () => {

    const { address: account } = useAccount();

    const { 
        handleRebalance, 
        isPending: isRebalancing, 
        hash: rebalanceHash, 
        error: rebalanceError 
    } = useRebalance(account, () => {
        toast("Optimisation du Rendement effectué avec succès");
    });

    return (
        <div className="space-y-6">
            <Card className="w-full max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>Optimisation du Rendement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {rebalanceHash && (
                        <div className="text-sm break-all">
                            Transaction Hash: {rebalanceHash}
                        </div>
                    )}
                    {rebalanceError && (
                        <div className="text-sm text-red-500">
                            Erreur: {rebalanceError.shortMessage || rebalanceError.message}
                        </div>
                    )}
                    <Button 
                        onClick={() => handleRebalance()}
                        disabled={isRebalancing || !account}
                        className="w-full"
                    >
                        {isRebalancing ? 'Optimisation du Rendement en cours...' : 'Optimisation du Rendement'}
                    </Button>
                </CardContent>
                <CardFooter className="text-xs text-gray-500">
                    {!account ? "Connectez votre portefeuille pour Optimiser" : "Optimiser automatiquement le rendement"}
                </CardFooter>
            </Card>
        </div>
    );
};

export default VaultsRebalance;