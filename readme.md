# Installation
```
sudo dnf install chromium
sudo dnf install nodejs
```

# Hardhat
## Configuration de Metamask
```
Nom du réseau : Hardhat
URL par défaut du RPC : 127.0.0.1:8545
ID de chaîne : 31337
Symbole de la devise : ETHardhat
```

## Installation
```
npm install dotenv
npm install @openzeppelin/contracts
npm install hardhat
npx hardhat init
```

## Démarrage et deployement
```
npx hardhat node
npx hardhat node --fork https://eth-mainnet.g.alchemy.com/v2/VXvc9IbtUntO_27RgSW1xxOvNIpZh5zV
npx hardhat ignition deploy ignition/modules/EZdefi.js --network localhost
```

## Nettoyage
```
npx hardhat clean
rm -rf ignition/deployments
rm -rf ignition/cache
```

## Deploy
```
node scripts/test_chain.js
npx hardhat ignition deploy ignition/modules/EZdefi.js --network localhost
```

## Scripts
```
npx hardhat run scripts/aToken.js --network localhost
npx hardhat run scripts/cToken.js --network localhost
npx hardhat run scripts/ezToken.js --network localhost
```

## Test et coverage
```
npx hardhat test test/EzTest.js 
npx hardhat coverage --config hardhat.config.default.js
```

```


npx hardhat test test/ezTest.js
avant de lancer le coverage : 

modifier hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
module.exports = { solidity: "0.8.28" };

npx hardhat coverage test/ezTest.js
```

# React
## Installation
```
npx create-next-app@14 . # Ne pas oublier le point
=> No/Yes/Yes/No/Yes/No
npm install @rainbow-me/rainbowkit wagmi viem@2.x @tanstack/react-query
(npm install @radix-ui/react-icons) //optionel
=> slate
npx shadcn@latest init (use legacy peer deep)
npx shadcn@latest add alert badge button card input label tabs
npm run dev
```

## Deployer
``` 
npm run build
npm intall pretty pino
```

## A rendre
```
30 minutes:
-présentation brève du projet
-lancement commande test coverage en live (80% mini)
-déploiement smart contracts sur testnet en live
-démo dapp sur testnet ou localhost en live
et les 20 min de questions du jury.
```
