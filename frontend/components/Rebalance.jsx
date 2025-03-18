'use client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from './ui/label';

import { useAccount } from 'wagmi';
import { useRebalance } from '@/hooks/useRebalance';

const Rebalance = ({ refetch }) => {
  const { address } = useAccount();
  const { amount, setAmount, handleRebalance, hash, error, isPending, isConfirming, isConfirmed } = useRebalance( address, refetch);

  return (
    <div className='mt-10'>
      <h2 className='text-2xl font-bold mb-2'>Rebalance</h2>
      {hash && <div>Transaction Hash: {hash}</div>}
      {isConfirming && <div>Waiting for confirmation...</div>}
      {isConfirmed && <div>Transaction confirmed.</div>}
      {error && (
        <div>Error: {error.shortMessage || error.message}</div>
      )}
      <Label>Amount in ETH...</Label>
      <Input
        type='number'
        placeholder='Amount in ETH...'
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <Button
        className="w-full"
        onClick={() => handleRebalance(amount)}
        disabled={isPending}
      >
        {isPending ? 'Rebalancing...' : 'Rebalance'}
      </Button>
    </div>
  );
};

export default Rebalance