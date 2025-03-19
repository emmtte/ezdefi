import { useReadContract } from 'wagmi';
import { AAVE_USDC_ABI } from '@/utils/constants';

export const useGetRate = ({ address }) => {

  console.log("useReadContract Results: token = ", address);
  
  const { data, isError, isLoading, refetch, error } = useReadContract({
    address,
    abi: AAVE_USDC_ABI,
    functionName: 'getInterestRate',
  });
  

  console.log("useReadContract Results:");
  console.log("  Data:", data);
  console.log("  Is Loading:", isLoading);
  console.log("  Is Error:", isError);
  console.log("  Error:", error);
  const rate = (Number(data) / 1000).toString();

  return {
    rate,
    isError,
    isLoading,
    refetch,
  };
};