'use client';
import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from "sonner";
import { useTransferUSDC } from '@/hooks/useTransferUSDC';
import { useUsdcBalance } from '@/hooks/useUsdcBalance';
import { MINTABLE_USDC_ADDRESS } from '@/utils/constants';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";

const USDC = ({ address, refetch }) => {
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const { handleTransfer, isPending, hash, isLoading, isSuccess, error } = useTransferUSDC({ refetch });
    const { balance, isLoading: balanceLoading, isError: balanceError, error: balanceErrorMessage, refetch: refetchBalance } = useUsdcBalance({address});

    useEffect(() => {
        if (isSuccess) {
            toast("Transfert USDC effectué avec succès.");
            setRecipient('');
            setAmount('');
            refetchBalance(); // Refresh balance after successful transfer
        }
    }, [isSuccess, refetchBalance]);

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Transfert de USDC</CardTitle>
                <div className="text-sm mt-1">
                    {balanceLoading && <span>Chargement du solde...</span>}
                    {balanceError && <span className="text-red-500">Erreur de chargement du solde: {balanceErrorMessage?.message}</span>}
                    {balance && (
                        <div className="flex items-center">
                            <span className="font-medium">Solde disponible: </span>
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
                {isLoading && <div className="text-sm text-blue-500">Transfert en cours...</div>}
                {isSuccess && <div className="text-sm text-green-500">Transfert réussi.</div>}
                {error && (
                    <div className="text-sm text-red-500">Erreur: {error.shortMessage || error.message}</div>
                )}
                <div className="space-y-2">
                    <Label htmlFor="recipient">Adresse du destinataire</Label>
                    <Input
                        id="recipient"
                        placeholder="0x..."
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="amount">Montant USDC</Label>
                    <div className="flex space-x-2">
                        <Input
                            id="amount"
                            type="number"
                            placeholder="100"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            step="10"
                        />
                        {balance && (
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={() => setAmount(balance)}
                                className="whitespace-nowrap"
                            >
                                Max
                            </Button>
                        )}
                    </div>
                </div>
                <Button 
                    onClick={() => handleTransfer(recipient, amount)} 
                    disabled={isPending || !recipient || !amount || Number(amount) > Number(balance)}
                    className="w-full"
                >
                    {isPending ? 'Transfert en cours...' : 'Transférer USDC'}
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

export default USDC;