import { useReadContract } from 'wagmi';
import { AAVE_USDC_ABI, AAVE_USDC_ADDRESS, COMPOUND_USDC_ABI, COMPOUND_USDC_ADDRESS } from '@/utils/constants';

export const useGetRate = ({ token }) => {

  console.log("useReadContract Results: token = ", token);
  
  function getContractDetails(tokenType) {
    if (tokenType === 'cToken') {
      return { address: COMPOUND_USDC_ADDRESS, abi: COMPOUND_USDC_ABI };
    } else if (tokenType === 'aToken') {
      return { address: AAVE_USDC_ADDRESS, abi: AAVE_USDC_ABI };
    }
    return { address: null, abi: null };
  }

  const contractDetails = getContractDetails(token);
  
  const { data, isError, isLoading, refetch, error } = useReadContract({
    address: contractDetails.address,
    abi: contractDetails.abi,
    functionName: 'getInterestRate',
  });
  

  console.log("useReadContract Results:");
  console.log("  Data:", data);
  console.log("  Is Loading:", isLoading);
  console.log("  Is Error:", isError);
  console.log("  Error:", error);


  return {
    rate: data ? data.toString() : null, // Convertit le BigInt en string
    isError,
    isLoading,
    refetch,
  };
};