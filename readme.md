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
npx hardhat node
node scripts/test_chain.js
npx hardhat ignition deploy ignition/modules/EZdefi.js --network localhost
npx hardhat test test/EZdefi.js 
npx hardhat coverage test/voting.ts

## Fork
npx hardhat clean

//pour tester le contrat avec un script
npx hardhat run scripts/tests_storage.js --network localhost

npx hardhat test test/voting.ts
npx hardhat coverage test/voting.ts //a mettre dans le readme

//fork du mainnet
voir slide du cours de jeudi 15/02

frontend
npx create-next-app@latest .
=> No/No/Yes/No/Yes/No/No

npm install @rainbow-me/rainbowkit wagmi viem@2.x @tanstack/react-query

npx shadcn@latest init
=> slate

npm install @radix-ui/react-icons
npx shadcn@latest add alert badge button card input sonner
npm run dev
