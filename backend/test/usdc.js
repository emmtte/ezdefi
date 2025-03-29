const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("USDC Tests", function () {
  let owner, user1, user2, user3;
  let usdc;
  const initialSupply = ethers.parseUnits("1000000", 18);

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();
    const MintableUSDC = await ethers.getContractFactory("MintableUSDC");
    usdc = await MintableUSDC.deploy("USD Coin", "USDC", initialSupply);
  });
  
  it("Devrait initialiser correctement le contrat", async function () {
    expect(await usdc.name()).to.equal("USD Coin");
    expect(await usdc.symbol()).to.equal("USDC");
    expect(await usdc.totalSupply()).to.equal(initialSupply);
    expect(await usdc.owner()).to.equal(owner.address);
  });
  
  it("Permet au propriétaire d'ajouter un minter", async function () {
    await usdc.addMinter(user3.address);
    expect(await usdc.minters(user3.address)).to.be.true;
  });
  
  it("Empêche un non-propriétaire d'ajouter un minter", async function () {
    await expect(usdc.connect(user1).addMinter(user3.address)).to.be.reverted;
  });
  
  it("Permet au propriétaire de supprimer un minter", async function () {
    await usdc.addMinter(user3.address);
    expect(await usdc.minters(user3.address)).to.be.true;
    await usdc.removeMinter(user3.address);
    expect(await usdc.minters(user3.address)).to.be.false;
  });
  
  it("Empêche un non-propriétaire de supprimer un minter", async function () {
    await usdc.addMinter(user3.address);
    await expect(usdc.connect(user1).removeMinter(user3.address)).to.be.reverted;
  });
  
  it("Permet au propriétaire de minter des tokens", async function () {
    const initialSupply = await usdc.totalSupply();
    const mintAmount = ethers.parseUnits("5000", 18);
    await usdc.mint(user3.address, mintAmount);
    expect(await usdc.balanceOf(user3.address)).to.equal(mintAmount);
    expect(await usdc.totalSupply()).to.equal(initialSupply + mintAmount);
  });
  
  it("Permet à un minter autorisé de minter des tokens", async function () {
    await usdc.addMinter(user3.address);
    const initialSupply = await usdc.totalSupply();
    const mintAmount = ethers.parseUnits("5000", 18);
    await usdc.connect(user3).mint(user3.address, mintAmount);
    expect(await usdc.balanceOf(user3.address)).to.equal(mintAmount);
    expect(await usdc.totalSupply()).to.equal(initialSupply + mintAmount);
  });
  
  it("Empêche un utilisateur non autorisé de minter des tokens", async function () {
    const mintAmount = ethers.parseUnits("5000", 18);
    await expect(usdc.connect(user1).mint(user1.address, mintAmount)).to.be.revertedWith("Not authorized to mint");
  });
  
  it("Teste la fonction faucet", async function () {
    const faucetAmount = ethers.parseUnits("10000", 18);
    await usdc.connect(user1).faucet();
    expect(await usdc.balanceOf(user1.address)).to.equal(faucetAmount);
  });
  
  it("Vérifie les fonctionnalités ERC20 standards", async function () {
    await usdc.mint(user1.address, ethers.parseUnits("10000", 18));
    await usdc.mint(user2.address, ethers.parseUnits("10000", 18));

    const transferAmount = ethers.parseUnits("1000", 18);
    await usdc.connect(user1).transfer(user3.address, transferAmount);
    expect(await usdc.balanceOf(user3.address)).to.equal(transferAmount);
    
    await usdc.connect(user2).approve(user1.address, transferAmount);
    await usdc.connect(user1).transferFrom(user2.address, user3.address, transferAmount);
    expect(await usdc.balanceOf(user3.address)).to.equal(transferAmount * BigInt(2));
    expect(await usdc.allowance(user2.address, user1.address)).to.equal(0);
  });
});