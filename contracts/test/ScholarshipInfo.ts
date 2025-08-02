import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { CirqaProtocol, CirqaToken, MockERC20 } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ScholarshipInfo", function () {
  let owner: HardhatEthersSigner, student1: HardhatEthersSigner, student2: HardhatEthersSigner, investor: HardhatEthersSigner;
  let cirqaToken: CirqaToken;
  let protocol: CirqaProtocol;
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

    // Deploy CirqaProtocol
    const CirqaProtocolFactory = await ethers.getContractFactory("CirqaProtocol");
    protocol = await CirqaProtocolFactory.deploy(await cirqaToken.getAddress(), await asset1.getAddress());
    await protocol.waitForDeployment();

    // Set minter
    await cirqaToken.setMinter(await protocol.getAddress());

    // Create scholarships
    const metadata1 = "ipfs://QmTest1";
    const metadata2 = "ipfs://QmTest2";
    await protocol.connect(student1).createScholarship(metadata1);
    await protocol.connect(student2).createScholarship(metadata2);

    // Fund the first scholarship
    const fundAmount = ethers.parseEther("1000"); // 1000 tokens
    await asset1.mint(investor.address, fundAmount * 2n);
    await asset1.connect(investor).approve(await protocol.getAddress(), fundAmount * 2n);
    await protocol.connect(investor).fundScholarship(1, fundAmount);

    return { 
      protocol, 
      cirqaToken, 
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
        protocol, 
        student1, 
        metadata1, 
        fundAmount 
      } = await loadFixture(deployScholarshipFixture);

      const scholarship = await protocol.scholarships(1);
      
      expect(scholarship.student).to.equal(student1.address);
      expect(scholarship.balance).to.equal(fundAmount);
      expect(scholarship.metadata).to.equal(metadata1);
    });

    it("Should track multiple scholarships correctly", async function () {
      const { 
        protocol, 
        student1, 
        student2, 
        investor,
        asset1,
        metadata1, 
        metadata2, 
        fundAmount 
      } = await loadFixture(deployScholarshipFixture);

      // Fund the second scholarship
      await protocol.connect(investor).fundScholarship(2, fundAmount);

      const scholarship1 = await protocol.scholarships(1);
      const scholarship2 = await protocol.scholarships(2);

      // Verify first scholarship
      expect(scholarship1.student).to.equal(student1.address);
      expect(scholarship1.balance).to.equal(fundAmount);
      expect(scholarship1.metadata).to.equal(metadata1);

      // Verify second scholarship
      expect(scholarship2.student).to.equal(student2.address);
      expect(scholarship2.balance).to.equal(fundAmount);
      expect(scholarship2.metadata).to.equal(metadata2);
    });

    it("Should update balance after withdrawal", async function () {
      const { 
        protocol, 
        student1, 
        fundAmount 
      } = await loadFixture(deployScholarshipFixture);

      const withdrawAmount = ethers.parseEther("300");
      await protocol.connect(student1).withdrawFunds(1, withdrawAmount);

      const scholarship = await protocol.scholarships(1);
      expect(scholarship.balance).to.equal(fundAmount - withdrawAmount);
    });

    it("Should update balance after additional funding", async function () {
      const { 
        protocol, 
        asset1, 
        investor, 
        fundAmount 
      } = await loadFixture(deployScholarshipFixture);

      const additionalFunding = ethers.parseEther("300");
      await asset1.mint(investor.address, additionalFunding);
      await asset1.connect(investor).approve(await protocol.getAddress(), additionalFunding);
      await protocol.connect(investor).fundScholarship(1, additionalFunding);

      const scholarship = await protocol.scholarships(1);
      expect(scholarship.balance).to.equal(fundAmount + additionalFunding);
    });

  });
});