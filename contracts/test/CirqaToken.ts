import { expect } from "chai";
import { ethers } from "hardhat";
import { CirqaToken } from "../typechain-types";

describe("CirqaToken", function () {
  let cirqaToken: CirqaToken;

  beforeEach(async function () {
    const CirqaTokenFactory = await ethers.getContractFactory("CirqaToken");
    cirqaToken = await CirqaTokenFactory.deploy() as CirqaToken;
    await cirqaToken.waitForDeployment();
  });

  it("Should have the correct name and symbol", async function () {
    expect(await cirqaToken.name()).to.equal("Cirqa Token");
    expect(await cirqaToken.symbol()).to.equal("CIRQA");
  });

  it("Should have zero initial total supply", async function () {
    expect(await cirqaToken.totalSupply()).to.equal(0);
  });

  it("Should allow the owner to set a minter", async function () {
    const [owner, minter] = await ethers.getSigners();
    await cirqaToken.setMinter(minter.address);
    expect(await cirqaToken.minter()).to.equal(minter.address);
  });

  it("Should allow a minter to mint tokens", async function () {
    const [owner, minter, recipient] = await ethers.getSigners();
    await cirqaToken.setMinter(minter.address);

    const amount = ethers.parseEther("1000");
    await cirqaToken.connect(minter).mint(recipient.address, amount);

    expect(await cirqaToken.balanceOf(recipient.address)).to.equal(amount);
    expect(await cirqaToken.totalSupply()).to.equal(amount);
  });

  it("Should not allow a non-minter to mint tokens", async function () {
    const [owner, nonMinter, recipient] = await ethers.getSigners();
    const amount = ethers.parseEther("1000");

    await expect(cirqaToken.connect(nonMinter).mint(recipient.address, amount))
      .to.be.revertedWith("Only the minter can mint tokens");
  });
});