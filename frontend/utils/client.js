import { createPublicClient, http } from 'viem'
import { sepolia, hardhat } from 'viem/chains'

let publicClient;

if (process.env.CHAIN === 'hardhat') {
  publicClient = createPublicClient({ 
    chain: hardhat,
    transport: http()
  })
} else {
  publicClient = createPublicClient({ 
    chain: sepolia,
    transport: http(process.env.RPC_URL_SEPOLIA)
  })
}

export { publicClient }