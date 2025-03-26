cd backend
npx hardhat clean
#rm -rf ignition/deployments
#rm -rf ignition/cache
npx hardhat ignition deploy ignition/modules/ezdefi.js --network localhost
npx hardhat coverage
cd ..
cp -r backend/ignition/deployments/chain-31337/artifacts/EZdefi*.json frontend/contracts/
cp -r backend/ignition/deployments/chain-31337/deployed_addresses.json frontend/contracts/

