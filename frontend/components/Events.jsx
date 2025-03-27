'use client';
import { YIELD_OPTIMIZER_ADDRESS } from '@/utils/constants'

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useContractEvents } from '@/hooks/useContractEvents'; // adjust the import path as needed

const Events = () => {
  const { 
    events, 
    error, 
    isLoading, 
    debugInfo, 
    fetchEvents 
  } = useContractEvents(YIELD_OPTIMIZER_ADDRESS);

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

        {debugInfo && (
          <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg mb-4 whitespace-pre-wrap">
            <strong>Informations de débogage :</strong> {debugInfo}
          </div>
        )}

        {events.length === 0 && !isLoading ? (
          <p>Aucun événement trouvé.</p>
        ) : (
          <div className="space-y-2">
            {events.map((event, index) => (
              <Card key={index} className="w-full">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold">
                      {event.eventName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Block #{event.blockNumber?.toString()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="text-xs space-y-1">
                  <pre>{JSON.stringify(event, null, 2)}</pre>
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