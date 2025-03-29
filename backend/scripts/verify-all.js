const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

const deploymentPath = path.join(__dirname, '../ignition/deployments/chain-11155111/deployed_addresses.json');

const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));

const constructorArgs = {
  'EZdefi#MintableUSDC': [
    'USD Coin', 
    'USDC', 
    ethers.parseUnits('10000000', 18).toString()
  ],
  'EZdefi#aaveUSDC': [
    deployment['EZdefi#MintableUSDC'],
    'Aave USDC Vault',
    'aUSDC'
  ],
  'EZdefi#compoundUSDC': [
    deployment['EZdefi#MintableUSDC'],
    'Compound USDC Vault', 
    'cUSDC'
  ],
  'EZdefi#YieldOptimizer': [
    deployment['EZdefi#MintableUSDC'],
    [
      deployment['EZdefi#aaveUSDC'],
      deployment['EZdefi#compoundUSDC']
    ]
  ]
};

const argsDir = path.join(__dirname, 'verify-args');
if (!fs.existsSync(argsDir)) {
  fs.mkdirSync(argsDir);
}

Object.entries(deployment).forEach(([contractName, address]) => {
  console.log(`Vérification du contrat ${contractName} à l'adresse ${address}...`);
  
  try {
    const args = constructorArgs[contractName];
    
    if (!args) {
      console.warn(`Pas d'arguments trouvés pour ${contractName}, tentative de vérification sans arguments...`);
      execSync(`npx hardhat verify ${address} --network sepolia`, { stdio: 'inherit' });
    } else {
    
      const safeContractName = contractName.replace(/[#]/g, '-');
      const argFilePath = path.join(argsDir, `${safeContractName}-args.js`);
      
      fs.writeFileSync(
        argFilePath, 
        `module.exports = ${JSON.stringify(args, null, 2)};`
      );
      
      console.log(`Arguments sauvegardés dans: ${argFilePath}`);
      
      const command = `npx hardhat verify --constructor-args ${argFilePath} ${address} --network sepolia`;
      console.log(`Exécution de: ${command}`);
      
      execSync(command, { stdio: 'inherit' });
      console.log(`Contrat ${contractName} vérifié avec succès!`);
    }
  } catch (error) {
    console.error(`Échec de la vérification pour ${contractName}: ${error.message}`);
    
    if (error.stdout) console.log('Sortie standard:', error.stdout.toString());
    if (error.stderr) console.log('Erreur standard:', error.stderr.toString());
  }
});