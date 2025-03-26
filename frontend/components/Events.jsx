'use client';
import React, { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { YIELD_OPTIMIZER_ADDRESS, YIELD_OPTIMIZER_ABI } from '@/utils/constants';
import { formatEther } from 'viem';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";

const Events = () => {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [eventDefinitions, setEventDefinitions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const publicClient = usePublicClient();

  // Liste explicite des événements à récupérer
  const EVENT_NAMES = ['Deposited', 'Withdrawn', 'Rebalanced', 'Approval'];

  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Filtrer les événements de l'ABI en fonction de la liste EVENT_NAMES
      const filteredEventDefinitions = YIELD_OPTIMIZER_ABI.filter(
        item => item.type === 'event' && EVENT_NAMES.includes(item.name)
      );
      setEventDefinitions(filteredEventDefinitions);

      // Récupérer les logs pour chaque événement défini
      const allLogs = await Promise.all(
        filteredEventDefinitions.map(async (eventDef) => {
          try {
            const eventSignature = {
              inputs: eventDef.inputs.map(input => ({
                type: input.type,
                name: input.name,
                indexed: input.indexed
              })),
              name: eventDef.name,
              type: 'event'
            };

            const logs = await publicClient.getLogs({
              address: YIELD_OPTIMIZER_ADDRESS,
              event: eventSignature,
              fromBlock: 0n
            });

            // Transformer les logs avec le nom de l'événement et convertir les montants en ethers
            return logs.map(log => {
              const transformedLog = {
                eventName: eventDef.name,
                blockNumber: log.blockNumber,
                ...log.args
              };

              // Convertir les montants en ethers pour les événements avec des valeurs numériques
              if (transformedLog.amount) {
                transformedLog.amount = formatEther(transformedLog.amount);
              }
              if (transformedLog.value) {
                transformedLog.value = formatEther(transformedLog.value);
              }
              if (transformedLog.shares) {
                transformedLog.shares = formatEther(transformedLog.shares);
              }

              return transformedLog;
            });
          } catch (error) {
            console.error(`Erreur lors de la récupération des logs pour ${eventDef.name}:`, error);
            setError(`Erreur pour ${eventDef.name}: ${error.message}`);
            return [];
          }
        })
      );

      // Aplatir, combiner et trier les logs par ordre inverse (les plus récents en premier)
      const combinedEvents = allLogs.flat().sort((a, b) => 
        Number(b.blockNumber || 0) - Number(a.blockNumber || 0)
      );

      console.log('Événements combinés:', combinedEvents);
      setEvents(combinedEvents);
    } catch (error) {
      console.error('Erreur globale lors de la récupération des événements:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (publicClient) {
      fetchEvents();
    }
  }, [publicClient]);

  const getEventColor = (eventName) => {
    switch (eventName) {
      case 'Deposited': return 'text-green-600';
      case 'Withdrawn': return 'text-red-600';
      case 'Approval': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Événements du contrat</CardTitle>
        <Button 
          variant="outline" 
          size="sm"
          onClick={fetchEvents}
          disabled={isLoading}
        >
          {isLoading ? 'Chargement...' : 'Actualiser'}
        </Button>
      </CardHeader>
      
      <CardContent>
        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-4">
            <strong>Erreur :</strong> {error}
          </div>
        )}

        {eventDefinitions.length === 0 && (
          <p className="text-yellow-600">Aucune définition d'événement trouvée dans l'ABI.</p>
        )}

        {events.length === 0 && !isLoading ? (
          <p>Aucun événement trouvé.</p>
        ) : (
          <div className="space-y-2">
            {events.map((event, index) => (
              <Card key={index} className="w-full">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-semibold ${getEventColor(event.eventName)}`}>
                      {event.eventName}
                    </span>
                    {event.blockNumber && (
                      <span className="text-xs text-muted-foreground">
                        Block #{event.blockNumber.toString()}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="text-xs space-y-1">
                  {Object.entries(event)
                    .filter(([key]) => !['eventName', 'blockNumber'].includes(key))
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="font-medium">{key}:</span>
                        <span className="truncate ml-2">{value}</span>
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center items-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Events;