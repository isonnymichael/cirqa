import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Core, CirqaToken, MockERC20, ScholarshipManager, ScoreManager } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("CoreAdmin", function () {
  let owner: HardhatEthersSigner, student1: HardhatEthersSigner, investor: HardhatEthersSigner, nonOwner: HardhatEthersSigner;
  let cirqaToken: CirqaToken;
  let core: Core;
  let scholarshipManager: ScholarshipManager;
  let scoreManager: ScoreManager;
  let asset1: MockERC20;

  async function deployFixture() {
    [owner, student1, investor, nonOwner] = await ethers.getSigners();

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

    return { 
      core, 
      cirqaToken, 
      scholarshipManager,
      scoreManager,
      asset1, 
      owner, 
      student1, 
      investor,
      nonOwner
    };
  }

  describe("Admin Functions", function () {
    describe("USDT Contract Management", function () {
      it("Should update USDT contract successfully", async function () {
        const { core, asset1 } = await loadFixture(deployFixture);
        
        // Deploy new USDT contract
        const MockERC20Factory = await ethers.getContractFactory("MockERC20");
        const newUSDT = await MockERC20Factory.deploy("New USDT", "NUSDT", 18);
        await newUSDT.waitForDeployment();
        
        const oldUSDTAddress = await asset1.getAddress();
        const newUSDTAddress = await newUSDT.getAddress();
        
        const tx = await core.updateUSDTContract(newUSDTAddress);
        
        // Check that USDT contract was updated
        expect(await core.usdtToken()).to.equal(newUSDTAddress);
        
        // Check event emission
        await expect(tx)
          .to.emit(core, "USDTContractUpdated")
          .withArgs(oldUSDTAddress, newUSDTAddress);
      });

      it("Should revert when non-owner tries to update USDT contract", async function () {
        const { core, nonOwner } = await loadFixture(deployFixture);
        
        const MockERC20Factory = await ethers.getContractFactory("MockERC20");
        const newUSDT = await MockERC20Factory.deploy("New USDT", "NUSDT", 18);
        await newUSDT.waitForDeployment();
        
        await expect(core.connect(nonOwner).updateUSDTContract(await newUSDT.getAddress()))
          .to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("Should revert when updating to zero address", async function () {
        const { core } = await loadFixture(deployFixture);
        
        await expect(core.updateUSDTContract(ethers.ZeroAddress))
          .to.be.revertedWith("Invalid address");
      });
    });

    describe("Reward Rate Management", function () {
      it("Should update reward rate successfully", async function () {
        const { core } = await loadFixture(deployFixture);
        
        const newRewardRate = ethers.parseEther("2"); // 2 Cirqa per 1 USDT
        
        await core.updateRewardRate(newRewardRate);
        
        expect(await core.rewardRate()).to.equal(newRewardRate);
      });

      it("Should revert when non-owner tries to update reward rate", async function () {
        const { core, nonOwner } = await loadFixture(deployFixture);
        
        const newRewardRate = ethers.parseEther("2");
        
        await expect(core.connect(nonOwner).updateRewardRate(newRewardRate))
          .to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("Should allow zero reward rate", async function () {
        const { core } = await loadFixture(deployFixture);
        
        await expect(core.updateRewardRate(0))
          .to.not.be.reverted;
          
        expect(await core.rewardRate()).to.equal(0);
      });

      it("Should allow very high reward rate", async function () {
        const { core } = await loadFixture(deployFixture);
        
        const highRate = ethers.parseEther("1000000"); // 1M Cirqa per 1 USDT
        
        await expect(core.updateRewardRate(highRate))
          .to.not.be.reverted;
          
        expect(await core.rewardRate()).to.equal(highRate);
      });
    });

    describe("Protocol Fee Management", function () {
      it("Should set protocol fee successfully", async function () {
        const { core } = await loadFixture(deployFixture);
        
        const newFee = 500; // 5%
        
        await core.setProtocolFee(newFee);
        
        expect(await core.protocolFee()).to.equal(newFee);
      });

      it("Should revert when non-owner tries to set protocol fee", async function () {
        const { core, nonOwner } = await loadFixture(deployFixture);
        
        const newFee = 500;
        
        await expect(core.connect(nonOwner).setProtocolFee(newFee))
          .to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("Should revert when fee exceeds maximum", async function () {
        const { core } = await loadFixture(deployFixture);
        
        const excessiveFee = 1001; // 10.01% (over 10% limit)
        
        await expect(core.setProtocolFee(excessiveFee))
          .to.be.revertedWith("Fee cannot exceed 10%");
      });

      it("Should allow maximum fee of 10%", async function () {
        const { core } = await loadFixture(deployFixture);
        
        const maxFee = 1000; // 10%
        
        await expect(core.setProtocolFee(maxFee))
          .to.not.be.reverted;
          
        expect(await core.protocolFee()).to.equal(maxFee);
      });

      it("Should allow zero fee", async function () {
        const { core } = await loadFixture(deployFixture);
        
        await expect(core.setProtocolFee(0))
          .to.not.be.reverted;
          
        expect(await core.protocolFee()).to.equal(0);
      });
    });

    describe("Manager Contract Management", function () {
      it("Should set scholarship manager successfully", async function () {
        const { core, scholarshipManager } = await loadFixture(deployFixture);
        
        // Deploy new scholarship manager
        const ScholarshipManagerFactory = await ethers.getContractFactory("ScholarshipManager");
        const newManager = await ScholarshipManagerFactory.deploy();
        await newManager.waitForDeployment();
        
        const oldManagerAddress = await scholarshipManager.getAddress();
        const newManagerAddress = await newManager.getAddress();
        
        const tx = await core.setScholarshipManager(newManagerAddress);
        
        expect(await core.scholarshipManager()).to.equal(newManagerAddress);
        
        // Check event emission
        await expect(tx)
          .to.emit(core, "ScholarshipManagerUpdated")
          .withArgs(oldManagerAddress, newManagerAddress);
      });

      it("Should set score manager successfully", async function () {
        const { core, scoreManager } = await loadFixture(deployFixture);
        
        // Deploy new score manager
        const ScoreManagerFactory = await ethers.getContractFactory("ScoreManager");
        const newManager = await ScoreManagerFactory.deploy();
        await newManager.waitForDeployment();
        
        const oldManagerAddress = await scoreManager.getAddress();
        const newManagerAddress = await newManager.getAddress();
        
        const tx = await core.setScoreManager(newManagerAddress);
        
        expect(await core.scoreManager()).to.equal(newManagerAddress);
        
        // Check event emission
        await expect(tx)
          .to.emit(core, "ScoreManagerUpdated")
          .withArgs(oldManagerAddress, newManagerAddress);
      });

      it("Should revert when non-owner tries to set scholarship manager", async function () {
        const { core, nonOwner } = await loadFixture(deployFixture);
        
        const ScholarshipManagerFactory = await ethers.getContractFactory("ScholarshipManager");
        const newManager = await ScholarshipManagerFactory.deploy();
        await newManager.waitForDeployment();
        
        await expect(core.connect(nonOwner).setScholarshipManager(await newManager.getAddress()))
          .to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("Should revert when non-owner tries to set score manager", async function () {
        const { core, nonOwner } = await loadFixture(deployFixture);
        
        const ScoreManagerFactory = await ethers.getContractFactory("ScoreManager");
        const newManager = await ScoreManagerFactory.deploy();
        await newManager.waitForDeployment();
        
        await expect(core.connect(nonOwner).setScoreManager(await newManager.getAddress()))
          .to.be.revertedWith("Ownable: caller is not the owner");
      });
    });

    describe("Ownership Management", function () {
      it("Should transfer ownership successfully", async function () {
        const { core, nonOwner } = await loadFixture(deployFixture);
        
        await core.transferOwnership(nonOwner.address);
        
        expect(await core.owner()).to.equal(nonOwner.address);
      });

      it("Should revert when non-owner tries to transfer ownership", async function () {
        const { core, nonOwner, student1 } = await loadFixture(deployFixture);
        
        await expect(core.connect(nonOwner).transferOwnership(student1.address))
          .to.be.revertedWith("Ownable: caller is not the owner");
      });
    });

    describe("View Functions", function () {
      it("Should return correct initial values", async function () {
        const { core, cirqaToken, asset1 } = await loadFixture(deployFixture);
        
        expect(await core.cirqaToken()).to.equal(await cirqaToken.getAddress());
        expect(await core.usdtToken()).to.equal(await asset1.getAddress());
        expect(await core.rewardRate()).to.equal(ethers.parseEther("1")); // Default 1:1
        expect(await core.protocolFee()).to.equal(100); // Default 1%
      });

      it("Should return correct token counter", async function () {
        const { core, student1 } = await loadFixture(deployFixture);
        
        expect(await core._tokenIds()).to.equal(0);
        
        await core.connect(student1).createScholarship("ipfs://test");
        
        expect(await core._tokenIds()).to.equal(1);
      });
    });
  });
});