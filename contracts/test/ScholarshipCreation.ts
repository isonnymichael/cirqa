import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Core, CirqaToken, MockERC20, ScholarshipManager, ScoreManager } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ScholarshipCreation", function () {
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

    return { 
      core, 
      cirqaToken, 
      scholarshipManager,
      scoreManager,
      asset1, 
      owner, 
      student1, 
      student2, 
      investor
    };
  }

  describe("Scholarship Creation", function () {
    it("Should create a scholarship NFT successfully", async function () {
      const { core, student1, scholarshipManager } = await loadFixture(deployScholarshipFixture);
      
      const metadata = "ipfs://QmTestHash123";
      
      const tx = await core.connect(student1).createScholarship(metadata);
      
      // Check that the NFT was minted
      expect(await core.ownerOf(1)).to.equal(student1.address);
      expect(await core.tokenURI(1)).to.equal(metadata);
      
      // Check that scholarship was added to manager
      const studentScholarships = await scholarshipManager.getScholarshipsByStudent(student1.address);
      expect(studentScholarships.length).to.equal(1);
      expect(studentScholarships[0]).to.equal(1);
      
      // Check event emission
      await expect(tx)
        .to.emit(core, "ScholarshipCreated")
        .withArgs(1, student1.address, metadata);
    });

    it("Should increment token IDs correctly", async function () {
      const { core, student1, student2 } = await loadFixture(deployScholarshipFixture);
      
      const metadata1 = "ipfs://QmTestHash1";
      const metadata2 = "ipfs://QmTestHash2";
      
      await core.connect(student1).createScholarship(metadata1);
      await core.connect(student2).createScholarship(metadata2);
      
      expect(await core.ownerOf(1)).to.equal(student1.address);
      expect(await core.ownerOf(2)).to.equal(student2.address);
      expect(await core.tokenURI(1)).to.equal(metadata1);
      expect(await core.tokenURI(2)).to.equal(metadata2);
    });

    it("Should initialize scholarship in both managers", async function () {
      const { core, student1, scholarshipManager, scoreManager } = await loadFixture(deployScholarshipFixture);
      
      const metadata = "ipfs://QmTestHash";
      
      await core.connect(student1).createScholarship(metadata);
      
      // Check scholarship manager
      const isStudent = await scholarshipManager.isStudent(1, student1.address);
      expect(isStudent).to.be.true;
      
      // Check that scholarship is tracked
      const allScholarships = await scholarshipManager.getAllScholarships();
      expect(allScholarships.length).to.equal(1);
      expect(allScholarships[0]).to.equal(1);
    });

    it("Should allow multiple scholarships per student", async function () {
      const { core, student1, scholarshipManager } = await loadFixture(deployScholarshipFixture);
      
      const metadata1 = "ipfs://QmTestHash1";
      const metadata2 = "ipfs://QmTestHash2";
      
      await core.connect(student1).createScholarship(metadata1);
      await core.connect(student1).createScholarship(metadata2);
      
      const studentScholarships = await scholarshipManager.getScholarshipsByStudent(student1.address);
      expect(studentScholarships.length).to.equal(2);
      expect(studentScholarships[0]).to.equal(1);
      expect(studentScholarships[1]).to.equal(2);
      
      // Both NFTs should belong to the same student
      expect(await core.ownerOf(1)).to.equal(student1.address);
      expect(await core.ownerOf(2)).to.equal(student1.address);
    });

    it("Should handle empty metadata", async function () {
      const { core, student1 } = await loadFixture(deployScholarshipFixture);
      
      const emptyMetadata = "";
      
      await expect(core.connect(student1).createScholarship(emptyMetadata))
        .to.not.be.reverted;
        
      expect(await core.tokenURI(1)).to.equal(emptyMetadata);
    });

    it("Should support long metadata strings", async function () {
      const { core, student1 } = await loadFixture(deployScholarshipFixture);
      
      const longMetadata = "ipfs://QmTestHash" + "a".repeat(1000); // Very long metadata
      
      await expect(core.connect(student1).createScholarship(longMetadata))
        .to.not.be.reverted;
        
      expect(await core.tokenURI(1)).to.equal(longMetadata);
    });

    it("Should revert when scholarship manager is not set", async function () {
      const { cirqaToken, asset1, student1 } = await loadFixture(deployScholarshipFixture);
      
      // Deploy a new Core contract without setting managers
      const CoreFactory = await ethers.getContractFactory("Core");
      const newCore = await CoreFactory.deploy(await cirqaToken.getAddress(), await asset1.getAddress());
      await newCore.waitForDeployment();
      
      const metadata = "ipfs://QmTestHash";
      
      await expect(newCore.connect(student1).createScholarship(metadata))
        .to.be.reverted; // Should fail because scholarship manager is not set
    });
  });
});