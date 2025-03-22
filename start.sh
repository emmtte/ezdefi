#!/bin/bash
cd backend
npx hardhat node

cd backend
npx hardhat clean
rm -rf ignition/deployments
rm -rf ignition/cache
npx hardhat ignition deploy ignition/modules/EZdefi.js --network localhost
cd ..
cd frontend
npm run dev
