import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { CirqaProtocol, CirqaToken, MockERC20 } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ScholarshipWithdrawal", function () {
  let owner: HardhatEthersSigner, student: HardhatEthersSigner, investor: HardhatEthersSigner;
  let cirqaToken: CirqaToken;
  let protocol: CirqaProtocol;
  let asset1: MockERC20;

  async function deployScholarshipFixture() {
    [owner, student, investor] = await ethers.getSigners();

    // Deploy USDT Mock
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    asset1 = await MockERC20Factory.deploy("Test Asset 1", "TA1", 6);
    await asset1.waitForDeployment();

    // Deploy CirqaToken
    const CirqaTokenFactory = await ethers.getContractFactory("CirqaToken");
    cirqaToken = await CirqaTokenFactory.deploy();
    await cirqaToken.waitForDeployment();

    // Deploy CirqaProtocol
    const CirqaProtocolFactory = await ethers.getContractFactory("CirqaProtocol");
    protocol = await CirqaProtocolFactory.deploy(await cirqaToken.getAddress(), await asset1.getAddress());
    await protocol.waitForDeployment();

    // Set minter
    await cirqaToken.setMinter(await protocol.getAddress());

    // Create a scholarship
    await protocol.connect(student).createScholarship("ipfs://QmTest");

    // Fund the scholarship
    const fundAmount = ethers.parseEther("1000"); // 1000 tokens
    await asset1.mint(investor.address, fundAmount);
    await asset1.connect(investor).approve(await protocol.getAddress(), fundAmount);
    await protocol.connect(investor).fundScholarship(1, fundAmount);

    return { protocol, cirqaToken, asset1, owner, student, investor, fundAmount };
  }

  describe("Withdrawal Operations", function () {
    it("Should allow student to withdraw funds", async function () {
      const { protocol, asset1, student, fundAmount } = await loadFixture(deployScholarshipFixture);
      const withdrawAmount = ethers.parseEther("500"); // 500 tokens

      const balanceBefore = await asset1.balanceOf(student.address);

      await expect(protocol.connect(student).withdrawFunds(1, withdrawAmount))
        .to.emit(protocol, "FundsWithdrawn")
        .withArgs(1, student.address, withdrawAmount);

      const balanceAfter = await asset1.balanceOf(student.address);
      expect(balanceAfter - balanceBefore).to.equal(withdrawAmount);

      const scholarship = await protocol.scholarships(1);
      expect(scholarship.balance).to.equal(fundAmount - withdrawAmount);
    });

    it("Should not allow withdrawal more than balance", async function () {
      const { protocol, student, fundAmount } = await loadFixture(deployScholarshipFixture);
      const withdrawAmount = fundAmount + 1n; // Try to withdraw more than funded

      await expect(protocol.connect(student).withdrawFunds(1, withdrawAmount))
        .to.be.revertedWith("Insufficient balance");
    });

    it("Should not allow non-student to withdraw", async function () {
      const { protocol, investor } = await loadFixture(deployScholarshipFixture);
      const withdrawAmount = ethers.parseEther("100");

      await expect(protocol.connect(investor).withdrawFunds(1, withdrawAmount))
        .to.be.revertedWith("Only student can withdraw");
    });

    it("Should not allow withdrawal from non-existent scholarship", async function () {
      const { protocol, student } = await loadFixture(deployScholarshipFixture);
      const withdrawAmount = ethers.parseEther("100");

      await expect(protocol.connect(student).withdrawFunds(999, withdrawAmount))
        .to.be.revertedWith("Scholarship does not exist");
    });

    it("Should allow multiple partial withdrawals", async function () {
      const { protocol, asset1, student, fundAmount } = await loadFixture(deployScholarshipFixture);
      const withdrawal1 = ethers.parseEther("300");
      const withdrawal2 = ethers.parseEther("200");

      await protocol.connect(student).withdrawFunds(1, withdrawal1);
      await protocol.connect(student).withdrawFunds(1, withdrawal2);

      const scholarship = await protocol.scholarships(1);
      expect(scholarship.balance).to.equal(fundAmount - withdrawal1 - withdrawal2);

      const studentBalance = await asset1.balanceOf(student.address);
      expect(studentBalance).to.equal(withdrawal1 + withdrawal2);
    });

    it("Should allow withdrawal of entire balance", async function () {
      const { protocol, asset1, student, fundAmount } = await loadFixture(deployScholarshipFixture);

      await protocol.connect(student).withdrawFunds(1, fundAmount);

      const scholarship = await protocol.scholarships(1);
      expect(scholarship.balance).to.equal(0);

      const studentBalance = await asset1.balanceOf(student.address);
      expect(studentBalance).to.equal(fundAmount);
    });
  });
});