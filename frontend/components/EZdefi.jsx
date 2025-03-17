'use client';
import { useAccount } from 'wagmi'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import GetBalance from '@/components/GetBalance'
import Deposit from '@/components/Deposit'
import Withdraw from '@/components/Withdraw'
import Rebalance from '@/components/Rebalance';
import { useOwnerCheck, useContractEvents } from '@/hooks';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/utils/constants'
import Events from '@/components/Events'

const EZdefi = () => {
  const { isConnected, address } = useAccount()
  const isOwner = useOwnerCheck(address)
  const events = useContractEvents()
  const { data: balance, isPending, error, refetch } = useReadContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'balanceOf', account: address })

 
    return (
        <>
        {isConnected ? (
            <div>
            {isOwner ? (
                // Composants spécifiques pour le propriétaire
                <div>
                <h1 className='text-2xl font-bold mb-2'>Outils de maintenance</h1>
                <p>Vous êtes connecté en tant que propriétaire du contrat.</p>
                <GetBalance balance={balance} isPending={isPending} error={error} />
                <Deposit refetch={refetch} events={events} />
                <Withdraw refetch={refetch} events={events} />
                <Rebalance refetch={refetch} events={events} />
                <Events events={events} />
                </div>
            ) : (
                <div>
                <GetBalance balance={balance} isPending={isPending} error={error} />
                <Deposit refetch={refetch} events={events} />
                <Withdraw refetch={refetch} events={events} />
                <Rebalance refetch={refetch} events={events} />
                <Events events={events} />
                </div>
            )}
            </div>
        ) : (
            <Alert className='bg-yellow-100'>
            <AlertTitle>Non connecté</AlertTitle>
            <AlertDescription>Veuillez connecter votre portefeuille pour continuer</AlertDescription>
            </Alert>
        )}
        </>
    );
    }

export default EZdefi