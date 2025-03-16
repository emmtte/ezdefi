const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleContract", function () {
  let SimpleContract;
  let simpleContract;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    SimpleContract = await ethers.getContractFactory("SimpleContract");
    simpleContract = await SimpleContract.deploy();

    await simpleContract.waitForDeployment();
  });

  it("Should set the initial message correctly", async function () {
    expect(await simpleContract.message()).to.equal("Hello, Hardhat!");
  });

  it("Should allow the owner to update the message", async function () {
    const newMessage = "Updated message";
    await simpleContract.updateMessage(newMessage);
    expect(await simpleContract.message()).to.equal(newMessage);
  });

  // Vous pouvez ajouter d'autres tests ici pour couvrir différents scénarios
});