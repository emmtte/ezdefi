import { useState, useEffect } from 'react';
import { parseAbiItem } from 'viem';
import { publicClient } from '@/utils/client';
import { YIELD_OPTIMIZER_ADDRESS, YIELD_OPTIMIZER_ABI } from '@/utils/constants'

export const useContractEvents = () => {
  
  const [events, setEvents] = useState([]);

  const getEvents = async () => {
    try {
      const depositEvents = await publicClient.getLogs({
        address: YIELD_OPTIMIZER_ADDRESS,
        event: parseAbiItem('event etherDeposited(address indexed account, uint amount)'),
        fromBlock: 7895383n,
        toBlock: 'latest',
      });

      const withdrawEvents = await publicClient.getLogs({
        address: YIELD_OPTIMIZER_ADDRESS,
        event: parseAbiItem('event etherWithdrawed(address indexed account, uint amount)'),
        fromBlock: 7895383n,
        toBlock: 'latest',
      });

      const combinedEvents = depositEvents.map((event) => ({
        type: 'Deposit',
        address: event.args.account,
        amount: event.args.amount,
        blockTimestamp: Number(event.blockTimestamp),
      })).concat(withdrawEvents.map((event) => ({
        type: 'Withdraw',
        address: event.args.account,
        amount: event.args.amount,
        blockTimestamp: Number(event.blockTimestamp),
      })));

      const sortedEvents = combinedEvents.sort((a, b) => Number(b.blockTimestamp) - Number(a.blockTimestamp));
      setEvents(sortedEvents);
    } catch (error) {
      console.error("Erreur lors de la récupération des événements :", error);
      // Gérer l'erreur ici, par exemple, afficher un message à l'utilisateur
    }
  };

  useEffect(() => {
    if (YIELD_OPTIMIZER_ADDRESS) {
      getEvents();
    }
  }, [YIELD_OPTIMIZER_ADDRESS]);

  return events;
};
