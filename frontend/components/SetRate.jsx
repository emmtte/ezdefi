'use client';
import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from './ui/label';
import { toast } from "sonner";
import { useSetRate } from '@/hooks/useSetRate';

const SetRate = ({ token, refetch }) => {
    const [rate, setRate] = useState('');
    const { handleSetRate, isPending, hash, isLoading, isSuccess, error } = useSetRate({ token, refetch });

    useEffect(() => {
        if (isSuccess) {
            toast("Taux mis à jour avec succès.");
            setRate('');
        }
    }, [isSuccess]);

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold">Set Rate</h2>
            {hash && <div>Transaction Hash: {hash}</div>}
            {isLoading && <div>Mise à jour du taux en cours...</div>}
            {isSuccess && <div>Taux mis à jour.</div>}
            {error && (
                <div>Erreur: {error.shortMessage || error.message}</div>
            )}
            <div>
                <Label>Rate in %</Label>
                <Input
                    type="number"
                    placeholder="Rate in %"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    step="10"
                />
            </div>
            <Button 
                onClick={() => handleSetRate(parseFloat(rate))} 
                disabled={isPending}
            >
                {isPending ? 'Mise à jour...' : 'Mettre à jour le taux'}
            </Button>
        </div>
    );
};

export default SetRate;