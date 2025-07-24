import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("CirqaToken", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployCirqaTokenFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const CirqaToken = await hre.ethers.getContractFactory("CirqaToken");
    const cirqaToken = await CirqaToken.deploy();

    return { cirqaToken, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      const { cirqaToken } = await loadFixture(deployCirqaTokenFixture);

      expect(await cirqaToken.name()).to.equal("Cirqa Token");
      expect(await cirqaToken.symbol()).to.equal("CIRQA");
    });

    it("Should set the right owner", async function () {
      const { cirqaToken, owner } = await loadFixture(deployCirqaTokenFixture);

      expect(await cirqaToken.owner()).to.equal(owner.address);
    });

    it("Should mint the entire supply to the owner", async function () {
      const { cirqaToken, owner } = await loadFixture(deployCirqaTokenFixture);

      const maxSupply = await cirqaToken.MAX_SUPPLY();
      expect(await cirqaToken.totalSupply()).to.equal(maxSupply);
      expect(await cirqaToken.balanceOf(owner.address)).to.equal(maxSupply);
    });

    it("Should have the correct max supply of 10 billion tokens", async function () {
      const { cirqaToken } = await loadFixture(deployCirqaTokenFixture);

      // 10 billion with 18 decimals
      const expectedMaxSupply = BigInt("10000000000") * BigInt(10) ** BigInt(18);
      expect(await cirqaToken.MAX_SUPPLY()).to.equal(expectedMaxSupply);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      const { cirqaToken, owner, otherAccount } = await loadFixture(deployCirqaTokenFixture);
      // Transfer 50 tokens from owner to otherAccount
      await expect(cirqaToken.transfer(otherAccount.address, 50)).to.changeTokenBalances(cirqaToken, [owner, otherAccount], [-50, 50]);
    });
  });

  describe("Burning", function () {
    it("Should allow token holders to burn their tokens", async function () {
      const { cirqaToken, owner } = await loadFixture(deployCirqaTokenFixture);

      const initialOwnerBalance = await cirqaToken.balanceOf(owner.address);
      const burnAmount = BigInt(500) * BigInt(10) ** BigInt(18);

      await cirqaToken.burn(burnAmount);

      const finalOwnerBalance = await cirqaToken.balanceOf(owner.address);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance - burnAmount);

      const totalSupply = await cirqaToken.totalSupply();
      const maxSupply = await cirqaToken.MAX_SUPPLY();
      expect(totalSupply).to.equal(maxSupply - burnAmount);
    });
  });
  
  describe("MAX_SUPPLY function", function () {
    it("Should return the correct max supply value", async function () {
      const { cirqaToken } = await loadFixture(deployCirqaTokenFixture);
      
      const expectedMaxSupply = BigInt("10000000000") * BigInt(10) ** BigInt(18);
      expect(await cirqaToken.MAX_SUPPLY()).to.equal(expectedMaxSupply);
    });
  });
});