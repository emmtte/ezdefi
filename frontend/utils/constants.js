// constants.js
// Choisissez explicitement la chaîne que vous voulez utiliser
const CHAIN_FOLDER = 'chain-31337'; // Pour Hardhat
// const CHAIN_FOLDER = 'chain-11155111'; // Pour Sepolia

// Pour les fichiers avec des # dans leur nom, nous devons utiliser des chemins fixes
// Pour chain-31337 (Hardhat)
import YieldOptimizerHardhat from '../../backend/ignition/deployments/chain-31337/artifacts/EZdefi#YieldOptimizer.json';
import AaveUSDCHardhat from '../../backend/ignition/deployments/chain-31337/artifacts/EZdefi#aaveUSDC.json';
import CompoundUSDCHardhat from '../../backend/ignition/deployments/chain-31337/artifacts/EZdefi#compoundUSDC.json';
import MintableUSDCHardhat from '../../backend/ignition/deployments/chain-31337/artifacts/EZdefi#MintableUSDC.json';
import deployedAddressesHardhat from '../../backend/ignition/deployments/chain-31337/deployed_addresses.json';

// Pour chain-11155111 (Sepolia)
import YieldOptimizerSepolia from '../../backend/ignition/deployments/chain-11155111/artifacts/EZdefi#YieldOptimizer.json';
import AaveUSDCSepolia from '../../backend/ignition/deployments/chain-11155111/artifacts/EZdefi#aaveUSDC.json';
import CompoundUSDCSepolia from '../../backend/ignition/deployments/chain-11155111/artifacts/EZdefi#compoundUSDC.json';
import MintableUSDCSepolia from '../../backend/ignition/deployments/chain-11155111/artifacts/EZdefi#MintableUSDC.json';
import deployedAddressesSepolia from '../../backend/ignition/deployments/chain-11155111/deployed_addresses.json';

// Sélectionnez les ABI selon la chaîne choisie
export const YIELD_OPTIMIZER_ABI = CHAIN_FOLDER === 'chain-31337' 
  ? YieldOptimizerHardhat.abi 
  : YieldOptimizerSepolia.abi;

export const AAVE_USDC_ABI = CHAIN_FOLDER === 'chain-31337' 
  ? AaveUSDCHardhat.abi 
  : AaveUSDCSepolia.abi;

export const COMPOUND_USDC_ABI = CHAIN_FOLDER === 'chain-31337' 
  ? CompoundUSDCHardhat.abi 
  : CompoundUSDCSepolia.abi;

export const MINTABLE_USDC_ABI = CHAIN_FOLDER === 'chain-31337' 
  ? MintableUSDCHardhat.abi 
  : MintableUSDCSepolia.abi;

// Sélectionnez les adresses selon la chaîne choisie
const deployedAddresses = CHAIN_FOLDER === 'chain-31337'
  ? deployedAddressesHardhat
  : deployedAddressesSepolia;

// Adresses des contrats
export const MINTABLE_USDC_ADDRESS = deployedAddresses['EZdefi#MintableUSDC'];
export const AAVE_USDC_ADDRESS = deployedAddresses['EZdefi#aaveUSDC'];
export const COMPOUND_USDC_ADDRESS = deployedAddresses['EZdefi#compoundUSDC'];
export const YIELD_OPTIMIZER_ADDRESS = deployedAddresses['EZdefi#YieldOptimizer'];