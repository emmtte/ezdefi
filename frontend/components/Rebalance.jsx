'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import Rate from './Rate';
import { useRebalance } from '@/hooks/useRebalance';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';
import { AAVE_USDC_ADDRESS, COMPOUND_USDC_ADDRESS } from '@/utils/constants';

const VaultsRebalance = () => {
    // Vault configurations using the imported addresses
    const vaults = [
        { 
            name: "A", 
            address: AAVE_USDC_ADDRESS 
        },
        { 
            name: "B", 
            address: COMPOUND_USDC_ADDRESS 
        }
    ];

    // Get the connected account
    const { address: account } = useAccount();

    // Rebalance hook
    const { 
        handleRebalance, 
        isPending: isRebalancing, 
        hash: rebalanceHash, 
        error: rebalanceError 
    } = useRebalance(account, () => {
        // Optional refetch logic if needed
        toast.success("Rééquilibrage effectué avec succès");
    });

    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                {vaults.map((vault) => (
                    <Rate 
                        key={vault.address} 
                        name={vault.name} 
                        address={vault.address} 
                    />
                ))}
            </div>

            <Card className="w-full max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>Rééquilibrage des Vaults</CardTitle>
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
                        {isRebalancing ? 'Rééquilibrage en cours...' : 'Rééquilibrer les Vaults'}
                    </Button>
                </CardContent>
                <CardFooter className="text-xs text-gray-500">
                    {!account ? "Connectez votre portefeuille pour rééquilibrer" : "Rééquilibrez automatiquement vos Vaults"}
                </CardFooter>
            </Card>
        </div>
    );
};

export default VaultsRebalance;