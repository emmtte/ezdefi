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

## Tests, deploiment et coverage
```
node scripts/test_chain.js
npx hardhat ignition deploy ignition/modules/EZdefi.js --network localhost
npx hardhat test test/EZdefi.js 
npx hardhat coverage --config hardhat.config.default.js
```

//pour tester le contrat avec un script
npx hardhat run scripts/tests_storage.js --network localhost

npx hardhat test test/voting.ts
npx hardhat coverage test/voting.ts //a mettre dans le readme

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
