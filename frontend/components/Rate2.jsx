'use client';
import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from "sonner";
import { useGetRate } from '@/hooks/useGetRate';
import { useSetRate } from '@/hooks/useSetRate';
import { useAccrueInterest } from '@/hooks/useAccrueInterest';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";

const Rate = ({ name, address }) => {
    const [newRate, setNewRate] = useState('');
    const { rate: currentRate, isLoading: rateLoading, isError: rateError, error: rateErrorMessage, refetch: refetchRate } = useGetRate({ address });
    const { handleSetRate, isPending, hash, isLoading, isSuccess, error } = useSetRate({ address, refetch: refetchRate });
    const { handleAccrueInterest, isPending: isAccruing, isSuccess: accrueSuccess, error: accrueError } = useAccrueInterest({ address });

    useEffect(() => {
        if (isSuccess) {
            toast("Taux mis à jour avec succès.");
            setNewRate('');
            refetchRate(); // Rafraîchir le taux après une mise à jour réussie
        }
    }, [isSuccess, refetchRate]);

    useEffect(() => {
        if (accrueSuccess) {
            toast("Intérêts accumulés avec succès.");
            refetchRate(); // Rafraîchir le taux après accumulation des intérêts
        }
    }, [accrueSuccess, refetchRate]);

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>{`Gestion du taux d'intérêt pour le Vault`} {name}</CardTitle>
                <div className="mt-2">
                    {rateLoading && <div className="text-sm">{`Chargement du taux d'intérêt...`}</div>}
                    {rateError && <div className="text-sm text-red-500">Erreur: {rateErrorMessage?.message}</div>}
                    {currentRate !== undefined && (
                        <div className="flex items-center">
                            <div className="text-lg font-medium">
                                Taux actuel: <span className="text-blue-600 font-bold">{currentRate}%</span>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="ml-2 h-6 px-2" 
                                onClick={refetchRate}
                            >
                                ↻
                            </Button>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {hash && <div className="text-sm break-all">Transaction Hash: {hash}</div>}
                {isLoading && <div className="text-sm text-blue-500">Mise à jour du taux en cours...</div>}
                {isSuccess && <div className="text-sm text-green-500">Taux mis à jour avec succès.</div>}
                {error && (
                    <div className="text-sm text-red-500">Erreur: {error.shortMessage || error.message}</div>
                )}
                <div className="space-y-2">
                    <Label htmlFor="newRate">{`Nouveau taux d'intérêt (%)`}</Label>
                    <div className="flex space-x-2">
                        <Input
                            id="newRate"
                            type="number"
                            placeholder="Entrez un nouveau taux"
                            value={newRate}
                            onChange={(e) => setNewRate(e.target.value)}
                            step="10"
                            min="0"
                        />
                        {currentRate !== undefined && (
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={() => setNewRate(currentRate.toString())}
                                className="whitespace-nowrap"
                            >
                                Actuel
                            </Button>
                        )}
                    </div>
                </div>
                <div className="flex space-x-2">
                    <Button 
                        onClick={() => handleSetRate(parseFloat(newRate))} 
                        disabled={isPending || newRate === '' || newRate === currentRate?.toString()}
                        className="flex-1"
                    >
                        {isPending ? 'Mise à jour en cours...' : 'Mettre à jour le taux'}
                    </Button>
                    <Button 
                        onClick={handleAccrueInterest}
                        disabled={isAccruing}
                        variant="secondary"
                        className="flex-1"
                    >
                        {isAccruing ? 'En cours...' : 'Accumuler les intérêts'}
                    </Button>
                </div>
                {isAccruing && <div className="text-sm text-blue-500">Accumulation des intérêts en cours...</div>}
                {accrueSuccess && <div className="text-sm text-green-500">Intérêts accumulés avec succès.</div>}
                {accrueError && (
                    <div className="text-sm text-red-500">Erreur: {accrueError.shortMessage || accrueError.message}</div>
                )}
            </CardContent>
            <CardFooter className="pt-0">
                <div className="text-xs text-gray-500">
                    Adresse du Vault {name}: {address || 'Non spécifié'} 
                </div>
            </CardFooter>
        </Card>
    );
};

export default Rate;