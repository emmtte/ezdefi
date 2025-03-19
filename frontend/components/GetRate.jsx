'use client';
import { useGetRate } from '@/hooks/useGetRate';

const GetRate = ({token}) => {
  const { rate, isLoading, isError, error, refetch } = useGetRate({token});

  if (isLoading) {
    return <p>Chargement du taux d'intérêt...</p>;
  }

  if (isError) {
    return <p>Erreur lors de la récupération du taux d'intérêt.{error.message}</p>;
  }

  return (
    <div>
      <p>Taux d'intérêt actuel : {rate}%</p>
      {/*<button onClick={refetch}>Rafraîchir le taux d'intérêt</button>*/}
    </div>
  );
};

export default GetRate