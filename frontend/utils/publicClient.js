require('dotenv').config();
import { createPublicClient, http } from 'viem'
import { sepolia, hardhat } from 'viem/chains'

let publicClient;

if (process.env.CHAIN === 'hardhat') {
  console.log('Attempting to connect to Hardhat');
  console.log('Environment CHAIN:', process.env.CHAIN);
  
  publicClient = createPublicClient({ 
    chain: hardhat,
    transport: http()
  });
  
  console.log('Connected chain:', publicClient.chain.name);
  console.log('Connected chain ID:', publicClient.chain.id);
  console.log('Connected chain url', publicClient.transport.url);
} else {
  publicClient = createPublicClient({ 
    chain: sepolia,
    transport: http('https://eth-sepolia.g.alchemy.com/v2/VXvc9IbtUntO_27RgSW1xxOvNIpZh5zV')
  })
}

export { publicClient }