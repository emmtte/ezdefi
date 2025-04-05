import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  mainnet,
  sepolia,
  hardhat
} from 'wagmi/chains';

//2 nouvelles lignes
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';

export const config = getDefaultConfig({
    appName: 'EZdefi',
    projectId: 'd3f86633ab6d1114bb1c18f0fdfbf72c',
    chains: [mainnet, sepolia, hardhat],
    ssr: true, // If your dApp uses server side rendering (SSR)
  //1 nouvelle ligne
    providers: [
    alchemyProvider({ apiKey: 'VXvc9IbtUntO_27RgSW1xxOvNIpZh5zV' }),
    publicProvider()
  ]
});
  