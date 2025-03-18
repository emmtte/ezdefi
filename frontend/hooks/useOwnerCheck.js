import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { YIELD_OPTIMIZER_ADDRESS, YIELD_OPTIMIZER_ABI } from '@/utils/constants'

export const useOwnerCheck = (address) => {
  const [isOwner, setIsOwner] = useState(false);

  const { data: ownerAddress, isSuccess: isOwnerAddressSuccess } = useReadContract({
    address: YIELD_OPTIMIZER_ADDRESS,
    abi: YIELD_OPTIMIZER_ABI,
    functionName: 'owner',
  });

  useEffect(() => {
    if (isOwnerAddressSuccess && address) {
      setIsOwner(address.toLowerCase() === ownerAddress?.toLowerCase());
    }
  }, [isOwnerAddressSuccess, address, ownerAddress]);

  return isOwner;
};
