import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  mainnet,
  sepolia,
  hardhat
} from 'wagmi/chains';
import { http } from 'wagmi';


export const config = getDefaultConfig({
    appName: 'EZdefi',
    projectId: 'd3f86633ab6d1114bb1c18f0fdfbf72c',
    chains: [mainnet, sepolia, hardhat],
    ssr: true, // If your dApp uses server side rendering (SSR)
    transports: {
      [mainnet.id]: http('https://eth-mainnet.g.alchemy.com/v2/VXvc9IbtUntO_27RgSW1xxOvNIpZh5zV'),
      [sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/VXvc9IbtUntO_27RgSW1xxOvNIpZh5zV'),
      [hardhat.id]: http()
    }
  });