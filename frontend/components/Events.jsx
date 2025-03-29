'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { YIELD_OPTIMIZER_ADDRESS } from '@/utils/constants';
import { formatUnits } from 'viem';
import { useContractEvents } from '@/hooks/useContractEvents';
import { RefreshCw } from 'lucide-react';

// Composant d'affichage des événements
const EventsComponent = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [displayCount, setDisplayCount] = useState(10);
  const { events, loading, error } = useContractEvents(YIELD_OPTIMIZER_ADDRESS, 'earliest', refreshKey);

  // Fonction pour rafraîchir les données
  const handleRefresh = useCallback(() => {
    setRefreshKey(prevKey => prevKey + 1);
  }, []);

  if (loading) return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Historique des événements</h2>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>
      <p className="text-center py-8">Chargement des événements...</p>
    </div>
  );
  
  if (error) return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Historique des événements</h2>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>
      <div className="text-center py-8 text-red-500">
        Erreur lors du chargement des événements: {error.message}
      </div>
    </div>
  );

  const formatAmount = (amount) => {
    return formatUnits(amount, 18); // Ajustez la décimale selon votre token
  };

  const getEventDetails = (log) => {
    try {
      const eventName = log.eventName;
      
      switch (eventName) {
        case 'Deposited':
          return {
            title: "Dépôt",
            textColor: "text-green-600",
            content: (
              <>
                <p><span className="font-semibold">Utilisateur:</span> {log.args.user}</p>
                <p><span className="font-semibold">Montant:</span> {formatAmount(log.args.amount)} USDC</p>
                <p><span className="font-semibold">Parts:</span> {formatAmount(log.args.shares)} EZD</p>
              </>
            )
          };
        case 'Withdrawn':
          return {
            title: "Retrait",
            textColor: "text-red-600",
            content: (
              <>
                <p><span className="font-semibold">Utilisateur:</span> {log.args.user}</p>
                <p><span className="font-semibold">Montant:</span> {formatAmount(log.args.amount)} USDC</p>
                <p><span className="font-semibold">Parts brûlées:</span> {formatAmount(log.args.shares)} EZD</p>
              </>
            )
          };
        case 'Rebalanced':
          return {
            title: "Rééquilibrage",
            textColor: "text-blue-600",
            content: (
              <>
                <p><span className="font-semibold">Nouveau coffre-fort:</span> {log.args.newVault}</p>
                <p><span className="font-semibold">Montant transféré:</span> {formatAmount(log.args.amount)} USDC</p>
              </>
            )
          };
        default:
          return {
            title: "Événement inconnu",
            textColor: "text-gray-600",
            content: <p>Type d'événement non reconnu</p>
          };
      }
    } catch (err) {
      console.error("Erreur lors du décodage de l'événement:", err);
      return {
        title: "Erreur",
        textColor: "text-gray-600",
        content: <p>Impossible de décoder cet événement</p>
      };
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Date inconnue";
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Historique des événements</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>
      
      {events.length === 0 ? (
        <p className="text-center py-8">Aucun événement trouvé</p>
      ) : (
        <>
          <div className="space-y-4">
            {events.slice(0, displayCount).map((log, index) => {
              const { title, textColor, content } = getEventDetails(log);
              
              return (
                <Card key={`${log.blockNumber}-${log.logIndex}-${index}-${refreshKey}`} className="w-full">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className={`text-sm font-medium ${textColor}`}>
                      {title}
                    </CardTitle>
                    <div className="text-xs text-gray-500">
                      Block #{log.blockNumber.toString()}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs">{content}</div>
                    {log.blockTimestamp && (
                      <div className="mt-2 text-xs text-gray-500">
                        {formatDate(log.blockTimestamp)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {displayCount < events.length && (
            <div className="text-center mt-4">
              <Button 
                variant="outline" 
                onClick={() => setDisplayCount(prev => prev + 10)}
              >
                Afficher plus d'événements
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EventsComponent;