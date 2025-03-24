import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { AAVE_USDC_ABI, AAVE_USDC_ADDRESS, COMPOUND_USDC_ABI, COMPOUND_USDC_ADDRESS } from '@/utils/constants';

export const useAccrueInterest = ({ address }) => {
    const { data: hash, error, isPending, writeContract } = useWriteContract();
    const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

    const handleAccrueInterest = async () => {
        try {
            writeContract({ address, abi:AAVE_USDC_ABI, functionName: 'accrueInterest' });
        } catch (error) {
            console.error("Erreur lors de l'ajout des interets :", error);
        }
    };

    return {
        handleAccrueInterest,
        isPending,
        hash,
        isLoading,
        isSuccess,
        error
    };
};