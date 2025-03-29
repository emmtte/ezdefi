cd backend
npx hardhat clean
#rm -rf ignition/deployments
#rm -rf ignition/cache
npx hardhat ignition deploy ignition/modules/ezdefi.js --network sepolia
cd ..
cp -r backend/ignition/deployments/chain-11155111/artifacts/EZdefi*.json frontend/contracts/
cp -r backend/ignition/deployments/chain-11155111/deployed_addresses.json frontend/contracts/
cd frontend
echo "NEXT_PUBLIC_CHAIN='sepolia'" > .env