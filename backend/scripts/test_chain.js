const hre = require("hardhat");

async function main() {
    const network = await hre.ethers.provider.getNetwork();
    console.log("Network:", network);

    const chainId = hre.network.config.chainId;
    console.log("Chain ID:", chainId);

    const blockNumber = await hre.ethers.provider.getBlockNumber();
    console.log("Block Number:", blockNumber);
}

main();