sudo dnf install chromium
sudo dnf install nodejs
npm install dotenv

npm install hardhat 
npx hardhat init
npx hardhat node #lance la blockchain
npx hardhat node --fork https://eth-mainnet.g.alchemy.com/v2/VXvc9IbtUntO_27RgSW1xxOvNIpZh5zV
npx hardhat ignition deploy ignition/modules/SimpleStorage.js --network localhost


npm install @openzeppelin/contracts

Metamask : 
Nom du réseau : Hardhat
URL par défaut du RPC : 127.0.0.1:8545
ID de chaîne : 31337
Symbole de la devise : ETHardhat

configurer hardhat.config.ts

//deployer le contrat en mode ignition
npx hardhat ignition deploy ignition/modules/storage.js --network localhost
npx hardhat ignition deploy ignition/modules/Lock.ts --network sepolia

## installation
npm install dotenv
npm install hardhat 
npx hardhat init
npm install @aave/core-v3


## Localhost
npx hardhat clean
rm -rf ignition/deployments
rm -rf ignition/cache

npx hardhat node
node scripts/test_chain.js
npx hardhat ignition deploy ignition/modules/EZdefi.js --network localhost
npx hardhat test test/EZdefi.js 
npx hardhat coverage --config hardhat.config.default.js

## Fork
npx hardhat clean

//pour tester le contrat avec un script
npx hardhat run scripts/tests_storage.js --network localhost

npx hardhat test test/voting.ts
npx hardhat coverage test/voting.ts //a mettre dans le readme

//fork du mainnet
voir slide du cours de jeudi 15/02


## Frontend
npx create-next-app@14 .   // ne pas oublier le point
=> No/Yes/Yes/No/Yes/No
npm install @rainbow-me/rainbowkit wagmi viem@2.x @tanstack/react-query
(npm install @radix-ui/react-icons) //optionel
=> slate
npx shadcn@latest init (use legacy peer deep)
npx shadcn@latest add alert badge button card input label
npm run dev

pour deployer 
npm run build
npm intall pretty pino

