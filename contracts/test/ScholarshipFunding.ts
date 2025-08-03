import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Core, CirqaToken, MockERC20, ScholarshipManager, ScoreManager } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ScholarshipFunding", function () {
  let owner: HardhatEthersSigner, student1: HardhatEthersSigner, investor1: HardhatEthersSigner, investor2: HardhatEthersSigner;
  let cirqaToken: CirqaToken;
  let core: Core;
  let scholarshipManager: ScholarshipManager;
  let scoreManager: ScoreManager;
  let asset1: MockERC20;

  async function deployScholarshipFixture() {
    [owner, student1, investor1, investor2] = await ethers.getSigners();

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

    // Create a scholarship
    const metadata = "ipfs://QmTestHash";
    await core.connect(student1).createScholarship(metadata);

    return { 
      core, 
      cirqaToken, 
      scholarshipManager,
      scoreManager,
      asset1, 
      owner, 
      student1, 
      investor1,
      investor2
    };
  }

  describe("Scholarship Funding", function () {
    it("Should fund a scholarship successfully", async function () {
      const { core, asset1, investor1, cirqaToken, scholarshipManager } = await loadFixture(deployScholarshipFixture);
      
      const fundAmount = ethers.parseEther("1000");
      
      // Mint USDT to investor and approve
      await asset1.mint(investor1.address, fundAmount);
      await asset1.connect(investor1).approve(await core.getAddress(), fundAmount);
      
      const tx = await core.connect(investor1).fundScholarship(1, fundAmount);
      
      // Check that USDT was transferred to core contract
      expect(await asset1.balanceOf(await core.getAddress())).to.equal(fundAmount);
      
      // Check that Cirqa tokens were minted to investor (1:1 ratio by default)
      expect(await cirqaToken.balanceOf(investor1.address)).to.equal(fundAmount);
      
      // Check that scholarship balance was updated
      const hasBalance = await scholarshipManager.hasEnoughBalance(1, fundAmount);
      expect(hasBalance).to.be.true;
      
      // Check event emission
      await expect(tx)
        .to.emit(core, "ScholarshipFunded")
        .withArgs(1, investor1.address, fundAmount);
    });

    it("Should handle multiple funders for same scholarship", async function () {
      const { core, asset1, investor1, investor2, cirqaToken, scholarshipManager } = await loadFixture(deployScholarshipFixture);
      
      const fundAmount1 = ethers.parseEther("500");
      const fundAmount2 = ethers.parseEther("300");
      const totalFunding = fundAmount1 + fundAmount2;
      
      // First investor funds
      await asset1.mint(investor1.address, fundAmount1);
      await asset1.connect(investor1).approve(await core.getAddress(), fundAmount1);
      await core.connect(investor1).fundScholarship(1, fundAmount1);
      
      // Second investor funds
      await asset1.mint(investor2.address, fundAmount2);
      await asset1.connect(investor2).approve(await core.getAddress(), fundAmount2);
      await core.connect(investor2).fundScholarship(1, fundAmount2);
      
      // Check total USDT in contract
      expect(await asset1.balanceOf(await core.getAddress())).to.equal(totalFunding);
      
      // Check that both investors received Cirqa tokens
      expect(await cirqaToken.balanceOf(investor1.address)).to.equal(fundAmount1);
      expect(await cirqaToken.balanceOf(investor2.address)).to.equal(fundAmount2);
      
      // Check that scholarship can access total funding
      const hasBalance = await scholarshipManager.hasEnoughBalance(1, totalFunding);
      expect(hasBalance).to.be.true;
    });

    it("Should respect different reward rates", async function () {
      const { core, asset1, investor1, cirqaToken } = await loadFixture(deployScholarshipFixture);
      
      // Change reward rate to 2 Cirqa tokens per 1 USDT
      const newRewardRate = ethers.parseEther("2");
      await core.updateRewardRate(newRewardRate);
      
      const fundAmount = ethers.parseEther("1000");
      
      await asset1.mint(investor1.address, fundAmount);
      await asset1.connect(investor1).approve(await core.getAddress(), fundAmount);
      await core.connect(investor1).fundScholarship(1, fundAmount);
      
      // Should receive 2x Cirqa tokens
      const expectedReward = (fundAmount * newRewardRate) / ethers.parseEther("1");
      expect(await cirqaToken.balanceOf(investor1.address)).to.equal(expectedReward);
    });

    it("Should revert when funding non-existent scholarship", async function () {
      const { core, asset1, investor1 } = await loadFixture(deployScholarshipFixture);
      
      const fundAmount = ethers.parseEther("1000");
      
      await asset1.mint(investor1.address, fundAmount);
      await asset1.connect(investor1).approve(await core.getAddress(), fundAmount);
      
      await expect(core.connect(investor1).fundScholarship(999, fundAmount))
        .to.be.revertedWith("Scholarship does not exist");
    });

    it("Should revert when funding with zero amount", async function () {
      const { core, investor1 } = await loadFixture(deployScholarshipFixture);
      
      await expect(core.connect(investor1).fundScholarship(1, 0))
        .to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should revert when insufficient USDT allowance", async function () {
      const { core, asset1, investor1 } = await loadFixture(deployScholarshipFixture);
      
      const fundAmount = ethers.parseEther("1000");
      
      await asset1.mint(investor1.address, fundAmount);
      // Don't approve or approve less than needed
      await asset1.connect(investor1).approve(await core.getAddress(), fundAmount / 2n);
      
      await expect(core.connect(investor1).fundScholarship(1, fundAmount))
        .to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("Should revert when insufficient USDT balance", async function () {
      const { core, asset1, investor1 } = await loadFixture(deployScholarshipFixture);
      
      const fundAmount = ethers.parseEther("1000");
      
      // Mint less than needed
      await asset1.mint(investor1.address, fundAmount / 2n);
      await asset1.connect(investor1).approve(await core.getAddress(), fundAmount);
      
      await expect(core.connect(investor1).fundScholarship(1, fundAmount))
        .to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("Should handle large funding amounts", async function () {
      const { core, asset1, investor1, cirqaToken } = await loadFixture(deployScholarshipFixture);
      
      const largeFundAmount = ethers.parseEther("1000000"); // 1M tokens
      
      await asset1.mint(investor1.address, largeFundAmount);
      await asset1.connect(investor1).approve(await core.getAddress(), largeFundAmount);
      
      await expect(core.connect(investor1).fundScholarship(1, largeFundAmount))
        .to.not.be.reverted;
        
      expect(await cirqaToken.balanceOf(investor1.address)).to.equal(largeFundAmount);
    });

    it("Should work with different token decimals", async function () {
      const { core, investor1, cirqaToken } = await loadFixture(deployScholarshipFixture);
      
      // Deploy USDT with 6 decimals (like real USDT)
      const MockERC20Factory = await ethers.getContractFactory("MockERC20");
      const usdt6 = await MockERC20Factory.deploy("Real USDT", "USDT", 6);
      await usdt6.waitForDeployment();
      
      // Update USDT contract in Core
      await core.updateUSDTContract(await usdt6.getAddress());
      
      const fundAmount = ethers.parseUnits("1000", 6); // 1000 USDT with 6 decimals
      
      await usdt6.mint(investor1.address, fundAmount);
      await usdt6.connect(investor1).approve(await core.getAddress(), fundAmount);
      await core.connect(investor1).fundScholarship(1, fundAmount);
      
      // The reward calculation is: (amount * rewardRate) / 1e18
      // With 1000 USDT (1000000000 with 6 decimals) and default rewardRate of 1e18
      // Result should be: (1000000000 * 1e18) / 1e18 = 1000000000 (same as input amount)
      const expectedReward = fundAmount; // 1000000000 (1000 USDT with 6 decimals)
      expect(await cirqaToken.balanceOf(investor1.address)).to.equal(expectedReward);
    });
  });
});