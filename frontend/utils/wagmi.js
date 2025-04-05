import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  hardhat
} from 'wagmi/chains';
import { sepolia } from './sepolia.js';
import { http } from 'viem';


export const config = getDefaultConfig({
    appName: 'EZdefi',
    projectId: 'd3f86633ab6d1114bb1c18f0fdfbf72c',
    chains: [sepolia, hardhat],
    ssr: true, // If your dApp uses server side rendering (SSR)
    transports: {
      [sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/VXvc9IbtUntO_27RgSW1xxOvNIpZh5zV'),
      [hardhat.id]: http(),
    }
  });