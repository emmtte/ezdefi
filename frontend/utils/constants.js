import YieldOptimizerJSON from '../../backend/ignition/deployments/chain-31337/artifacts/EZdefi#YieldOptimizer.json';
import AaveUSDCJSON from '../../backend/ignition/deployments/chain-31337/artifacts/EZdefi#aaveUSDC.json';
import CompoundUSDCJSON from '../../backend/ignition/deployments/chain-31337/artifacts/EZdefi#compoundUSDC.json';
import MintableUSDCJSON from '../../backend/ignition/deployments/chain-31337/artifacts/EZdefi#MintableUSDC.json';

import deployedAddresses from '../../backend/ignition/deployments/chain-31337/deployed_addresses.json';

// ABIs des contrats
export const YIELD_OPTIMIZER_ABI = YieldOptimizerJSON.abi;
export const AAVE_USDC_ABI = AaveUSDCJSON.abi;
export const COMPOUND_USDC_ABI = CompoundUSDCJSON.abi;
export const MINTABLE_USDC_ABI = MintableUSDCJSON.abi;

// Adresses des contrats
export const MINTABLE_USDC_ADDRESS = deployedAddresses['EZdefi#MintableUSDC'];
export const AAVE_USDC_ADDRESS = deployedAddresses['EZdefi#aaveUSDC'];
export const COMPOUND_USDC_ADDRESS = deployedAddresses['EZdefi#compoundUSDC'];
export const YIELD_OPTIMIZER_ADDRESS = deployedAddresses['EZdefi#YieldOptimizer'];
