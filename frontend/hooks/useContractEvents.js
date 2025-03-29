import { useState, useEffect } from 'react';
import { publicClient } from '@/utils/publicClient';

// Définition des ABI des événements
const eventsAbi = [
  {
    type: 'event',
    name: 'Deposited',
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'shares', type: 'uint256' }
    ]
  },
  {
    type: 'event',
    name: 'Withdrawn',
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'shares', type: 'uint256' }
    ]
  },
  {
    type: 'event',
    name: 'Rebalanced',
    inputs: [
      { indexed: true, name: 'newVault', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' }
    ]
  }
];

/**
 * Hook personnalisé pour récupérer les événements d'un contrat
 * @param {string} contractAddress - Adresse du contrat
 * @param {string|number} fromBlock - Bloc de départ pour la recherche (default: 'earliest')
 * @param {number} refreshKey - Clé pour déclencher une actualisation
 * @returns {Object} - Objet contenant les événements, l'état de chargement et les erreurs
 */
export const useContractEvents = (contractAddress, fromBlock = 'earliest', refreshKey = 0) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Obtenir les logs pour chaque type d'événement
        const depositLogs = await publicClient.getLogs({
          address: contractAddress,
          event: eventsAbi[0],
          fromBlock,
        });

        const withdrawLogs = await publicClient.getLogs({
          address: contractAddress,
          event: eventsAbi[1],
          fromBlock,
        });

        const rebalanceLogs = await publicClient.getLogs({
          address: contractAddress,
          event: eventsAbi[2],
          fromBlock,
        });

        // Combiner et trier les logs par bloc et index
        const allLogs = [...depositLogs, ...withdrawLogs, ...rebalanceLogs]
          .sort((a, b) => {
            // Comparer les BigInt correctement
            if (a.blockNumber === b.blockNumber) {
              // Comparaison des logIndex en tant que BigInt
              return a.logIndex > b.logIndex ? 1 : -1;
            }
            // Comparaison des blockNumber en tant que BigInt
            return b.blockNumber > a.blockNumber ? 1 : -1;
          });

        setEvents(allLogs);
        setLoading(false);
      } catch (err) {
        console.error("Erreur lors de la récupération des événements:", err);
        setError(err);
        setLoading(false);
      }
    };

    fetchEvents();
  }, [contractAddress, fromBlock, refreshKey]); // Ajout de refreshKey comme dépendance

  return { events, loading, error };
};

export default useContractEvents;