'use client';
import { useAccount } from 'wagmi';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Deposit from '@/components/Deposit';
import Deposit2 from '@/components/Deposit2';
import Withdraw from '@/components/Withdraw';
import Rebalance from '@/components/Rebalance';
import Events from '@/components/Events';
import USDC from '@/components/USDC';
import Rate from '@/components/Rate';
import Rate2 from '@/components/Rate2';
import Vaults from '@/components/Vaults';
import BalanceUSDC from '@/components/BalanceUSDC';
import USDCFaucet from '@/components/USDCFaucet';
import { useOwnerCheck } from '@/hooks/useOwnerCheck';
import { useContractEvents } from '@/hooks/useContractEvents';
import { AAVE_USDC_ADDRESS, COMPOUND_USDC_ADDRESS } from '@/utils/constants';

const EZdefi = () => {
  const { isConnected, address } = useAccount();
  const isOwner = useOwnerCheck(address);
  const events = useContractEvents();

  // Si l'utilisateur n'est pas connecté, afficher une alerte
  if (!isConnected) {
    return (
      <Alert className="bg-yellow-100 border-yellow-400">
        <AlertTitle className="font-bold">Non connecté</AlertTitle>
        <AlertDescription>Veuillez connecter votre portefeuille pour continuer</AlertDescription>
      </Alert>
    );
  }

  // Interface utilisateur standard avec seulement les composants utilisateur
  const UserInterface = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3 gap-x-0">
      <div>
        <Deposit2 />
      </div>
      <div>
        <Withdraw />
      </div>
      <div>
        <Rebalance />
      </div>
      <div className="md:col-span-3">
        <Events />
      </div>
    </div>
  );

  // Interface administrateur avec tous les outils d'administration
  const AdminInterface = () => (
    <>
      <div className="bg-blue-50 p-3 rounded-lg mb-3">
        <h1 className="text-2xl font-bold">{`Outils pour l'administrateur du contrat`}</h1>
        <p>Vous êtes connecté en tant que propriétaire du contrat.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3 gap-x-0">
        <div>
          <Vaults/>
        </div>
        <div>
          <USDC address={address} />
        </div>
        <div className="md:col-span-3">
          <Events />
        </div>
      </div>
    </>
  );


  const TestInterface = () => (
    <>
      <div className="bg-yellow-50 p-3 rounded-lg mb-3">
        <h1 className="text-2xl font-bold">Outils de tests des contrats</h1>
        <p></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3 gap-x-0">
        <div>
          <Rate2 name="A" address={AAVE_USDC_ADDRESS} />
        </div>
        <div>
          <Rate2 name="B" address={COMPOUND_USDC_ADDRESS} />
        </div>
        <div>
          <USDCFaucet address={address} />
        </div>
        <div className="md:col-span-3">
          <Events />
        </div>
      </div>
    </>
  );

  // Interface combinée pour le propriétaire avec l'ordre des onglets inversé
  const OwnerInterface = () => (
    <Tabs defaultValue="user" className="w-full">
      <TabsList className="mb-3">
        <TabsTrigger value="user">Interface utilisateur</TabsTrigger>
        <TabsTrigger value="admin">Outils administrateur</TabsTrigger>
        <TabsTrigger value="test">Outils de tests</TabsTrigger>
      </TabsList>

      <TabsContent value="user">
        <UserInterface />
      </TabsContent>

      <TabsContent value="admin">
        <AdminInterface />
      </TabsContent>

      <TabsContent value="test">
        <TestInterface />
      </TabsContent>

    </Tabs>
  );


  const Interface = () => (
    <Tabs defaultValue="user" className="w-full">
      <TabsList className="mb-3">
        <TabsTrigger value="user">Interface utilisateur</TabsTrigger>
        <TabsTrigger value="test">Outils de tests</TabsTrigger>
      </TabsList>

      <TabsContent value="user">
        <UserInterface />
      </TabsContent>

      <TabsContent value="test">
        <TestInterface />
      </TabsContent>

    </Tabs>
  );

  return isOwner ? <OwnerInterface /> : <Interface />;
};

export default EZdefi;