import { useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { MINTABLE_USDC_ADDRESS, MINTABLE_USDC_ABI } from '@/utils/constants'

export const useUsdcBalance = ({address}) => {
    const { data, isLoading, isError, error, refetch } = useReadContract({
        address: MINTABLE_USDC_ADDRESS,
        abi: MINTABLE_USDC_ABI,
        functionName: 'balanceOf',
        args: [address],
    });    
    let balance 
    if (data) { balance = formatEther(data) }
    return { balance, isLoading, isError, error, refetch };
};
