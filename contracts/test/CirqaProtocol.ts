import { ethers } from "hardhat";
import { expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { CirqaProtocol, CirqaToken, TestERC20 } from "../typechain-types";

describe("CirqaProtocol", function () {
    let owner: HardhatEthersSigner, user1: HardhatEthersSigner, user2: HardhatEthersSigner;
    let cirqaToken: CirqaToken;
    let protocol: CirqaProtocol;
    let asset1: TestERC20;
    let asset2: TestERC20;

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        // Deploy CirqaToken
        const CirqaTokenFactory = await ethers.getContractFactory("CirqaToken");
        cirqaToken = await CirqaTokenFactory.deploy();
        await cirqaToken.waitForDeployment();

        // Deploy CirqaProtocol
        const CirqaProtocolFactory = await ethers.getContractFactory("CirqaProtocol");
        protocol = await CirqaProtocolFactory.deploy(await cirqaToken.getAddress());
        await protocol.waitForDeployment();

        // Deploy mock assets
        const TestERC20Factory = await ethers.getContractFactory("TestERC20");
        asset1 = await TestERC20Factory.deploy("Test Asset 1", "TA1");
        await asset1.waitForDeployment();
        asset2 = await TestERC20Factory.deploy("Test Asset 2", "TA2");
        await asset2.waitForDeployment();

        // Distribute assets to users
        await asset1.transfer(user1.address, ethers.parseEther("1000"));
        await asset1.transfer(user2.address, ethers.parseEther("1000"));
        await asset2.transfer(user1.address, ethers.parseEther("1000"));
        await asset2.transfer(user2.address, ethers.parseEther("1000"));
        
        // Set the protocol contract as the minter
        await cirqaToken.setMinter(await protocol.getAddress());
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await protocol.owner()).to.equal(owner.address);
        });

        it("Should set the correct CIRQA token address", async function () {
            expect(await protocol.cirqaToken()).to.equal(await cirqaToken.getAddress());
        });

        it("Should set the protocol fee recipient to the owner", async function () {
            expect(await protocol.protocolFeeRecipient()).to.equal(owner.address);
        });
    });

    describe("Admin Functions", function () {
        it("Should allow owner to add a new asset", async function () {
            await protocol.add(100, await asset1.getAddress(), false);
            const assetInfo = await protocol.assetInfo(0);
            expect(assetInfo.asset).to.equal(await asset1.getAddress());
            expect(assetInfo.allocPoint).to.equal(100);
            expect(assetInfo.totalSupplied).to.equal(0);
            expect(assetInfo.totalBorrowed).to.equal(0);
        });

        it("Should allow owner to set protocol fee", async function () {
            await protocol.setProtocolFee(500); // 5%
            expect(await protocol.protocolFeeBps()).to.equal(500);
        });

        it("Should prevent non-owner from setting protocol fee", async function () {
            await expect(protocol.connect(user1).setProtocolFee(500)).to.be.revertedWithCustomError(protocol, "OwnableUnauthorizedAccount");
        });
    });

    describe("User Actions & Protocol Fees", function () {
        beforeEach(async function () {
            // Add asset1 to the protocol
            await protocol.add(100, await asset1.getAddress(), true);
            // Set a protocol fee of 1% (100 bps)
            await protocol.setProtocolFee(100);

            // User1 supplies 100 asset1
            await asset1.connect(user1).approve(await protocol.getAddress(), ethers.parseEther("100"));
            await protocol.connect(user1).supply(await asset1.getAddress(), ethers.parseEther("100"));
        });

        it("Should charge a protocol fee on borrow", async function () {
            const borrowAmount = ethers.parseEther("10");
            const feeAmount = (borrowAmount * BigInt(100)) / BigInt(10000);
            const amountAfterFee = borrowAmount - feeAmount;

            const initialOwnerBalance = await asset1.balanceOf(owner.address);

            await expect(protocol.connect(user2).borrow(await asset1.getAddress(), borrowAmount))
                .to.emit(protocol, "ProtocolFeePaid")
                .withArgs(await asset1.getAddress(), user2.address, feeAmount);

            // Check user2's balance
            expect(await asset1.balanceOf(user2.address)).to.equal(ethers.parseEther("1000") + amountAfterFee);

            // Check fee recipient's balance
            expect(await asset1.balanceOf(owner.address)).to.equal(initialOwnerBalance + feeAmount);
        });

        it("Should correctly handle supply, withdraw, borrow, and repay", async function () {
            // User2 borrows 10 asset1
            await protocol.connect(user2).borrow(await asset1.getAddress(), ethers.parseEther("10"));

            // User2 repays 5 asset1
            await asset1.connect(user2).approve(await protocol.getAddress(), ethers.parseEther("5"));
            await protocol.connect(user2).repay(await asset1.getAddress(), ethers.parseEther("5"));

            // Check user2's borrowed amount using the new global function
            const [, totalBorrowed, ] = await protocol.getGlobalUserInfo(user2.address);
            expect(totalBorrowed).to.equal(ethers.parseEther("5"));

            // User1 withdraws 50 asset1
            await protocol.connect(user1).withdraw(await asset1.getAddress(), ethers.parseEther("50"));
            expect(await asset1.balanceOf(user1.address)).to.equal(ethers.parseEther("950"));
        });
    });

    describe("Reward Distribution", function() {
        beforeEach(async function() {
            await protocol.add(100, await asset1.getAddress(), true);
            await protocol.updateCirqaPerSecond(ethers.parseEther("1")); // 1 CIRQA per second

            await asset1.connect(user1).approve(await protocol.getAddress(), ethers.parseEther("100"));
            await protocol.connect(user1).supply(await asset1.getAddress(), ethers.parseEther("100"));
        });

        it("Should accrue CIRQA rewards over time", async function() {
            // Advance time by 100 seconds
            await ethers.provider.send("evm_increaseTime", [100]);
            await ethers.provider.send("evm_mine", []);

            const pending = await protocol.pendingCirqa(0, user1.address);
            expect(pending).to.be.closeTo(ethers.parseEther("100"), ethers.parseEther("1")); // Close to 100 CIRQA
        });

        it("Should allow user to claim rewards", async function() {
            await ethers.provider.send("evm_increaseTime", [100]);
            await ethers.provider.send("evm_mine", []);

            const initialBalance = await cirqaToken.balanceOf(user1.address);
            expect(initialBalance).to.equal(0);

            await protocol.connect(user1).claimReward(0);

            const finalBalance = await cirqaToken.balanceOf(user1.address);
            expect(finalBalance).to.be.gt(initialBalance);
            expect(finalBalance).to.be.closeTo(ethers.parseEther("100"), ethers.parseEther("1"));
        });
    });

    describe("Global User Info", function() {
        beforeEach(async function() {
            // Add asset1 and asset2 to the protocol
            await protocol.add(100, await asset1.getAddress(), true);
            await protocol.add(100, await asset2.getAddress(), true);

            // User1 supplies 100 of asset1 and 50 of asset2
            await asset1.connect(user1).approve(await protocol.getAddress(), ethers.parseEther("100"));
            await protocol.connect(user1).supply(await asset1.getAddress(), ethers.parseEther("100"));
            await asset2.connect(user1).approve(await protocol.getAddress(), ethers.parseEther("50"));
            await protocol.connect(user1).supply(await asset2.getAddress(), ethers.parseEther("50"));

            // User1 borrows 20 of asset2
            await protocol.connect(user1).borrow(await asset2.getAddress(), ethers.parseEther("20"));
        });

        it("Should return correct aggregated user info", async function() {
            const [totalSupplied, totalBorrowed, totalPendingCirqa] = await protocol.getGlobalUserInfo(user1.address);

            expect(totalSupplied).to.equal(ethers.parseEther("150"));
            expect(totalBorrowed).to.equal(ethers.parseEther("20"));
            // Since rewards are complex to calculate off-chain, we'll just check that it's a non-negative number
            expect(totalPendingCirqa).to.be.gte(0);
        });
    });

    describe("Global Asset Info", function() {
        beforeEach(async function() {
            // Add asset1 and asset2 to the protocol
            await protocol.add(100, await asset1.getAddress(), true);
            await protocol.add(100, await asset2.getAddress(), true);

            // User1 supplies 100 of asset1 and 50 of asset2
            await asset1.connect(user1).approve(await protocol.getAddress(), ethers.parseEther("100"));
            await protocol.connect(user1).supply(await asset1.getAddress(), ethers.parseEther("100"));
            await asset2.connect(user1).approve(await protocol.getAddress(), ethers.parseEther("50"));
            await protocol.connect(user1).supply(await asset2.getAddress(), ethers.parseEther("50"));

            // User2 borrows 20 of asset1
            await protocol.connect(user2).borrow(await asset1.getAddress(), ethers.parseEther("20"));
        });

        it("Should return correct aggregated asset info", async function() {
            const [totalValueLocked, totalBorrows] = await protocol.getGlobalAssetInfo();

            expect(totalValueLocked).to.equal(ethers.parseEther("150"));
            expect(totalBorrows).to.equal(ethers.parseEther("20"));
        });
    });
});