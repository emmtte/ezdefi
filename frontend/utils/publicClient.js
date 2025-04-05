require('dotenv').config();
import { createPublicClient, http } from 'viem'
import { hardhat } from 'viem/chains'
import { sepolia } from './sepolia.js'


let publicClient;

console.log('Environment CHAIN:', process.env.NEXT_PUBLIC_CHAIN);

if (process.env.NEXT_PUBLIC_CHAIN === 'hardhat') {
  
  publicClient = createPublicClient({ 
    chain: hardhat,
    transport: http()
  });
  
} else {

  publicClient = createPublicClient({ 
    chain: sepolia,
    transport: http('https://eth-sepolia.g.alchemy.com/v2/VXvc9IbtUntO_27RgSW1xxOvNIpZh5zV')
  });

}


export { publicClient }