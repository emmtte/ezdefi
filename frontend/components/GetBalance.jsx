'use client';
import React from 'react';
import { useUsdcBalance } from '@/hooks/useUsdcBalance';
import { MINTABLE_USDC_ADDRESS } from '@/utils/constants'

const GetBalance = ({ address }) => {
  const { balance, isLoading, isError, error, refetch } = useUsdcBalance({address});
  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {isError && <div>Error: {error.message}</div>}
      {balance && <div>Maximum to deposit : {balance} USDC ({MINTABLE_USDC_ADDRESS})</div>}
    </div>
  );
};

export default GetBalance