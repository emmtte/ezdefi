//npx hardhat run scripts/test_aave.js
//Explication
//convertToAssets(balanceOf(user)) → Permet de voir combien valent tes parts en USDC.
//totalAssets - dépôt initial → Permet d’obtenir uniquement les intérêts accumulés.
//withdraw(intérêts, receiver, owner) → Retire juste les gains.
//redeem(shares, receiver, owner) → Retire tout (capital + intérêts).



const { ethers } = require("hardhat");

async function getAaveBalance() {

}


async function main() {
  // Déployer les contrats directement pour le test
  const TestToken = await ethers.getContractFactory("TestToken");
  const testToken = await TestToken.deploy();
  
  const AaveMock = await ethers.getContractFactory("AaveMock");
  const aaveMock = await AaveMock.deploy(testToken.getAddress());
  
  console.log("TestToken déployé à:", await testToken.getAddress());
  console.log("AaveMock déployé à:", await aaveMock.getAddress());
  
  // Obtenir le signer
  const [signer] = await ethers.getSigners();
  const signerAddress = await signer.getAddress();
  
  async function getAaveBalance() {
    let amount = await aaveMock.balanceOf(signerAddress)
    return ethers.formatEther(amount)
  }


  // Approbation des tokens
  await testToken.approve(await aaveMock.getAddress(), ethers.parseEther("100"));
  let balance = await testToken.balanceOf(signerAddress);
  console.log("Balance de départ:", ethers.formatEther(balance))
  // Dépôt
  let amount
  //amount = await aaveMock.balanceOf(signerAddress);
  console.log("Parts détenues:", await getAaveBalance());
  console.log("Depose 50:");
  await aaveMock.supply(ethers.parseEther("50"), signerAddress);
  console.log("Parts détenues:", await getAaveBalance());


  // Vérification du taux
  const rate = await aaveMock.getCurrentRate();
  console.log("Taux actuel:", rate.toString());
  
  // Vérification des parts
  console.log("Parts détenues:", await getAaveBalance());
  
  // Retrait
  await aaveMock.withdraw(ethers.parseEther("25"), signerAddress, signerAddress);
  //await aaveMock.redeem(ethers.parseEther("25"), signerAddress, signerAddress);
  // Vérification des parts après retrait
  
  console.log("Parts détenues après retrait de 25:", await getAaveBalance());

  // Vérification du retrait maximum possible
const maxWithdrawAmount = await aaveMock.maxWithdraw(signerAddress);
console.log("Montant maximum retirable avec maxWithdrawAmount:", ethers.formatEther(maxWithdrawAmount));
//await aaveMock.redeem(maxWithdrawAmount, signerAddress, signerAddress);

const maxShares = await aaveMock.maxRedeem(signerAddress);
console.log("Montant maximum retirable avec maxRedeem", ethers.formatEther(maxShares));


const maxSharesToRedeem = await aaveMock.maxRedeemAll(signerAddress);
console.log("Parts maximales pouvant être échangées :", ethers.formatEther(maxSharesToRedeem));

await ethers.provider.send("hardhat_mine", []);

// Obtenir le nombre total de shares du user
console.log("_________________________________________________");
const userShares = await aaveMock.balanceOf(signerAddress);
console.log("Shares détenues :", ethers.formatEther(userShares));

// Vérifier la valeur totale des shares en USDC
const withdrawableAssets = await aaveMock.convertToAssets(userShares);
console.log("Valeur totale des shares en USDC :", ethers.formatEther(withdrawableAssets));

// Retirer tout (y compris les intérêts accumulés)
//await aaveMock.redeem(userShares, signerAddress, signerAddress);
await ethers.provider.send("hardhat_mine", []);
await aaveMock.redeem(ethers.parseEther("24.9"), signerAddress, signerAddress);
console.log("Retrait total effectué !");
console.log("_________________________________________________");




await aaveMock.redeem(maxSharesToRedeem, signerAddress, signerAddress);
console.log("Retrait total effectué (capital + intérêts).");
//await aaveMock.redeem(ethers.parseEther("3"), signerAddress, signerAddress);



const totalAssets = await aaveMock.totalAssets();
console.log("totalAssets", ethers.formatEther(totalAssets));


//await aaveMock.convertToShares(totalAssets, signerAddress, signerAddress);
//console.log("convertToShares", ethers.formatEther(totalAssets));
//await aaveMock.convertToAssets(totalAssets, signerAddress, signerAddress);  

//console.log("on retire le maximum :", maxShares);
//await aaveMock.maxRedeemAll(maxShares, signerAddress, signerAddress);


const newShares = await aaveMock.balanceOf(signerAddress);
const interests = maxWithdrawAmount - newShares;
console.log("interests", ethers.formatEther(interests));

if (interests > 0) {
  console.log("Retrait uniquement des intérêts...");
  await aaveMock.withdraw(interests, signerAddress, signerAddress);
  console.log("Intérêts retirés en USDC !");
} else {
  console.log("Aucun intérêt à retirer.");
}

// Vérification des parts après retrait total
console.log("Parts détenues après retrait total:", await getAaveBalance());


balance = await testToken.balanceOf(signerAddress);
console.log("Balance de départ:", ethers.formatEther(balance))


}

// Exécuter le script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });