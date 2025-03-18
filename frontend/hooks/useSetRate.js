import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { AAVE_USDC_ABI, AAVE_USDC_ADDRESS, COMPOUND_USDC_ABI, COMPOUND_USDC_ADDRESS } from '@/utils/constants';

export const useSetRate = ({ token, refetch }) => {
    const { data: hash, error, isPending, writeContract } = useWriteContract();
    const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

    const getContractDetails = () => {
        if (token === 'cToken') {
            return { address: COMPOUND_USDC_ADDRESS, abi: COMPOUND_USDC_ABI };
        } else if (token === 'aToken') {
            return { address: AAVE_USDC_ADDRESS, abi: AAVE_USDC_ABI };
        }
        return { address: null, abi: null };
    };

    const handleSetRate = async (newRate) => {
        if (isNaN(newRate) || newRate <= 0) { console.error("Taux invalide"); return; }
        const { address, abi } = getContractDetails();
        if (!address || !abi) { console.error("Token non reconnu ou détails du contrat manquants."); return; }

        try {
            writeContract({ address, abi, functionName: 'setInterestRate', args: [newRate], });
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