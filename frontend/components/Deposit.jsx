'use client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from './ui/label';
import { useAccount } from 'wagmi';
import { useDeposit } from '@/hooks/useDeposit';

const Deposit = ({ refetch }) => {
  const { address } = useAccount();
  const { amount, setAmount, handleDeposit, hash, error, isPending, isConfirming, isConfirmed } = useDeposit( address, refetch);

  return (
    <div className='mt-10'>
      <h2 className='text-2xl font-bold mb-2'>Deposit</h2>
      {hash && <div>Transaction Hash: {hash}</div>}
      {isConfirming && <div>Waiting for confirmation...</div>}
      {isConfirmed && <div>Transaction confirmed.</div>}
      {error && (
        <div>Error: {error.shortMessage || error.message}</div>
      )}
      <Label>Amount in USDC</Label>
      <Input
        type='number'
        placeholder='Amount in USDC'
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <Button
        className="w-full"
        onClick={() => handleDeposit(amount)} // Passez le montant à la fonction
        disabled={isPending}
      >
        {isPending ? 'Depositing...' : 'Deposit'}
      </Button>
    </div>
  );
};

export default Deposit