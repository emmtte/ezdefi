// hardhat:
// 
//

// sepolia 
// cp -r backend/ignition/deployments/chain-11155111/artifacts/EZdefi*.json frontend/contracts/
// cp -r backend/ignition/deployments/chain-11155111/deployed_addresses.json frontend/contracts/



import YieldOptimizerArtifact from '../contracts/EZdefi#YieldOptimizer.json';
import AaveUSDCArtifact from '../contracts/EZdefi#aaveUSDC.json';
import CompoundUSDCArtifact from '../contracts/EZdefi#compoundUSDC.json';
import MintableUSDCArtifact from '../contracts/EZdefi#MintableUSDC.json';

import deployedAddresses from '../contracts/deployed_addresses.json';

export const YIELD_OPTIMIZER_ABI = YieldOptimizerArtifact.abi;
export const AAVE_USDC_ABI = AaveUSDCArtifact.abi;
export const COMPOUND_USDC_ABI = CompoundUSDCArtifact.abi;
export const MINTABLE_USDC_ABI = MintableUSDCArtifact.abi;

export const MINTABLE_USDC_ADDRESS = deployedAddresses['EZdefi#MintableUSDC'];
export const AAVE_USDC_ADDRESS = deployedAddresses['EZdefi#aaveUSDC'];
export const COMPOUND_USDC_ADDRESS = deployedAddresses['EZdefi#compoundUSDC'];
export const YIELD_OPTIMIZER_ADDRESS = deployedAddresses['EZdefi#YieldOptimizer'];