import { useReadContract } from 'wagmi';
import { formatEther } from 'viem';

export const useBalanceOf = ({address, abi, user}) => {
    const { data, isLoading, isError, error, refetch } = useReadContract({
        address,
        abi,
        functionName: 'balanceOf',
        args: [user],
    });    
    let balance 
    if (data) { balance = formatEther(data) }
    return { balance, isLoading, isError, error, refetch };
};