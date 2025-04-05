import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, hardhat } from 'wagmi/chains';

// Définition personnalisée de Sepolia
const customSepolia = {
  id: 11155111,
  name: 'Sepolia',
  network: 'sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Sepolia Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://eth-sepolia.g.alchemy.com/v2/VXvc9IbtUntO_27RgSW1xxOvNIpZh5zV'],
    },
    public: {
      http: ['https://eth-sepolia.g.alchemy.com/v2/VXvc9IbtUntO_27RgSW1xxOvNIpZh5zV'],
    },
  },
  blockExplorers: {
    etherscan: {
      name: 'Etherscan',
      url: 'https://sepolia.etherscan.io',
    },
    default: {
      name: 'Etherscan',
      url: 'https://sepolia.etherscan.io',
    },
  },
  testnet: true,
};

// Utilisation simple de la configuration par défaut sans transports personnalisés
export const config = getDefaultConfig({
  appName: 'EZdefi',
  projectId: 'd3f86633ab6d1114bb1c18f0fdfbf72c',
  chains: [mainnet, customSepolia, hardhat],
  ssr: true,
});