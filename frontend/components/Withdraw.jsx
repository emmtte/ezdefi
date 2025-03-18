'use client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAccount } from 'wagmi';
import { useWithdrawal } from '@/hooks/useWithdrawal';

const Withdraw = ({ refetch }) => {
  const { address } = useAccount();
  const { amount, setAmount, handleWithdraw, hash, error, isPending, isConfirming, isConfirmed } = useWithdrawal( address, refetch);

  return (
    <div className='mt-10'>
      <h2 className='text-2xl font-bold mb-2'>Withdraw</h2>
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
        onClick={() => handleWithdraw(amount)} // Passez le montant à la fonction
        disabled={isPending}
      >
        {isPending ? 'Withdrawing...' : 'Withdraw'}
      </Button>
    </div>
  );
};

export default Withdraw;