'use client';
import { useEvents } from '@/hooks/useEvents';
import { YIELD_OPTIMIZER_ADDRESS, YIELD_OPTIMIZER_ABI } from '@/utils/constants'

const Events = () => {
  const eventAbi = 'event etherDeposited(address indexed account, uint amount)';
  const fromBlock = 7895383n;

  const depositLogs = useEvents({
    address: YIELD_OPTIMIZER_ADDRESS,
    eventAbi: eventAbi,
    fromBlock: fromBlock,
  });

  return (
    <div>
      <h2>{`Logs de l'événement etherDeposited`}</h2>
      {depositLogs.length === 0 ? (
        <p>{`Aucun log trouvé.`}</p>
      ) : (
        <ul>
          {depositLogs.map((log, index) => (
            <li key={index}>
              {/* Affichez les détails du log ici */}
              {JSON.stringify(log)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Events;