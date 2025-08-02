import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { CirqaProtocol, CirqaToken, MockERC20 } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ScholarshipFunding", function () {
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

    // Mint USDT to investor
    await asset1.mint(investor.address, ethers.parseEther("1000"));
    await asset1.connect(investor).approve(await protocol.getAddress(), ethers.MaxUint256);

    return { protocol, cirqaToken, asset1, owner, student, investor };
  }

  describe("Funding Operations", function () {
    it("Should allow funding a scholarship", async function () {
      const { protocol, asset1, investor } = await loadFixture(deployScholarshipFixture);
      const fundAmount = ethers.parseEther("100"); // 100 tokens

      await expect(protocol.connect(investor).fundScholarship(1, fundAmount))
        .to.emit(protocol, "ScholarshipFunded")
        .withArgs(1, investor.address, fundAmount);

      const scholarship = await protocol.scholarships(1);
      expect(scholarship.balance).to.equal(fundAmount);
    });

    it("Should reward investors with Cirqa tokens", async function () {
      const { protocol, cirqaToken, investor } = await loadFixture(deployScholarshipFixture);
      const fundAmount = ethers.parseEther("100"); // 100 tokens
      
      await protocol.connect(investor).fundScholarship(1, fundAmount);
      
      // Check reward (1:1 ratio as per contract)
      const expectedReward = ethers.parseEther("100"); // 100 Cirqa tokens
      expect(await cirqaToken.balanceOf(investor.address)).to.equal(expectedReward);
    });

    it("Should fail when funding non-existent scholarship", async function () {
      const { protocol, investor } = await loadFixture(deployScholarshipFixture);
      const fundAmount = ethers.parseEther("100");

      await expect(protocol.connect(investor).fundScholarship(999, fundAmount))
        .to.be.revertedWith("Scholarship does not exist");
    });

    it("Should fail when funding amount is zero", async function () {
      const { protocol, investor } = await loadFixture(deployScholarshipFixture);

      await expect(protocol.connect(investor).fundScholarship(1, 0))
        .to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should accumulate balance correctly with multiple fundings", async function () {
      const { protocol, investor } = await loadFixture(deployScholarshipFixture);
      const fundAmount1 = ethers.parseEther("100");
      const fundAmount2 = ethers.parseEther("50");

      await protocol.connect(investor).fundScholarship(1, fundAmount1);
      await protocol.connect(investor).fundScholarship(1, fundAmount2);

      const scholarship = await protocol.scholarships(1);
      expect(scholarship.balance).to.equal(fundAmount1 + fundAmount2);
    });
  });

  describe("USDT Contract Updates", function () {
    it("Should allow owner to update USDT contract", async function () {
      const { protocol, owner } = await loadFixture(deployScholarshipFixture);
      const MockERC20Factory = await ethers.getContractFactory("MockERC20");
      const newUsdt = await MockERC20Factory.deploy("USDT", "USDT", 6);
      await newUsdt.waitForDeployment();

      await expect(protocol.connect(owner).updateUSDTContract(await newUsdt.getAddress()))
        .to.emit(protocol, "USDTContractUpdated");

      expect(await protocol.usdtToken()).to.equal(await newUsdt.getAddress());
    });

    it("Should not allow non-owner to update USDT contract", async function () {
      const { protocol, investor } = await loadFixture(deployScholarshipFixture);
      const MockERC20Factory = await ethers.getContractFactory("MockERC20");
      const newUsdt = await MockERC20Factory.deploy("USDT", "USDT", 6);
      await newUsdt.waitForDeployment();

      await expect(protocol.connect(investor).updateUSDTContract(await newUsdt.getAddress()))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow owner to update reward rate", async function () {
      const { protocol, owner } = await loadFixture(deployScholarshipFixture);
      const newRate = ethers.parseEther("2"); // 2 Cirqa tokens per 1 USDT

      await protocol.connect(owner).updateRewardRate(newRate);
      expect(await protocol.rewardRate()).to.equal(newRate);
    });
  });
});