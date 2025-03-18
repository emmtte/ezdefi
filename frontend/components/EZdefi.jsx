'use client';
import { useAccount } from 'wagmi'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import GetBalance from '@/components/GetBalance'
import Deposit from '@/components/Deposit'
import Withdraw from '@/components/Withdraw'
import Rebalance from '@/components/Rebalance';
import SetRate from '@/components/SetRate';
import GetRate from '@/components/GetRate';
import Events from '@/components/Events';
import { useOwnerCheck } from '@/hooks/useOwnerCheck';
import { useContractEvents } from '@/hooks/useContractEvents';


const EZdefi = () => {
  const { isConnected, address } = useAccount()
  const isOwner = useOwnerCheck(address)
  const events = useContractEvents()
  //const { data: balance, isPending, error, refetch } = useReadContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'balanceOf', account: address })

 //<GetRate address={AAVE_USDC_ADDRESS} abi={AAVE_USDC_ABI} refetch={refetch} />
 //<GetRate address={COMPOUND_USDC_ADDRESS} abi={ COMPOUND_USDC_ABI} refetch={refetch} />
 //<GetBalance isLoading={isLoading} error={error} />
 return (
        <>
        {isConnected ? (
            <div>
            {isOwner ? (
                // Composants spécifiques pour le propriétaire
                <div>
                <h1 className='text-2xl font-bold mb-2'>Outils de maintenance</h1>
                <p>Vous êtes connecté en tant que propriétaire du contrat.</p>
                <GetBalance address={address}/>
                <ul> 
                    <li> <GetRate token='aToken'/> <SetRate token='aToken'/> </li>
                    <li> <GetRate token='cToken'/> <SetRate token='cToken'/> </li>
                </ul>
                <Deposit/>
                <Withdraw />
                <Rebalance />
                <Events/>
                </div>
            ) : (
                <div>
                <GetBalance address={address}/>
                <Deposit />
                <Withdraw />
                <Rebalance />
                <Events />
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