import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/utils/constants'

const useOwnerCheck = (address) => {
  const [isOwner, setIsOwner] = useState(false);

  const { data: ownerAddress, isSuccess: isOwnerAddressSuccess } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'owner',
  });

  useEffect(() => {
    if (isOwnerAddressSuccess && address) {
      setIsOwner(address.toLowerCase() === ownerAddress?.toLowerCase());
    }
  }, [isOwnerAddressSuccess, address, ownerAddress]);

  return isOwner;
};

export default useOwnerCheck;