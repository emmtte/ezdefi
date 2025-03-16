 const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
    const usdcYieldOptimizer = await hre.ethers.getContractAt("EZdefi", "0x267fB71b280FB34B278CedE84180a9A9037C941b");
    const usdc = await hre.ethers.getContractAt("IERC20", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");

    const [deployer] = await hre.ethers.getSigners();
    const whaleAddress = "0x2239ECcB0d91c0C648b36b967Bb1ef38C5b2B13D";

   // Impersonnification du compte whale
   await hre.network.provider.request({ 
    method: "hardhat_impersonateAccount", 
    params: [whaleAddress] 
});

// Option additionnelle: définir un solde élevé pour le whale si nécessaire
    await hre.network.provider.request({ method: "hardhat_setBalance", params: [whaleAddress, "0x1000000000000000000"] });


    await hre.network.provider.request({ method: "hardhat_impersonateAccount", params: [whaleAddress] });
    const whaleSigner = await hre.ethers.getSigner(whaleAddress);

    const amount = ethers.parseUnits("1", 6);

    const whaleBalance = await usdc.balanceOf(whaleAddress);
    console.log({ whaleBalance, amount });

    const transferTx = await usdc.connect(whaleSigner).transfer(deployer.address, amount);
    await transferTx.wait();
    console.log("USDC transféré avec succès.");

    const approveTx = await usdc.connect(deployer).approve(usdcYieldOptimizer.address, amount);
    await approveTx.wait();
    console.log("USDC approuvé avec succès.");
    console.log("approveTx:", approveTx); // Vérification de l'objet approveTx

    console.log("deployer.address:", deployer.address);
    console.log("usdcYieldOptimizer.address:", usdcYieldOptimizer.address); // Vérification de l'adresse du contrat

    console.log("deployer.address (avant deposit):", deployer.address); // Vérification supplémentaire

    const depositTx = await usdcYieldOptimizer.connect(deployer).deposit(amount, deployer.address);
    await depositTx.wait();
    console.log("USDC déposé avec succès.");

    const ezdzfiBalance = await usdcYieldOptimizer.balanceOf(deployer.address);
    console.log("EZDZFI balance:", ezdzfiBalance.toString());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});