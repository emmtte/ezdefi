require('dotenv').config();
import { createPublicClient, http } from 'viem'
import { sepolia, hardhat } from 'viem/chains'



let publicClient;

const RPC = process.env.NEXTPUBLICALCHEMY_RPC
console.log('Environment CHAIN:', process.env.NEXT_PUBLIC_CHAIN);

if (process.env.NEXT_PUBLIC_CHAIN === 'hardhat') {
  
  publicClient = createPublicClient({ 
    chain: hardhat,
    transport: http()
  });
  
} else {

  publicClient = createPublicClient({ 
    chain: sepolia,
    transport: http(RPC)
  });

}


export { publicClient }