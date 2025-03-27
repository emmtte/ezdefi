import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { publicClient } from '@/utils/publicClient';

export const useContractEvents = (contractAddress) => {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  // Define event topics
  const EVENT_TOPICS = {
    Deposited: ethers.id("Deposited(address,uint256,uint256)"),
    Withdrawn: ethers.id("Withdrawn(address,uint256,uint256)"),
    Rebalanced: ethers.id("Rebalanced(address,uint256)")
  };

  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);
    setDebugInfo('');

    try {
      // Log connection information
      console.log('Contract Address:', contractAddress);
      console.log('Topics:', EVENT_TOPICS);

      // Verify client connection
      const chainId = await publicClient.getChainId();
      console.log('Chain ID:', chainId);

      const eventSignatures = [
        {
          eventName: 'Deposited',
          topic: EVENT_TOPICS.Deposited,
          fields: ['user', 'amount', 'shares']
        },
        {
          eventName: 'Withdrawn',
          topic: EVENT_TOPICS.Withdrawn,
          fields: ['user', 'amount', 'shares']
        },
        {
          eventName: 'Rebalanced',
          topic: EVENT_TOPICS.Rebalanced,
          fields: ['newVault', 'amount']
        }
      ];

      // Fetch logs for each event
      const allLogs = await Promise.all(
        eventSignatures.map(async (eventSig) => {
          try {
            console.log(`Fetching logs for ${eventSig.eventName}`);

            const logs = await publicClient.getLogs({
              address: contractAddress,
              topics: [eventSig.topic],
              fromBlock: 0n,
              toBlock: 'latest'
            });

            console.log(`Number of logs for ${eventSig.eventName}:`, logs.length);

            // Add debug information
            if (logs.length === 0) {
              setDebugInfo(prev => prev + `\nNo logs found for ${eventSig.eventName}`);
            }

            // Transform logs
            return logs.map(log => {
              console.log(`Log for ${eventSig.eventName}:`, log);
              return {
                eventName: eventSig.eventName,
                blockNumber: log.blockNumber,
                transactionHash: log.transactionHash,
                fields: eventSig.fields,
                ...log.args
              };
            });
          } catch (error) {
            console.error(`Error for ${eventSig.eventName}:`, error);
            setDebugInfo(prev => prev + `\nError for ${eventSig.eventName}: ${error.message}`);
            return [];
          }
        })
      );

      // Combine and sort logs
      const combinedEvents = allLogs.flat().sort((a, b) => 
        Number(b.blockNumber || 0) - Number(a.blockNumber || 0)
      );

      setEvents(combinedEvents);

      // If no events found
      if (combinedEvents.length === 0) {
        setDebugInfo('No events found. Please check:\n- Contract address\n- Network\n- Event topics');
      }
    } catch (error) {
      console.error('Global error:', error);
      setError(error.message);
      setDebugInfo(`Global error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch events on component mount
  useEffect(() => {
    fetchEvents();
  }, [contractAddress]);

  // Return all necessary states and the refresh function
  return {
    events,
    error,
    isLoading,
    debugInfo,
    fetchEvents
  };
};