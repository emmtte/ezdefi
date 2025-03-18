import { useGetRate } from '@/hooks/useGetRate';

export const GetRate = () => {
  const { interestRate, isLoading, isError, error, refetch } = useGetRate(token);

  if (isLoading) {
    return <p>Chargement du taux d'intérêt...</p>;
  }

  if (isError) {
    return <p>Erreur lors de la récupération du taux d'intérêt.</p>;
  }

  return (
    <div>
      <p>Taux d'intérêt actuel : {interestRate}%</p>
      <button onClick={refetch}>Rafraîchir le taux d'intérêt</button>
    </div>
  );
};
