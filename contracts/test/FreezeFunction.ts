import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Core, CirqaToken, MockERC20, ScholarshipManager, ScoreManager } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Freeze Functionality", function () {
  let owner: HardhatEthersSigner, student1: HardhatEthersSigner, investor1: HardhatEthersSigner, investor2: HardhatEthersSigner;
  let cirqaToken: CirqaToken;
  let core: Core;
  let scholarshipManager: ScholarshipManager;
  let scoreManager: ScoreManager;
  let asset1: MockERC20;

  async function deployFreezeTestFixture() {
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

    // Set up contracts with proper auto-freeze configuration
    await cirqaToken.setMinter(await core.getAddress());
    await cirqaToken.setScoreManager(await scoreManager.getAddress());
    await scholarshipManager.setCoreContract(await core.getAddress());
    await scholarshipManager.setScoreManager(await scoreManager.getAddress());
    await scoreManager.setCoreContract(await core.getAddress());
    await scoreManager.setCirqaToken(await cirqaToken.getAddress());
    await scoreManager.setScholarshipManager(await scholarshipManager.getAddress()); // Key for auto-freeze
    await core.setScholarshipManager(await scholarshipManager.getAddress());
    await core.setScoreManager(await scoreManager.getAddress());

    // Create and fund a scholarship
    const metadata = "ipfs://QmTestHash";
    await core.connect(student1).createScholarship(metadata);

    const fundAmount = ethers.parseUnits("1000", 6); // 6 decimals for USDT
    await asset1.mint(investor1.address, fundAmount);
    await asset1.connect(investor1).approve(await core.getAddress(), fundAmount);
    await core.connect(investor1).fundScholarship(1, fundAmount);

    return { 
      core, 
      cirqaToken, 
      scholarshipManager,
      scoreManager,
      asset1, 
      owner, 
      student1, 
      investor1,
      investor2,
      fundAmount
    };
  }

  describe("Score-based Auto-Freezing", function () {
    it("Should not freeze scholarship with no score", async function () {
      const { scholarshipManager } = await loadFixture(deployFreezeTestFixture);
      
      // Should not be frozen initially (no score yet)
      expect(await scholarshipManager.shouldBeFrozen(1)).to.be.false;
      expect(await scholarshipManager.isFrozen(1)).to.be.false;
    });

    it("Should not freeze scholarship with good score (>= 3.0)", async function () {
      const { core, asset1, cirqaToken, scoreManager, scholarshipManager, investor1 } = await loadFixture(deployFreezeTestFixture);
      
      // Get CIRQA tokens by funding a scholarship (proper flow)
      const additionalFunding = ethers.parseUnits("10", 6); // Fund 10 USDT to get 10 CIRQA tokens
      await asset1.mint(investor1.address, additionalFunding);
      await asset1.connect(investor1).approve(await core.getAddress(), additionalFunding);
      await core.connect(investor1).fundScholarship(1, additionalFunding);
      
      const ratingTokens = ethers.parseUnits("10", 18); // 10 CIRQA tokens with 18 decimals
      await cirqaToken.connect(investor1).approve(await scoreManager.getAddress(), ratingTokens);
      
      // Rate with good score (5 out of 10)
      await scoreManager.connect(investor1).rateScholarship(1, 5, ratingTokens);
      
      // Should not be frozen with good score (500 > 300 threshold)
      expect(await scholarshipManager.shouldBeFrozen(1)).to.be.false;
      expect(await scholarshipManager.isFrozen(1)).to.be.false;
    });

    it("Should auto-freeze scholarship with low score (< 3.0)", async function () {
      const { core, asset1, cirqaToken, scoreManager, scholarshipManager, investor1 } = await loadFixture(deployFreezeTestFixture);
      
      // Get CIRQA tokens by funding a scholarship (proper flow)
      const additionalFunding = ethers.parseUnits("10", 6); // Fund 10 USDT to get 10 CIRQA tokens
      await asset1.mint(investor1.address, additionalFunding);
      await asset1.connect(investor1).approve(await core.getAddress(), additionalFunding);
      await core.connect(investor1).fundScholarship(1, additionalFunding);
      
      const ratingTokens = ethers.parseUnits("10", 18); // 10 CIRQA tokens with 18 decimals
      await cirqaToken.connect(investor1).approve(await scoreManager.getAddress(), ratingTokens);
      
      // Rate with low score (2 out of 10) - should auto-freeze
      const tx = await scoreManager.connect(investor1).rateScholarship(1, 2, ratingTokens);
      
      // Should be automatically frozen after rating
      expect(await scholarshipManager.isFrozen(1)).to.be.true;
      
      // Check auto-freeze event emission
      await expect(tx)
        .to.emit(scoreManager, "AutoFreezeStatusUpdated")
        .withArgs(1, true, 200); // 2.0 score with 2 decimal precision = 200
    });

    it("Should auto-unfreeze when score improves", async function () {
      const { core, asset1, cirqaToken, scoreManager, scholarshipManager, investor1, investor2 } = await loadFixture(deployFreezeTestFixture);
      
      // STEP 1: Create a separate scholarship for investor2 to get CIRQA tokens first
      await core.connect(investor2).createScholarship("ipfs://QmTestInvestor2");
      const funding2 = ethers.parseUnits("50", 6); // Fund 50 USDT to get 50 CIRQA tokens
      await asset1.mint(investor2.address, funding2);
      await asset1.connect(investor2).approve(await core.getAddress(), funding2);
      await core.connect(investor2).fundScholarship(2, funding2); // Fund scholarship #2
      
      // STEP 2: First investor gets CIRQA tokens and gives low score - should auto-freeze
      const additionalFunding1 = ethers.parseUnits("10", 6); // Fund 10 USDT to get 10 CIRQA tokens
      await asset1.mint(investor1.address, additionalFunding1);
      await asset1.connect(investor1).approve(await core.getAddress(), additionalFunding1);
      await core.connect(investor1).fundScholarship(1, additionalFunding1);
      
      const ratingTokens1 = ethers.parseUnits("10", 18); // 10 CIRQA tokens with 18 decimals
      await cirqaToken.connect(investor1).approve(await scoreManager.getAddress(), ratingTokens1);
      await scoreManager.connect(investor1).rateScholarship(1, 2, ratingTokens1);
      
      // Should be automatically frozen after low rating
      expect(await scholarshipManager.isFrozen(1)).to.be.true;
      
      // STEP 3: Second investor (who already has CIRQA) gives high score - should auto-unfreeze
      const ratingTokens2 = ethers.parseUnits("50", 18); // 50 CIRQA tokens with 18 decimals, more tokens = more weight
      await cirqaToken.connect(investor2).approve(await scoreManager.getAddress(), ratingTokens2);
      const tx = await scoreManager.connect(investor2).rateScholarship(1, 8, ratingTokens2);
      
      // Should be automatically unfrozen after improved rating
      expect(await scholarshipManager.isFrozen(1)).to.be.false;
      
      // Check auto-unfreeze event emission
      // Weighted average: (2*10 + 8*50)/(10+50) = (20+400)/60 = 420/60 = 7.0 = 700 in basis points
      await expect(tx)
        .to.emit(scoreManager, "AutoFreezeStatusUpdated")
        .withArgs(1, false, 700); // 7.0 score with 2 decimal precision = 700
    });

    it("Should prevent operations on auto-frozen scholarship", async function () {
      const { core, asset1, cirqaToken, scoreManager, scholarshipManager, student1, investor1, investor2 } = await loadFixture(deployFreezeTestFixture);
      
      // Give low score to auto-freeze scholarship (get CIRQA via funding)
      const additionalFunding = ethers.parseUnits("10", 6); // Fund 10 USDT to get 10 CIRQA tokens
      await asset1.mint(investor1.address, additionalFunding);
      await asset1.connect(investor1).approve(await core.getAddress(), additionalFunding);
      await core.connect(investor1).fundScholarship(1, additionalFunding);
      
      const ratingTokens = ethers.parseUnits("10", 18); // 10 CIRQA tokens with 18 decimals
      await cirqaToken.connect(investor1).approve(await scoreManager.getAddress(), ratingTokens);
      await scoreManager.connect(investor1).rateScholarship(1, 2, ratingTokens);
      
      expect(await scholarshipManager.isFrozen(1)).to.be.true;
      
      // Try to fund - should fail
      const fundAmount = ethers.parseUnits("500");
      await asset1.mint(investor2.address, fundAmount);
      await asset1.connect(investor2).approve(await core.getAddress(), fundAmount);
      
      await expect(core.connect(investor2).fundScholarship(1, fundAmount))
        .to.be.revertedWith("Scholarship is frozen due to low performance score");
      
      // Try to withdraw - should fail (use small amount to ensure sufficient balance)
      const withdrawAmount = ethers.parseUnits("100", 6); // Small amount from the 1000 initial + 10 additional = 1010 total
      await expect(core.connect(student1).withdrawFunds(1, withdrawAmount))
        .to.be.revertedWith("Scholarship is frozen due to low performance score");
    });

    it("Should allow operations after auto-unfreezing", async function () {
      const { core, asset1, cirqaToken, scoreManager, scholarshipManager, student1, investor1, investor2 } = await loadFixture(deployFreezeTestFixture);
      
      // STEP 1: Create a separate scholarship for investor2 to get CIRQA tokens first
      await core.connect(investor2).createScholarship("ipfs://QmTestInvestor2");
      const funding2 = ethers.parseUnits("50", 6); // Fund 50 USDT to get 50 CIRQA tokens
      await asset1.mint(investor2.address, funding2);
      await asset1.connect(investor2).approve(await core.getAddress(), funding2);
      await core.connect(investor2).fundScholarship(2, funding2); // Fund scholarship #2
      
      // STEP 2: Auto-freeze scholarship with low score (get CIRQA via funding)
      const additionalFunding1 = ethers.parseUnits("10", 6); // Fund 10 USDT to get 10 CIRQA tokens
      await asset1.mint(investor1.address, additionalFunding1);
      await asset1.connect(investor1).approve(await core.getAddress(), additionalFunding1);
      await core.connect(investor1).fundScholarship(1, additionalFunding1);
      
      const ratingTokens = ethers.parseUnits("10", 18); // 10 CIRQA tokens with 18 decimals
      await cirqaToken.connect(investor1).approve(await scoreManager.getAddress(), ratingTokens);
      await scoreManager.connect(investor1).rateScholarship(1, 2, ratingTokens);
      
      expect(await scholarshipManager.isFrozen(1)).to.be.true;
      
      // STEP 3: Auto-unfreeze with improved score (investor2 already has CIRQA)
      const betterRatingTokens = ethers.parseUnits("50", 18); // 50 CIRQA tokens with 18 decimals
      await cirqaToken.connect(investor2).approve(await scoreManager.getAddress(), betterRatingTokens);
      await scoreManager.connect(investor2).rateScholarship(1, 8, betterRatingTokens);
      
      expect(await scholarshipManager.isFrozen(1)).to.be.false;
      
      // STEP 4: Now funding should work (scholarship is unfrozen)
      const fundAmount = ethers.parseUnits("500", 6);
      await asset1.mint(investor2.address, fundAmount);
      await asset1.connect(investor2).approve(await core.getAddress(), fundAmount);
      await core.connect(investor2).fundScholarship(1, fundAmount);
      
      // And withdrawal should work
      const withdrawAmount = ethers.parseUnits("300", 6);
      await core.connect(student1).withdrawFunds(1, withdrawAmount);
      expect(await asset1.balanceOf(student1.address)).to.be.greaterThan(0);
    });

    it("Should handle Core.updateScholarshipFreezeStatus", async function () {
      const { core, asset1, cirqaToken, scoreManager, scholarshipManager, investor1 } = await loadFixture(deployFreezeTestFixture);
      
      // Give low score that should cause freeze (get CIRQA via funding)
      const additionalFunding = ethers.parseUnits("10", 6); // Fund 10 USDT to get 10 CIRQA tokens
      await asset1.mint(investor1.address, additionalFunding);
      await asset1.connect(investor1).approve(await core.getAddress(), additionalFunding);
      await core.connect(investor1).fundScholarship(1, additionalFunding);
      
      const ratingTokens = ethers.parseUnits("10", 18); // 10 CIRQA tokens with 18 decimals
      await cirqaToken.connect(investor1).approve(await scoreManager.getAddress(), ratingTokens);
      await scoreManager.connect(investor1).rateScholarship(1, 2, ratingTokens);
      
      // Should be auto-frozen due to low score
      expect(await scholarshipManager.isFrozen(1)).to.be.true;
      
      // Manually unfreeze for testing
      await scholarshipManager.setFrozenStatus(1, false);
      expect(await scholarshipManager.isFrozen(1)).to.be.false;
      
      // Update via Core contract should re-freeze based on score
      await core.updateScholarshipFreezeStatus(1);
      expect(await scholarshipManager.isFrozen(1)).to.be.true;
    });

    it("Should not emit event when freeze status doesn't change", async function () {
      const { core, asset1, cirqaToken, scoreManager, scholarshipManager, investor1 } = await loadFixture(deployFreezeTestFixture);
      
      // First rating with low score (get CIRQA via funding)
      const additionalFunding1 = ethers.parseUnits("15", 6); // Fund 15 USDT to get 15 CIRQA tokens (enough for 2 ratings)
      await asset1.mint(investor1.address, additionalFunding1);
      await asset1.connect(investor1).approve(await core.getAddress(), additionalFunding1);
      await core.connect(investor1).fundScholarship(1, additionalFunding1);
      
      const ratingTokens1 = ethers.parseUnits("10", 18); // 10 CIRQA tokens with 18 decimals
      await cirqaToken.connect(investor1).approve(await scoreManager.getAddress(), ratingTokens1);
      await scoreManager.connect(investor1).rateScholarship(1, 2, ratingTokens1);
      
      // Should be frozen now
      expect(await scholarshipManager.isFrozen(1)).to.be.true;
      
      // Rate again with another low score - should not emit event since already frozen (use remaining CIRQA)
      const ratingTokens2 = ethers.parseUnits("5", 18); // 5 CIRQA tokens with 18 decimals (from remaining balance)
      await cirqaToken.connect(investor1).approve(await scoreManager.getAddress(), ratingTokens2);
      const tx = await scoreManager.connect(investor1).rateScholarship(1, 1, ratingTokens2);
      
      // Should not emit AutoFreezeStatusUpdated event since status didn't change
      await expect(tx).to.not.emit(scoreManager, "AutoFreezeStatusUpdated");
      
      // Should still be frozen
      expect(await scholarshipManager.isFrozen(1)).to.be.true;
    });

  });

  describe("Manual Freeze Controls", function () {
    it("Should allow owner to manually freeze/unfreeze", async function () {
      const { scholarshipManager, scoreManager } = await loadFixture(deployFreezeTestFixture);
      
      // Manual freeze
      const freezeTx = await scholarshipManager.setFrozenStatus(1, true);
      expect(await scholarshipManager.isFrozen(1)).to.be.true;
      
      await expect(freezeTx)
        .to.emit(scholarshipManager, "ScholarshipFrozen")
        .withArgs(1, 0); // No score yet, so 0
      
      // Manual unfreeze
      const unfreezeTx = await scholarshipManager.setFrozenStatus(1, false);
      expect(await scholarshipManager.isFrozen(1)).to.be.false;
      
      await expect(unfreezeTx)
        .to.emit(scholarshipManager, "ScholarshipUnfrozen")
        .withArgs(1, 0);
    });

    it("Should revert when non-owner tries to manually freeze", async function () {
      const { scholarshipManager, student1 } = await loadFixture(deployFreezeTestFixture);
      
      await expect(scholarshipManager.connect(student1).setFrozenStatus(1, true))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should prevent operations on manually frozen scholarship", async function () {
      const { core, asset1, scholarshipManager, student1, investor2 } = await loadFixture(deployFreezeTestFixture);
      
      // Manually freeze scholarship
      await scholarshipManager.setFrozenStatus(1, true);
      
      // Try to fund - should fail
      const fundAmount = ethers.parseUnits("500", 6);
      await asset1.mint(investor2.address, fundAmount);
      await asset1.connect(investor2).approve(await core.getAddress(), fundAmount);
      
      await expect(core.connect(investor2).fundScholarship(1, fundAmount))
        .to.be.revertedWith("Scholarship is frozen due to low performance score");
      
      // Try to withdraw - should fail (use amount smaller than balance)
      const withdrawAmount = ethers.parseUnits("100", 6); // Smaller amount to ensure sufficient balance
      await expect(core.connect(student1).withdrawFunds(1, withdrawAmount))
        .to.be.revertedWith("Scholarship is frozen due to low performance score");
    });

  });

  describe("Freeze Status Integration", function () {
    it("Should return correct freeze status in getScholarshipData", async function () {
      const { scholarshipManager, student1 } = await loadFixture(deployFreezeTestFixture);
      
      // Test unfrozen scholarship
      const [student, balance, metadata, frozen] = await scholarshipManager.getScholarshipData(1);
      expect(student).to.equal(student1.address);
      expect(frozen).to.be.false;

      // Test frozen scholarship
      await scholarshipManager.setFrozenStatus(1, true);
      const [, , , frozenAfter] = await scholarshipManager.getScholarshipData(1);
      expect(frozenAfter).to.be.true;
    });

    it("Should handle freeze threshold edge cases", async function () {
      const { core, asset1, cirqaToken, scoreManager, scholarshipManager, investor1, investor2 } = await loadFixture(deployFreezeTestFixture);
      
      // Test score exactly at threshold (3.0 = 300) - get CIRQA via funding
      const additionalFunding1 = ethers.parseUnits("10", 6); // Fund 10 USDT to get 10 CIRQA tokens
      await asset1.mint(investor1.address, additionalFunding1);
      await asset1.connect(investor1).approve(await core.getAddress(), additionalFunding1);
      await core.connect(investor1).fundScholarship(1, additionalFunding1);
      
      const ratingTokens1 = ethers.parseUnits("10", 18); // 10 CIRQA tokens with 18 decimals
      await cirqaToken.connect(investor1).approve(await scoreManager.getAddress(), ratingTokens1);
      await scoreManager.connect(investor1).rateScholarship(1, 3, ratingTokens1);
      
      // Should not be frozen at exactly 3.0
      expect(await scholarshipManager.isFrozen(1)).to.be.false;
      
      // Test score just below threshold (2.99 = 299) - get more CIRQA via funding
      const additionalFunding2 = ethers.parseUnits("100", 6); // Fund 100 USDT to get 100 CIRQA tokens
      await asset1.mint(investor2.address, additionalFunding2);
      await asset1.connect(investor2).approve(await core.getAddress(), additionalFunding2);
      await core.connect(investor2).fundScholarship(1, additionalFunding2);
      
      const ratingTokens2 = ethers.parseUnits("100", 18); // 100 CIRQA tokens with 18 decimals
      await cirqaToken.connect(investor2).approve(await scoreManager.getAddress(), ratingTokens2);
      await scoreManager.connect(investor2).rateScholarship(1, 2, ratingTokens2); // Use valid score (2.0) instead of 299
      
      // Manually calculate expected weighted average
      // (3 * 10 + 2 * 100) / (10 + 100) = (30 + 200) / 110 = 230/110 = 2.09
      const expectedScore = (3 * 10 + 2 * 100) / (10 + 100);
      
      if (expectedScore < 3.0) {
        expect(await scholarshipManager.isFrozen(1)).to.be.true;
      } else {
        expect(await scholarshipManager.isFrozen(1)).to.be.false;
      }
    });

  });
});