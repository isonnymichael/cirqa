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
    await scoreManager.setCoreContract(await core.getAddress());
    await scoreManager.setCirqaToken(await cirqaToken.getAddress());
    await core.setScholarshipManager(await scholarshipManager.getAddress());
    await core.setScoreManager(await scoreManager.getAddress());

    // Create scholarships
    const metadata1 = "ipfs://QmTest1";
    const metadata2 = "ipfs://QmTest2";
    await core.connect(student1).createScholarship(metadata1);
    await core.connect(student2).createScholarship(metadata2);

    // Fund the first scholarship
    const fundAmount = ethers.parseEther("1000"); // 1000 tokens
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

      const withdrawAmount = ethers.parseEther("300");
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

      const additionalFunding = ethers.parseEther("300");
      await asset1.mint(investor.address, additionalFunding);
      await asset1.connect(investor).approve(await core.getAddress(), additionalFunding);
      await core.connect(investor).fundScholarship(1, additionalFunding);

      // Check if student can withdraw the total amount (original + additional)
      const canWithdrawTotal = await scholarshipManager.hasEnoughBalance(1, fundAmount + additionalFunding);
      expect(canWithdrawTotal).to.be.true;
    });

  });
});