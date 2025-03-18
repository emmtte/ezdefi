import { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { parseAbiItem } from 'viem';

export function useEvents({ address, eventAbi, fromBlock, toBlock = 'latest' }) {
  const [logs, setLogs] = useState([]);
  const publicClient = usePublicClient();

  useEffect(() => {
    async function fetchLogs() {
      if (!publicClient || !address || !eventAbi || !fromBlock) {
        return;
      }

      try {
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
  }, [publicClient, address, eventAbi, fromBlock, toBlock]);

  return logs;
}

