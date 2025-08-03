import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Core, CirqaToken, MockERC20, ScholarshipManager, ScoreManager } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ScholarshipWithdrawal", function () {
  let owner: HardhatEthersSigner, student1: HardhatEthersSigner, student2: HardhatEthersSigner, investor: HardhatEthersSigner;
  let cirqaToken: CirqaToken;
  let core: Core;
  let scholarshipManager: ScholarshipManager;
  let scoreManager: ScoreManager;
  let asset1: MockERC20;

  async function deployFundedScholarshipFixture() {
    [owner, student1, student2, investor] = await ethers.getSigners();

    // Deploy USDT Mock
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    asset1 = await MockERC20Factory.deploy("Test Asset 1", "TA1", 6);
    await asset1.waitForDeployment();

    // Deploy CirqaToken
    const CirqaTokenFactory = await ethers.getContractFactory("CirqaToken");
    cirqaToken = await CirqaTokenFactory.deploy();
    await cirqaToken.waitForDeployment();

    // Deploy Core contract
    const CoreFactory = await ethers.getContractFactory("Core");
    core = await CoreFactory.deploy(await cirqaToken.getAddress(), await asset1.getAddress());
    await core.waitForDeployment();

    // Deploy ScholarshipManager
    const ScholarshipManagerFactory = await ethers.getContractFactory("ScholarshipManager");
    scholarshipManager = await ScholarshipManagerFactory.deploy();
    await scholarshipManager.waitForDeployment();

    // Deploy ScoreManager
    const ScoreManagerFactory = await ethers.getContractFactory("ScoreManager");
    scoreManager = await ScoreManagerFactory.deploy();
    await scoreManager.waitForDeployment();

    // Set up contracts
    await cirqaToken.setMinter(await core.getAddress());
    await cirqaToken.setScoreManager(await scoreManager.getAddress());
    await scholarshipManager.setCoreContract(await core.getAddress());
    await scoreManager.setCoreContract(await core.getAddress());
    await scoreManager.setCirqaToken(await cirqaToken.getAddress());
    await core.setScholarshipManager(await scholarshipManager.getAddress());
    await core.setScoreManager(await scoreManager.getAddress());

    // Create and fund a scholarship
    const metadata = "ipfs://QmTestHash";
    await core.connect(student1).createScholarship(metadata);
    
    const fundAmount = ethers.parseEther("1000");
    await asset1.mint(investor.address, fundAmount);
    await asset1.connect(investor).approve(await core.getAddress(), fundAmount);
    await core.connect(investor).fundScholarship(1, fundAmount);

    return { 
      core, 
      cirqaToken, 
      scholarshipManager,
      scoreManager,
      asset1, 
      owner, 
      student1, 
      student2, 
      investor,
      fundAmount
    };
  }

  describe("Scholarship Withdrawal", function () {
    it("Should allow student to withdraw funds", async function () {
      const { core, asset1, student1, scholarshipManager, fundAmount } = await loadFixture(deployFundedScholarshipFixture);
      
      const withdrawAmount = ethers.parseEther("300");
      const protocolFee = await core.protocolFee();
      const feeAmount = (withdrawAmount * protocolFee) / 10000n;
      const expectedAmount = withdrawAmount - feeAmount;
      
      const tx = await core.connect(student1).withdrawFunds(1, withdrawAmount);
      
      // Check that student received correct amount (minus protocol fee)
      expect(await asset1.balanceOf(student1.address)).to.equal(expectedAmount);
      
      // Check that owner received protocol fee
      expect(await asset1.balanceOf(owner.address)).to.equal(feeAmount);
      
      // Check that scholarship balance was updated
      const remainingBalance = fundAmount - withdrawAmount;
      const hasRemainingBalance = await scholarshipManager.hasEnoughBalance(1, remainingBalance);
      expect(hasRemainingBalance).to.be.true;
      
      // Check event emission
      await expect(tx)
        .to.emit(core, "FundsWithdrawn")
        .withArgs(1, student1.address, expectedAmount);
    });

    it("Should handle multiple withdrawals", async function () {
      const { core, asset1, student1, scholarshipManager, fundAmount } = await loadFixture(deployFundedScholarshipFixture);
      
      const withdrawal1 = ethers.parseEther("200");
      const withdrawal2 = ethers.parseEther("150");
      const totalWithdrawals = withdrawal1 + withdrawal2;
      
      const protocolFee = await core.protocolFee();
      const fee1 = (withdrawal1 * protocolFee) / 10000n;
      const fee2 = (withdrawal2 * protocolFee) / 10000n;
      const totalFees = fee1 + fee2;
      const expectedTotalAmount = totalWithdrawals - totalFees;
      
      await core.connect(student1).withdrawFunds(1, withdrawal1);
      await core.connect(student1).withdrawFunds(1, withdrawal2);
      
      // Check total amount received by student
      expect(await asset1.balanceOf(student1.address)).to.equal(expectedTotalAmount);
      
      // Check total fees received by owner
      expect(await asset1.balanceOf(owner.address)).to.equal(totalFees);
      
      // Check remaining balance
      const remainingBalance = fundAmount - totalWithdrawals;
      const hasRemainingBalance = await scholarshipManager.hasEnoughBalance(1, remainingBalance);
      expect(hasRemainingBalance).to.be.true;
    });

    it("Should track withdrawal history", async function () {
      const { core, student1, scholarshipManager } = await loadFixture(deployFundedScholarshipFixture);
      
      const withdrawal1 = ethers.parseEther("200");
      const withdrawal2 = ethers.parseEther("150");
      
      const protocolFee = await core.protocolFee();
      const amount1 = withdrawal1 - (withdrawal1 * protocolFee) / 10000n;
      const amount2 = withdrawal2 - (withdrawal2 * protocolFee) / 10000n;
      
      await core.connect(student1).withdrawFunds(1, withdrawal1);
      await core.connect(student1).withdrawFunds(1, withdrawal2);
      
      const [amounts, timestamps] = await scholarshipManager.getWithdrawalHistory(1);
      
      expect(amounts.length).to.equal(2);
      expect(amounts[0]).to.equal(amount1);
      expect(amounts[1]).to.equal(amount2);
      expect(timestamps.length).to.equal(2);
      expect(timestamps[0]).to.be.greaterThan(0);
      expect(timestamps[1]).to.be.greaterThan(timestamps[0]);
    });

    it("Should revert when non-student tries to withdraw", async function () {
      const { core, student2, investor } = await loadFixture(deployFundedScholarshipFixture);
      
      const withdrawAmount = ethers.parseEther("300");
      
      // Student2 (not the owner of scholarship 1)
      await expect(core.connect(student2).withdrawFunds(1, withdrawAmount))
        .to.be.revertedWith("Only student can withdraw");
        
      // Investor (not the owner of scholarship 1)
      await expect(core.connect(investor).withdrawFunds(1, withdrawAmount))
        .to.be.revertedWith("Only student can withdraw");
    });

    it("Should revert when withdrawing from non-existent scholarship", async function () {
      const { core, student1 } = await loadFixture(deployFundedScholarshipFixture);
      
      const withdrawAmount = ethers.parseEther("300");
      
      await expect(core.connect(student1).withdrawFunds(999, withdrawAmount))
        .to.be.revertedWith("Scholarship does not exist");
    });

    it("Should revert when insufficient balance", async function () {
      const { core, student1, fundAmount } = await loadFixture(deployFundedScholarshipFixture);
      
      const excessiveAmount = fundAmount + ethers.parseEther("1");
      
      await expect(core.connect(student1).withdrawFunds(1, excessiveAmount))
        .to.be.revertedWith("Insufficient balance");
    });

    it("Should handle zero withdrawal amount", async function () {
      const { core, student1 } = await loadFixture(deployFundedScholarshipFixture);
      
      await expect(core.connect(student1).withdrawFunds(1, 0))
        .to.not.be.reverted; // Should succeed but do nothing
    });

    it("Should handle different protocol fee rates", async function () {
      const { core, asset1, student1, owner } = await loadFixture(deployFundedScholarshipFixture);
      
      // Set protocol fee to 5% (500 basis points)
      await core.setProtocolFee(500);
      
      const withdrawAmount = ethers.parseEther("1000");
      const expectedFee = (withdrawAmount * 500n) / 10000n; // 5%
      const expectedAmount = withdrawAmount - expectedFee;
      
      await core.connect(student1).withdrawFunds(1, withdrawAmount);
      
      expect(await asset1.balanceOf(student1.address)).to.equal(expectedAmount);
      expect(await asset1.balanceOf(owner.address)).to.equal(expectedFee);
    });

    it("Should handle maximum protocol fee", async function () {
      const { core, asset1, student1, owner } = await loadFixture(deployFundedScholarshipFixture);
      
      // Set protocol fee to maximum 10% (1000 basis points)
      await core.setProtocolFee(1000);
      
      const withdrawAmount = ethers.parseEther("500");
      const expectedFee = (withdrawAmount * 1000n) / 10000n; // 10%
      const expectedAmount = withdrawAmount - expectedFee;
      
      await core.connect(student1).withdrawFunds(1, withdrawAmount);
      
      expect(await asset1.balanceOf(student1.address)).to.equal(expectedAmount);
      expect(await asset1.balanceOf(owner.address)).to.equal(expectedFee);
    });

    it("Should handle zero protocol fee", async function () {
      const { core, asset1, student1, owner } = await loadFixture(deployFundedScholarshipFixture);
      
      // Set protocol fee to 0%
      await core.setProtocolFee(0);
      
      const withdrawAmount = ethers.parseEther("500");
      
      await core.connect(student1).withdrawFunds(1, withdrawAmount);
      
      // Student should receive full amount
      expect(await asset1.balanceOf(student1.address)).to.equal(withdrawAmount);
      // Owner should receive no fee
      expect(await asset1.balanceOf(owner.address)).to.equal(0);
    });

    it("Should work after additional funding", async function () {
      const { core, asset1, student1, investor, scholarshipManager, fundAmount } = await loadFixture(deployFundedScholarshipFixture);
      
      // Add more funding
      const additionalFunding = ethers.parseEther("500");
      await asset1.mint(investor.address, additionalFunding);
      await asset1.connect(investor).approve(await core.getAddress(), additionalFunding);
      await core.connect(investor).fundScholarship(1, additionalFunding);
      
      const totalAvailable = fundAmount + additionalFunding;
      const withdrawAmount = ethers.parseEther("800");
      
      await core.connect(student1).withdrawFunds(1, withdrawAmount);
      
      // Should be able to withdraw from increased balance
      const protocolFee = await core.protocolFee();
      const feeAmount = (withdrawAmount * protocolFee) / 10000n;
      const expectedAmount = withdrawAmount - feeAmount;
      
      expect(await asset1.balanceOf(student1.address)).to.equal(expectedAmount);
      
      // Check remaining balance
      const remainingBalance = totalAvailable - withdrawAmount;
      const hasRemainingBalance = await scholarshipManager.hasEnoughBalance(1, remainingBalance);
      expect(hasRemainingBalance).to.be.true;
    });
  });
});