'use client';
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from './ui/label'
import { toast } from "sonner"

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'

import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/utils/constants'

import { useState, useEffect } from 'react'

import { parseEther } from 'viem'

import { useAccount } from 'wagmi'

const Rebalance = ({ refetch }) => {

    const [amount, setAmount] = useState('')

    const { address } = useAccount()

    const { data: hash, error, isPending, writeContract } = useWriteContract()

    const handleRebalance = async () => { 
        try {
            writeContract({
                address: CONTRACT_ADDRESS,
                abi: CONTRACT_ABI,
                functionName: 'withdraw',
                args: [parseEther(amount)],
                account: address,
            })
        }
        catch(error) {
            console.log(error)
        }
    }

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    })

    useEffect(() => {
        if (isConfirmed) {
            toast("Transaction successful.")
            setAmount('')
            refetch()
        }
    }, [isConfirmed])

    return (
        <div className='mt-10'>
            <h2 className='text-2xl font-bold mb-2'>Rebalance</h2>
            {hash && <div>Transaction Hash: {hash}</div>}
            {isConfirming && <div>Waiting for confirmation...</div>}
            {isConfirmed && <div>Transaction confirmed.</div>}
            {error && (
                <div>Error: {error.shortMessage || error.message}</div>
            )}
            <Button className="w-full" onClick={handleRebalance} disabled={isPending}>{isPending ? 'Rebalancing...' : 'Rebalance'}</Button>
        </div>
    )
}

export default Rebalance;