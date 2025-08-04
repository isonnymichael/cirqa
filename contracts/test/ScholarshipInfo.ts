import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Core, CirqaToken, MockERC20, ScholarshipManager, ScoreManager } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ScholarshipInfo", function () {
  let owner: HardhatEthersSigner, student1: HardhatEthersSigner, student2: HardhatEthersSigner, investor: HardhatEthersSigner;
  let cirqaToken: CirqaToken;
  let core: Core;
  let scholarshipManager: ScholarshipManager;
  let scoreManager: ScoreManager;
  let asset1: MockERC20;

  async function deployScholarshipFixture() {
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
    await scholarshipManager.setScoreManager(await scoreManager.getAddress()); // Add ScoreManager to ScholarshipManager
    await scoreManager.setCoreContract(await core.getAddress());
    await scoreManager.setCirqaToken(await cirqaToken.getAddress());
    await scoreManager.setScholarshipManager(await scholarshipManager.getAddress()); // Add ScholarshipManager to ScoreManager for auto-freeze
    await core.setScholarshipManager(await scholarshipManager.getAddress());
    await core.setScoreManager(await scoreManager.getAddress());

    // Create scholarships
    const metadata1 = "ipfs://QmTest1";
    const metadata2 = "ipfs://QmTest2";
    await core.connect(student1).createScholarship(metadata1);
    await core.connect(student2).createScholarship(metadata2);

    // Fund the first scholarship
    const fundAmount = ethers.parseUnits("1000", 6); // 1000 tokens
    await asset1.mint(investor.address, fundAmount * 2n);
    await asset1.connect(investor).approve(await core.getAddress(), fundAmount * 2n);
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
      metadata1,
      metadata2,
      fundAmount
    };
  }

  describe("Scholarship Details", function () {
    it("Should return correct scholarship details", async function () {
      const { 
        scholarshipManager, 
        student1, 
        metadata1, 
        fundAmount 
      } = await loadFixture(deployScholarshipFixture);

      const scholarships = await scholarshipManager.getScholarshipsByStudent(student1.address);
      
      expect(scholarships.length).to.equal(1);
      expect(scholarships[0]).to.equal(1); // First scholarship has token ID 1
    });

    it("Should track multiple scholarships correctly", async function () {
      const { 
        core, 
        student1, 
        student2, 
        investor,
        asset1,
        scholarshipManager,
        fundAmount 
      } = await loadFixture(deployScholarshipFixture);

      // Fund the second scholarship
      await core.connect(investor).fundScholarship(2, fundAmount);

      const student1Scholarships = await scholarshipManager.getScholarshipsByStudent(student1.address);
      const student2Scholarships = await scholarshipManager.getScholarshipsByStudent(student2.address);
      const allScholarships = await scholarshipManager.getAllScholarships();

      // Verify scholarships tracking
      expect(student1Scholarships.length).to.equal(1);
      expect(student2Scholarships.length).to.equal(1);
      expect(allScholarships.length).to.equal(2);
      expect(student1Scholarships[0]).to.equal(1);
      expect(student2Scholarships[0]).to.equal(2);
    });

    it("Should update balance after withdrawal", async function () {
      const { 
        core, 
        student1, 
        scholarshipManager,
        fundAmount 
      } = await loadFixture(deployScholarshipFixture);

      const withdrawAmount = ethers.parseUnits("300", 6);
      await core.connect(student1).withdrawFunds(1, withdrawAmount);

      // Check if student can withdraw by verifying balance
      const canWithdrawRemainingBalance = await scholarshipManager.hasEnoughBalance(1, fundAmount - withdrawAmount);
      expect(canWithdrawRemainingBalance).to.be.true;
    });

    it("Should update balance after additional funding", async function () {
      const { 
        core, 
        asset1, 
        investor, 
        scholarshipManager,
        fundAmount 
      } = await loadFixture(deployScholarshipFixture);

      const additionalFunding = ethers.parseUnits("300", 6);
      await asset1.mint(investor.address, additionalFunding);
      await asset1.connect(investor).approve(await core.getAddress(), additionalFunding);
      await core.connect(investor).fundScholarship(1, additionalFunding);

      // Check if student can withdraw the total amount (original + additional)
      const canWithdrawTotal = await scholarshipManager.hasEnoughBalance(1, fundAmount + additionalFunding);
      expect(canWithdrawTotal).to.be.true;
    });

    it("Should return scholarship data with freeze status", async function () {
      const { 
        scholarshipManager, 
        student1, 
        metadata1, 
        fundAmount 
      } = await loadFixture(deployScholarshipFixture);

      // Test unfrozen scholarship
      const [student, balance, metadata, frozen] = await scholarshipManager.getScholarshipData(1);
      expect(student).to.equal(student1.address);
      expect(balance).to.equal(fundAmount);
      expect(metadata).to.equal(metadata1);
      expect(frozen).to.be.false;

      // Test frozen scholarship
      await scholarshipManager.setFrozenStatus(1, true);
      const [, , , frozenAfter] = await scholarshipManager.getScholarshipData(1);
      expect(frozenAfter).to.be.true;
    });

    it("Should check freeze status", async function () {
      const { scholarshipManager } = await loadFixture(deployScholarshipFixture);

      // Should not be frozen initially
      expect(await scholarshipManager.isFrozen(1)).to.be.false;

      // Freeze manually
      await scholarshipManager.setFrozenStatus(1, true);
      expect(await scholarshipManager.isFrozen(1)).to.be.true;

      // Unfreeze
      await scholarshipManager.setFrozenStatus(1, false);
      expect(await scholarshipManager.isFrozen(1)).to.be.false;
    });

    it("Should test investor tracking functions", async function () {
      const { 
        core, 
        asset1, 
        investor, 
        scholarshipManager
      } = await loadFixture(deployScholarshipFixture);

      // Initially 1 investor (from fixture funding)
      const initialInvestors = await scholarshipManager.getInvestors(1);
      expect(initialInvestors.length).to.equal(1); // Already funded in fixture
      expect(initialInvestors[0]).to.equal(investor.address);
      
      const totalFunding = await scholarshipManager.getTotalFunding(1);
      const investorCount = await scholarshipManager.getInvestorCount(1);
      const contribution = await scholarshipManager.getInvestorContribution(1, investor.address);
      
      expect(totalFunding).to.equal(ethers.parseUnits("1000", 6));
      expect(investorCount).to.equal(1);
      expect(contribution).to.equal(ethers.parseUnits("1000", 6));
      
      // Add another investor
      const additionalAmount = ethers.parseUnits("500", 6);
      const [, , , , newInvestor] = await ethers.getSigners(); // Use 5th signer as new investor
      
      // Ensure scholarship is not frozen (in case previous tests affected it)
      if (await scholarshipManager.isFrozen(1)) {
        await scholarshipManager.setFrozenStatus(1, false);
      }
      
      await asset1.mint(newInvestor.address, additionalAmount);
      await asset1.connect(newInvestor).approve(await core.getAddress(), additionalAmount);
      
      await core.connect(newInvestor).fundScholarship(1, additionalAmount);
      
      // Check updated tracking
      const updatedInvestors = await scholarshipManager.getInvestors(1);
      const updatedTotalFunding = await scholarshipManager.getTotalFunding(1);
      const updatedInvestorCount = await scholarshipManager.getInvestorCount(1);
      
      expect(updatedInvestors.length).to.equal(2);
      expect(updatedInvestors).to.include(investor.address);
      expect(updatedInvestors).to.include(newInvestor.address);
      expect(updatedTotalFunding).to.equal(ethers.parseUnits("1500", 6));
      expect(updatedInvestorCount).to.equal(2);
      
      const newInvestorContribution = await scholarshipManager.getInvestorContribution(1, newInvestor.address);
      expect(newInvestorContribution).to.equal(additionalAmount);
    });

    it("Should test detailed withdrawal history functionality", async function () {
      const { 
        core, 
        student1, 
        scholarshipManager
      } = await loadFixture(deployScholarshipFixture);

      // Initially no withdrawals
      const [initialNetAmounts, initialTimestamps, initialFeeAmounts] = await scholarshipManager.getDetailedWithdrawalHistory(1);
      expect(initialNetAmounts.length).to.equal(0);
      expect(initialTimestamps.length).to.equal(0);
      expect(initialFeeAmounts.length).to.equal(0);
      
      // Make a withdrawal
      const withdrawAmount = ethers.parseUnits("200", 6);
      await core.connect(student1).withdrawFunds(1, withdrawAmount);
      
      // Check detailed history
      const [netAmounts, timestamps, feeAmounts] = await scholarshipManager.getDetailedWithdrawalHistory(1);
      expect(netAmounts.length).to.equal(1);
      expect(timestamps.length).to.equal(1);
      expect(feeAmounts.length).to.equal(1);
      
      const protocolFee = await core.protocolFee();
      const expectedFee = (withdrawAmount * protocolFee) / 10000n;
      const expectedNetAmount = withdrawAmount - expectedFee;
      
      expect(netAmounts[0]).to.equal(expectedNetAmount);
      expect(feeAmounts[0]).to.equal(expectedFee);
      expect(timestamps[0]).to.be.greaterThan(0);
      
      // Test individual withdrawal fee getter
      const withdrawalFee = await scholarshipManager.getWithdrawalFee(1, 0);
      expect(withdrawalFee).to.equal(expectedFee);
    });

    it("Should test shouldBeFrozen logic", async function () {
      const { 
        cirqaToken,
        scoreManager,
        scholarshipManager,
        investor
      } = await loadFixture(deployScholarshipFixture);

      // Initially should not be frozen (no score)
      expect(await scholarshipManager.shouldBeFrozen(1)).to.be.false;
      
      // Add a good score (get CIRQA via funding)
      const additionalFunding1 = ethers.parseUnits("10", 6); // Fund 10 USDT to get 10 CIRQA tokens
      await asset1.mint(investor.address, additionalFunding1);
      await asset1.connect(investor).approve(await core.getAddress(), additionalFunding1);
      await core.connect(investor).fundScholarship(1, additionalFunding1);
      
      const ratingTokens = ethers.parseUnits("10", 18); // 10 CIRQA tokens with 18 decimals
      await cirqaToken.connect(investor).approve(await scoreManager.getAddress(), ratingTokens);
      await scoreManager.connect(investor).rateScholarship(1, 5, ratingTokens);
      
      // Should not be frozen with good score
      expect(await scholarshipManager.shouldBeFrozen(1)).to.be.false;
      
      // Add a low score with more weight (get more CIRQA via funding)
      const additionalFunding2 = ethers.parseUnits("100", 6); // Fund 100 USDT to get 100 CIRQA tokens
      await asset1.mint(investor.address, additionalFunding2);
      await asset1.connect(investor).approve(await core.getAddress(), additionalFunding2);
      await core.connect(investor).fundScholarship(1, additionalFunding2);
      
      const moreTokens = ethers.parseUnits("100", 18); // 100 CIRQA tokens with 18 decimals
      await cirqaToken.connect(investor).approve(await scoreManager.getAddress(), moreTokens);
      await scoreManager.connect(investor).rateScholarship(1, 2, moreTokens);
      
      // Should be frozen with low weighted average
      expect(await scholarshipManager.shouldBeFrozen(1)).to.be.true;
    });

    it("Should test comprehensive scholarship data integration", async function () {
      const { 
        core,
        asset1,
        cirqaToken,
        scoreManager,
        scholarshipManager,
        student1,
        investor,
        metadata1,
        fundAmount
      } = await loadFixture(deployScholarshipFixture);

      // Get initial data
      const [student, balance, metadata, frozen] = await scholarshipManager.getScholarshipData(1);
      expect(student).to.equal(student1.address);
      expect(balance).to.equal(fundAmount);
      expect(metadata).to.equal(metadata1);
      expect(frozen).to.be.false;
      
      // Add investor tracking data
      const investors = await scholarshipManager.getInvestors(1);
      const totalFunding = await scholarshipManager.getTotalFunding(1);
      const investorCount = await scholarshipManager.getInvestorCount(1);
      
      expect(investors.length).to.equal(1);
      expect(totalFunding).to.equal(fundAmount);
      expect(investorCount).to.equal(1);
      
      // Make a withdrawal and check history
      const withdrawAmount = ethers.parseUnits("300", 6);
      await core.connect(student1).withdrawFunds(1, withdrawAmount);
      
      const [netAmounts, timestamps, feeAmounts] = await scholarshipManager.getDetailedWithdrawalHistory(1);
      expect(netAmounts.length).to.equal(1);
      
      // Add rating and check score-based freeze (get CIRQA via funding)
      const additionalFundingForRating = ethers.parseUnits("20", 6); // Fund 20 USDT to get 20 CIRQA tokens
      await asset1.mint(investor.address, additionalFundingForRating);
      await asset1.connect(investor).approve(await core.getAddress(), additionalFundingForRating);
      await core.connect(investor).fundScholarship(1, additionalFundingForRating);
      
      const ratingTokens = ethers.parseUnits("20", 18); // 20 CIRQA tokens with 18 decimals
      await cirqaToken.connect(investor).approve(await scoreManager.getAddress(), ratingTokens);
      await scoreManager.connect(investor).rateScholarship(1, 2, ratingTokens); // Low score
      
      // Should be auto-frozen
      const [, , , frozenAfterRating] = await scholarshipManager.getScholarshipData(1);
      expect(frozenAfterRating).to.be.true;
      
      // Verify shouldBeFrozen matches actual frozen status
      expect(await scholarshipManager.shouldBeFrozen(1)).to.equal(frozenAfterRating);
    });

  });
});