import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { hardhat, sepolia } from 'wagmi/chains';
import { defineChain } from 'viem';

const customSepolia = defineChain({
  id: 11155111,
  name: 'Sepolia',
  network: 'sepolia',
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'ETH',
    decimals: 18,
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
    default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
  },
  testnet: true,
});


export const config = getDefaultConfig({
    appName: 'EZdefi',
    projectId: 'd3f86633ab6d1114bb1c18f0fdfbf72c',
    chains: [customSepolia, hardhat],
    ssr: true, // If your dApp uses server side rendering (SSR)
  });