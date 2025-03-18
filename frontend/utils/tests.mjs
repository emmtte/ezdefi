import { ethers } from 'ethers';
import { AAVE_USDC_ABI, AAVE_USDC_ADDRESS, COMPOUND_USDC_ABI, COMPOUND_USDC_ADDRESS } from './constants.js';
// Configurer le provider pour Hardhat localhost
const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');

// Pour le développement local, vous pouvez utiliser un des comptes Hardhat
// Hardhat fournit 20 comptes de test avec des ETH préchargés
const accounts = await provider.listAccounts();
const signer = provider.getSigner(accounts[0]);

const contract = new ethers.Contract(AAVE_USDC_ADDRESS, AAVE_USDC_ABI, signer);
const test = await contract.getInterestRate();
console.log("test", test.toString());