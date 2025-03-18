import React from 'react';
import { formatEther } from 'viem';
import { useUsdcBalance } from '@/hooks/useUsdcBalance';

export const GetBalance = ({ address }) => {
  const { balance, isLoading, isError, error } = useUsdcBalance(address);
  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {isError && <div>Error: {error}</div>}
      {balance !== undefined && <div>Balance: {formatEther(balance)} ETH</div>}
    </div>
  );
};
