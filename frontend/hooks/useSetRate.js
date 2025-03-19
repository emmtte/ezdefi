import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { AAVE_USDC_ABI, AAVE_USDC_ADDRESS, COMPOUND_USDC_ABI, COMPOUND_USDC_ADDRESS } from '@/utils/constants';

export const useSetRate = ({ address }) => {
    const { data: hash, error, isPending, writeContract } = useWriteContract();
    const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

    const handleSetRate = async (newRate) => {
        if (isNaN(newRate) || newRate <= 0) { console.error("Taux invalide"); return; }
        newRate = newRate * 1000
        try {
            writeContract({ address, abi:AAVE_USDC_ABI, functionName: 'setInterestRate', args: [newRate], });
        } catch (error) {
            console.error("Erreur lors de la mise à jour du taux :", error);
        }
    };

    return {
        handleSetRate,
        isPending,
        hash,
        isLoading,
        isSuccess,
        error
    };
};