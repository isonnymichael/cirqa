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
    await scholarshipManager.setScoreManager(await scoreManager.getAddress()); // Add ScoreManager to ScholarshipManager
    await scoreManager.setCoreContract(await core.getAddress());
    await scoreManager.setCirqaToken(await cirqaToken.getAddress());
    await scoreManager.setScholarshipManager(await scholarshipManager.getAddress()); // Add ScholarshipManager to ScoreManager for auto-freeze
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
      
      const fundAmount = ethers.parseUnits("1000", 6);
      
      // Mint USDT to investor and approve
      await asset1.mint(investor1.address, fundAmount);
      await asset1.connect(investor1).approve(await core.getAddress(), fundAmount);
      
      const tx = await core.connect(investor1).fundScholarship(1, fundAmount);
      
      // Check that USDT was transferred to core contract
      expect(await asset1.balanceOf(await core.getAddress())).to.equal(fundAmount);
      
      // Check that Cirqa tokens were minted to investor (1:1 ratio by default)
      // CIRQA has 18 decimals, USDT has 6 decimals, so we need to convert
      const expectedCirqaAmount = ethers.parseUnits("1000", 18); // 1000 CIRQA with 18 decimals
      expect(await cirqaToken.balanceOf(investor1.address)).to.equal(expectedCirqaAmount);
      
      // Check that scholarship balance was updated
      const hasBalance = await scholarshipManager.hasEnoughBalance(1, fundAmount);
      expect(hasBalance).to.be.true;
      
      // Check event emission
      await expect(tx)
        .to.emit(core, "ScholarshipFunded")
        .withArgs(1, investor1.address, fundAmount);
      
      // Check investor tracking
      const investors = await scholarshipManager.getInvestors(1);
      expect(investors.length).to.equal(1);
      expect(investors[0]).to.equal(investor1.address);
      
      const contribution = await scholarshipManager.getInvestorContribution(1, investor1.address);
      expect(contribution).to.equal(fundAmount);
      
      const totalFunding = await scholarshipManager.getTotalFunding(1);
      expect(totalFunding).to.equal(fundAmount);
      
      const investorCount = await scholarshipManager.getInvestorCount(1);
      expect(investorCount).to.equal(1);
    });

    it("Should handle multiple funders for same scholarship", async function () {
      const { core, asset1, investor1, investor2, cirqaToken, scholarshipManager } = await loadFixture(deployScholarshipFixture);
      
      const fundAmount1 = ethers.parseUnits("500", 6);
      const fundAmount2 = ethers.parseUnits("300", 6);
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
      // Check CIRQA rewards (convert USDT amounts to CIRQA with 18 decimals)
      const expectedCirqa1 = ethers.parseUnits("500", 18); // 500 CIRQA with 18 decimals
      const expectedCirqa2 = ethers.parseUnits("300", 18); // 300 CIRQA with 18 decimals
      expect(await cirqaToken.balanceOf(investor1.address)).to.equal(expectedCirqa1);
      expect(await cirqaToken.balanceOf(investor2.address)).to.equal(expectedCirqa2);
      
      // Check that scholarship can access total funding
      const hasBalance = await scholarshipManager.hasEnoughBalance(1, totalFunding);
      expect(hasBalance).to.be.true;
      
      // Check investor tracking for multiple investors
      const investors = await scholarshipManager.getInvestors(1);
      expect(investors.length).to.equal(2);
      expect(investors).to.include(investor1.address);
      expect(investors).to.include(investor2.address);
      
      const contribution1 = await scholarshipManager.getInvestorContribution(1, investor1.address);
      const contribution2 = await scholarshipManager.getInvestorContribution(1, investor2.address);
      expect(contribution1).to.equal(fundAmount1);
      expect(contribution2).to.equal(fundAmount2);
      
      const totalFundingTracked = await scholarshipManager.getTotalFunding(1);
      expect(totalFundingTracked).to.equal(totalFunding);
      
      const investorCount = await scholarshipManager.getInvestorCount(1);
      expect(investorCount).to.equal(2);
    });

    it("Should handle repeated funding from same investor", async function () {
      const { core, asset1, investor1, scholarshipManager } = await loadFixture(deployScholarshipFixture);
      
      const fundAmount1 = ethers.parseUnits("500", 6);
      const fundAmount2 = ethers.parseUnits("300", 6);
      const totalInvestment = fundAmount1 + fundAmount2;
      
      // First funding
      await asset1.mint(investor1.address, totalInvestment);
      await asset1.connect(investor1).approve(await core.getAddress(), totalInvestment);
      await core.connect(investor1).fundScholarship(1, fundAmount1);
      
      // Second funding from same investor
      await core.connect(investor1).fundScholarship(1, fundAmount2);
      
      // Should still have only 1 investor in the list
      const investors = await scholarshipManager.getInvestors(1);
      expect(investors.length).to.equal(1);
      expect(investors[0]).to.equal(investor1.address);
      
      // But total contribution should be cumulative
      const contribution = await scholarshipManager.getInvestorContribution(1, investor1.address);
      expect(contribution).to.equal(totalInvestment);
      
      const totalFunding = await scholarshipManager.getTotalFunding(1);
      expect(totalFunding).to.equal(totalInvestment);
      
      const investorCount = await scholarshipManager.getInvestorCount(1);
      expect(investorCount).to.equal(1);
    });

    it("Should respect different reward rates", async function () {
      const { core, asset1, investor1, cirqaToken } = await loadFixture(deployScholarshipFixture);
      
      // Change reward rate to 2 Cirqa tokens per 1 USDT
      const newRewardRate = ethers.parseUnits("2", 18); // CIRQA has 18 decimals
      await core.updateRewardRate(newRewardRate);
      
      const fundAmount = ethers.parseUnits("1000", 6);
      
      await asset1.mint(investor1.address, fundAmount);
      await asset1.connect(investor1).approve(await core.getAddress(), fundAmount);
      await core.connect(investor1).fundScholarship(1, fundAmount);
      
      // Should receive 2x Cirqa tokens
      // With 2.0 reward rate: 1000 USDT should give 2000 CIRQA tokens
      const expectedReward = ethers.parseUnits("2000", 18); // 2000 CIRQA with 18 decimals
      expect(await cirqaToken.balanceOf(investor1.address)).to.equal(expectedReward);
    });

    it("Should revert when funding non-existent scholarship", async function () {
      const { core, asset1, investor1 } = await loadFixture(deployScholarshipFixture);
      
      const fundAmount = ethers.parseUnits("1000", 6);
      
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
      
      const fundAmount = ethers.parseUnits("1000", 6);
      
      await asset1.mint(investor1.address, fundAmount);
      // Don't approve or approve less than needed
      await asset1.connect(investor1).approve(await core.getAddress(), fundAmount / 2n);
      
      await expect(core.connect(investor1).fundScholarship(1, fundAmount))
        .to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("Should revert when insufficient USDT balance", async function () {
      const { core, asset1, investor1 } = await loadFixture(deployScholarshipFixture);
      
      const fundAmount = ethers.parseUnits("1000", 6);
      
      // Mint less than needed
      await asset1.mint(investor1.address, fundAmount / 2n);
      await asset1.connect(investor1).approve(await core.getAddress(), fundAmount);
      
      await expect(core.connect(investor1).fundScholarship(1, fundAmount))
        .to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("Should handle large funding amounts", async function () {
      const { core, asset1, investor1, cirqaToken } = await loadFixture(deployScholarshipFixture);
      
      const largeFundAmount = ethers.parseUnits("1000000", 6); // 1M tokens
      
      await asset1.mint(investor1.address, largeFundAmount);
      await asset1.connect(investor1).approve(await core.getAddress(), largeFundAmount);
      
      await expect(core.connect(investor1).fundScholarship(1, largeFundAmount))
        .to.not.be.reverted;
        
      // Check CIRQA rewards (1M USDT should mint 1M CIRQA with 18 decimals)
      const expectedCirqaLarge = ethers.parseUnits("1000000", 18);
      expect(await cirqaToken.balanceOf(investor1.address)).to.equal(expectedCirqaLarge);
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
      
      // The reward calculation should be: 1000 USDT = 1000 CIRQA tokens
      // But CIRQA has 18 decimals while USDT has 6 decimals
      // So 1000 USDT (1000000000 with 6 decimals) should give 1000 CIRQA (1000000000000000000000 with 18 decimals)
      const expectedReward = ethers.parseUnits("1000", 18); // 1000 CIRQA with 18 decimals
      expect(await cirqaToken.balanceOf(investor1.address)).to.equal(expectedReward);
    });

    it("Should prevent funding when scholarship is frozen", async function () {
      const { core, asset1, investor1, scholarshipManager } = await loadFixture(deployScholarshipFixture);
      
      // Manually freeze the scholarship for testing
      await scholarshipManager.setFrozenStatus(1, true);
      
      const fundAmount = ethers.parseUnits("500", 6);
      
      await asset1.mint(investor1.address, fundAmount);
      await asset1.connect(investor1).approve(await core.getAddress(), fundAmount);
      
      // Should revert when trying to fund frozen scholarship
      await expect(core.connect(investor1).fundScholarship(1, fundAmount))
        .to.be.revertedWith("Scholarship is frozen due to low performance score");
    });

    it("Should allow funding after unfreezing", async function () {
      const { core, asset1, investor1, cirqaToken, scholarshipManager } = await loadFixture(deployScholarshipFixture);
      
      // Freeze first
      await scholarshipManager.setFrozenStatus(1, true);
      
      const fundAmount = ethers.parseUnits("500", 6);
      
      await asset1.mint(investor1.address, fundAmount);
      await asset1.connect(investor1).approve(await core.getAddress(), fundAmount);
      
      // Should fail when frozen
      await expect(core.connect(investor1).fundScholarship(1, fundAmount))
        .to.be.revertedWith("Scholarship is frozen due to low performance score");
      
      // Unfreeze
      await scholarshipManager.setFrozenStatus(1, false);
      
      // Should work after unfreezing
      await core.connect(investor1).fundScholarship(1, fundAmount);
      // Check CIRQA rewards (convert USDT to CIRQA with 18 decimals)
      const expectedCirqaUnfreeze = ethers.parseUnits("500", 18);
      expect(await cirqaToken.balanceOf(investor1.address)).to.equal(expectedCirqaUnfreeze);
    });

    it("Should track investor contributions accurately", async function () {
      const { core, asset1, investor1, investor2, scholarshipManager } = await loadFixture(deployScholarshipFixture);
      
      const fundAmount1 = ethers.parseUnits("300", 6);
      const fundAmount2 = ethers.parseUnits("700", 6);
      const totalFunding = fundAmount1 + fundAmount2;
      
      // First investor funds
      await asset1.mint(investor1.address, fundAmount1);
      await asset1.connect(investor1).approve(await core.getAddress(), fundAmount1);
      await core.connect(investor1).fundScholarship(1, fundAmount1);
      
      // Check tracking after first investment
      let investors = await scholarshipManager.getInvestors(1);
      expect(investors.length).to.equal(1);
      expect(investors[0]).to.equal(investor1.address);
      expect(await scholarshipManager.getInvestorContribution(1, investor1.address)).to.equal(fundAmount1);
      expect(await scholarshipManager.getTotalFunding(1)).to.equal(fundAmount1);
      expect(await scholarshipManager.getInvestorCount(1)).to.equal(1);
      
      // Second investor funds
      await asset1.mint(investor2.address, fundAmount2);
      await asset1.connect(investor2).approve(await core.getAddress(), fundAmount2);
      await core.connect(investor2).fundScholarship(1, fundAmount2);
      
      // Check tracking after second investment
      investors = await scholarshipManager.getInvestors(1);
      expect(investors.length).to.equal(2);
      expect(investors).to.include(investor1.address);
      expect(investors).to.include(investor2.address);
      expect(await scholarshipManager.getInvestorContribution(1, investor1.address)).to.equal(fundAmount1);
      expect(await scholarshipManager.getInvestorContribution(1, investor2.address)).to.equal(fundAmount2);
      expect(await scholarshipManager.getTotalFunding(1)).to.equal(totalFunding);
      expect(await scholarshipManager.getInvestorCount(1)).to.equal(2);
    });

    it("Should handle same investor funding multiple times", async function () {
      const { core, asset1, investor1, scholarshipManager } = await loadFixture(deployScholarshipFixture);
      
      const fundAmount1 = ethers.parseUnits("400", 6);
      const fundAmount2 = ethers.parseUnits("600", 6);
      const totalInvestment = fundAmount1 + fundAmount2;
      
      await asset1.mint(investor1.address, totalInvestment);
      await asset1.connect(investor1).approve(await core.getAddress(), totalInvestment);
      
      // First funding
      await core.connect(investor1).fundScholarship(1, fundAmount1);
      
      // Check after first funding
      let investors = await scholarshipManager.getInvestors(1);
      expect(investors.length).to.equal(1);
      expect(await scholarshipManager.getInvestorContribution(1, investor1.address)).to.equal(fundAmount1);
      
      // Second funding from same investor
      await core.connect(investor1).fundScholarship(1, fundAmount2);
      
      // Should still have only 1 investor in the list, but cumulative contribution
      investors = await scholarshipManager.getInvestors(1);
      expect(investors.length).to.equal(1);
      expect(investors[0]).to.equal(investor1.address);
      expect(await scholarshipManager.getInvestorContribution(1, investor1.address)).to.equal(totalInvestment);
      expect(await scholarshipManager.getTotalFunding(1)).to.equal(totalInvestment);
      expect(await scholarshipManager.getInvestorCount(1)).to.equal(1);
    });

    it("Should return zero for non-investor", async function () {
      const { scholarshipManager, investor2 } = await loadFixture(deployScholarshipFixture);
      
      // Check non-investor returns zero
      expect(await scholarshipManager.getInvestorContribution(1, investor2.address)).to.equal(0);
      
      const investors = await scholarshipManager.getInvestors(1);
      expect(investors).to.not.include(investor2.address);
    });

  });
});