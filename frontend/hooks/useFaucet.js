import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { MINTABLE_USDC_ADDRESS, MINTABLE_USDC_ABI } from '@/utils/constants'

export const useFaucet = () => {
    const { data: hash, error, isPending, writeContract } = useWriteContract();
    const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

    const requestFaucet = async () => {
        try {
            writeContract({ address: MINTABLE_USDC_ADDRESS, abi: MINTABLE_USDC_ABI, functionName: 'faucet' });
        } catch (error) {
            console.error("Erreur lors de la demande de tokens :", error);
        }
    };

    return {
        requestFaucet,
        isPending,
        hash,
        isLoading,
        isSuccess,
        error
    };
};