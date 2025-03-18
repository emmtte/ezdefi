import { useReadContract } from 'wagmi';

export const useGetRate = ({address, abi}) => {
  const { data, isError, isLoading, refetch } = useReadContract({ address, abi, functionName: 'getRate' })
  return {
    interestRate: data ? data.toString() : null, // Convertit le BigInt en string
    isError,
    isLoading,
    refetch,
  };
};