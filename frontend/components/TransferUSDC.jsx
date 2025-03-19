'use client';
import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from "sonner";
import { useTransferUSDC } from '@/hooks/useTransferUSDC';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const TransferUSDC = ({ refetch }) => {
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const { handleTransfer, isPending, hash, isLoading, isSuccess, error } = useTransferUSDC({ refetch });

    useEffect(() => {
        if (isSuccess) {
            toast("Transfert USDC effectué avec succès.");
            setRecipient('');
            setAmount('');
        }
    }, [isSuccess]);

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Transfert de USDC</CardTitle>
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
                    <Input
                        id="amount"
                        type="number"
                        placeholder="100"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        step="10"
                    />
                </div>
                <Button 
                    onClick={() => handleTransfer(recipient, amount)} 
                    disabled={isPending || !recipient || !amount}
                    className="w-full"
                >
                    {isPending ? 'Transfert en cours...' : 'Transférer USDC'}
                </Button>
            </CardContent>
        </Card>
    );
};

export default TransferUSDC;