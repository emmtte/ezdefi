import { sepolia as sepoliaChain } from 'wagmi/chains';

export const sepolia = {
  ...sepoliaChain,
  rpcUrls: {
    ...sepoliaChain.rpcUrls,
    default: { http: ['/api/proxy'] }, // Utilisez votre proxy
  },
};