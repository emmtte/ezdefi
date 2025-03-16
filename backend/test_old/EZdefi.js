const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EZdefi", function () {
    let EZdefi, ezdefi, MockERC20, usdc, MockAaveLendingPool, aave, MockCompoundCToken, compound, owner, addr1, addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        usdc = await ethers.deployContract("MockERC20", ["USD Coin", "USDC", 6]);
        await usdc.waitForDeployment();

        aave = await ethers.deployContract("MockAaveLendingPool");
        await aave.waitForDeployment();

        compound = await ethers.deployContract("MockCompoundCToken", [usdc.target]);
        await compound.waitForDeployment();

        ezdefi = await ethers.deployContract("EZdefi", [
            usdc.target,
            aave.target,
            compound.target,
        ]);
        await ezdefi.waitForDeployment();

        await aave.setLiquidityRate(usdc.target, 100);
        await compound.setRate(90);

        await usdc.mint(owner.address, 1000000);
        await usdc.approve(ezdefi.target, 1000000);
    });

    describe.skip("Déploiement et initialisation", function () {
        it("Devrait déployer les mocks et EZdefi correctement", async function () {
            expect(await ezdefi.usdc()).to.equal(usdc.target);
            expect(await ezdefi.aave()).to.equal(aave.target);
            expect(await ezdefi.cToken()).to.equal(compound.target);
            expect(await ezdefi.owner()).to.equal(owner.address);
        });
    });

    describe.skip("Fonctionnement de getBestProtocol", function () {
        it("Devrait retourner Aave si le taux Aave est plus élevé", async function () {
            expect(await ezdefi.getBestProtocol()).to.equal(aave.target);
        });

        it("Devrait retourner Compound si le taux Compound est plus élevé", async function () {
            await aave.setRate(80);
            await compound.setRate(110);
            expect(await ezdefi.getBestProtocol()).to.equal(compound.target);
        });
    });

    describe("Fonctionnement de allocateFunds", function () {
        it("Devrait allouer les fonds à Aave", async function () {
            await ezdefi.allocateFunds(aave.target, 100000);
            expect(await usdc.balanceOf(aave.target)).to.equal(100000);
            
        });
        
        it.skip("Devrait allouer les fonds à Compound", async function () {
            await ezdefi.allocateFunds(compound.target, 100000);
            expect(await compound.supplies(ezdefi.target)).to.equal(100000);
        });
    });
    describe.skip("Fonctionnement de retrieveFunds", function () {
        it("Devrait récupérer les fonds d'Aave", async function () {
            await ezdefi.allocateFunds(aave.target, 100000);
            await ezdefi.retrieveFunds(100000);
            expect(await usdc.balanceOf(ezdefi.target)).to.equal(100000);
        });

        it("Devrait récupérer les fonds de Compound", async function () {
            await ezdefi.allocateFunds(compound.target, 100000);
            await ezdefi.retrieveFunds(100000);
            expect(await usdc.balanceOf(ezdefi.target)).to.equal(100000);
        });
    });

    describe.skip("Fonctionnement de rebalance", function () {
        it("Devrait rééquilibrer les fonds vers Aave", async function () {
            await ezdefi.allocateFunds(compound.target, 100000);
            await ethers.provider.send("evm_increaseTime", [12 * 3600]);
            await ezdefi.rebalance();
            expect(await ezdefi.currentProtocol()).to.equal(aave.target);
            expect(await usdc.balanceOf(aave.target)).to.equal(100000);
        });

        it("Devrait rééquilibrer les fonds vers Compound", async function () {
            await aave.setRate(80);
            await compound.setRate(110);
            await ezdefi.allocateFunds(aave.target, 100000);
            await ethers.provider.send("evm_increaseTime", [12 * 3600]);
            await ezdefi.rebalance();
            expect(await ezdefi.currentProtocol()).to.equal(compound.target);
            expect(await compound.supplies(ezdefi.target)).to.equal(100000);
        });

        it("Ne devrait pas rééquilibrer si moins de 12 heures se sont écoulées", async function () {
            await ezdefi.allocateFunds(aave.target, 100000);
            await expect(ezdefi.rebalance()).to.be.revertedWith("Rebalance too soon");
        });
    });
});