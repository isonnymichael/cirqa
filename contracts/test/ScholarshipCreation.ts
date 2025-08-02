import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { CirqaProtocol, CirqaToken, MockERC20 } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ScholarshipCreation", function () {
  let owner: HardhatEthersSigner, student: HardhatEthersSigner;
  let cirqaToken: CirqaToken;
  let protocol: CirqaProtocol;
  let asset1: MockERC20;

  async function deployScholarshipFixture() {
    [owner, student] = await ethers.getSigners();

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

    return { protocol, cirqaToken, asset1, owner, student };
  }

  describe("Scholarship Creation", function () {
    it("Should create a new scholarship NFT", async function () {
      const { protocol, student } = await loadFixture(deployScholarshipFixture);
      const metadata = "ipfs://QmTest";

      await expect(protocol.connect(student).createScholarship(metadata))
        .to.emit(protocol, "ScholarshipCreated")
        .withArgs(1, student.address, metadata);

      const scholarship = await protocol.scholarships(1);
      expect(scholarship.student).to.equal(student.address);
      expect(scholarship.balance).to.equal(0);
      expect(scholarship.metadata).to.equal(metadata);
    });

    it("Should increment token ID correctly", async function () {
      const { protocol, student } = await loadFixture(deployScholarshipFixture);
      
      await protocol.connect(student).createScholarship("ipfs://QmTest1");
      await protocol.connect(student).createScholarship("ipfs://QmTest2");
      
      const scholarship1 = await protocol.scholarships(1);
      const scholarship2 = await protocol.scholarships(2);
      
      expect(scholarship1.metadata).to.equal("ipfs://QmTest1");
      expect(scholarship2.metadata).to.equal("ipfs://QmTest2");
    });

    it("Should store correct token URI", async function () {
      const { protocol, student } = await loadFixture(deployScholarshipFixture);
      const metadata = "ipfs://QmTest";
      
      await protocol.connect(student).createScholarship(metadata);
      
      expect(await protocol.tokenURI(1)).to.equal(metadata);
    });

    it("Should set the right owner", async function () {
      const { protocol } = await loadFixture(deployScholarshipFixture);
      expect(await protocol.owner()).to.equal(owner.address);
    });

    it("Should set the correct CIRQA token address", async function () {
      const { protocol, cirqaToken } = await loadFixture(deployScholarshipFixture);
      expect(await protocol.cirqaToken()).to.equal(await cirqaToken.getAddress());
    });
  });
});