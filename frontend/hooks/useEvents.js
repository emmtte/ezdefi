import { useState, useEffect } from 'react';
import { parseAbiItem } from 'viem';
import { publicClient } from '@/utils/publicClient';

export function useEvents({ address, eventAbi, fromBlock, toBlock = 'latest' }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    async function fetchLogs() {
      if (!address || !eventAbi || !fromBlock) {
        return;
      }

      try {
        console.log('Fetching logs with client:', {
          chainId: publicClient.chain.id,
          chainName: publicClient.chain.name
        });

        const fetchedLogs = await publicClient.getLogs({
          address: address,
          event: parseAbiItem(eventAbi),
          fromBlock: fromBlock,
          toBlock: toBlock,
        });
        setLogs(fetchedLogs);
      } catch (error) {
        console.error('Erreur lors de la récupération des logs:', error);
      }
    }

    fetchLogs();
  }, [address, eventAbi, fromBlock, toBlock]);

  return logs;
}