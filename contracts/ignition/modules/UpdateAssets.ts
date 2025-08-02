import { ethers } from "hardhat";

const PROTOCOL_ADDRESS = "0x6f6A53069f1894D44032424AdB2c173C4d745526";

// Reduced allocation points for existing assets
const ASSETS_TO_UPDATE = [
    { pid: 0, allocPoint: 50 },  // Wrapped KII (native) - reduced from 100
    { pid: 1, allocPoint: 100 }, // Wrapped BTC - reduced from 200
    { pid: 2, allocPoint: 150 }, // USDC - reduced from 300
    { pid: 3, allocPoint: 200 }  // USDT - reduced from 400
];

// Reduced CIRQA per second (significantly reduced)
// Original: 158e15 (~0.158 CIRQA/sec = ~13,651.20 CIRQA/day)
// New: 1e12 (0.000001 CIRQA/sec = ~0.0864 CIRQA/day)
const NEW_CIRQA_PER_SECOND = "1000000000000"; // Using string format with a very small value

async function main() {
    const [signer] = await ethers.getSigners();
    const cirqaProtocol = await ethers.getContractAt("CirqaProtocol", PROTOCOL_ADDRESS);

    console.log(`Checking protocol information: ${PROTOCOL_ADDRESS}`);
    console.log(`Script running with account: ${signer.address}`);

    // Check if the signer is the owner of the contract
    const contractOwner = await cirqaProtocol.owner();
    console.log(`Contract owner: ${contractOwner}`);
    const isOwner = contractOwner.toLowerCase() === signer.address.toLowerCase();
    console.log(`Is signer the owner? ${isOwner}`);

    if (!isOwner) {
        console.error(`ERROR: The signer account is not the owner of the contract.`);
        console.error(`The 'set' function requires the 'onlyOwner' modifier.`);
        console.error(`Please run this script with the owner account.`);
        return;
    }

    // Get current CIRQA per second rate (for information only)
    const currentCirqaPerSecond = await cirqaProtocol.cirqaPerSecond();
    console.log(`Current CIRQA per second: ${currentCirqaPerSecond} (${ethers.formatEther(currentCirqaPerSecond)} CIRQA/sec)`);
    console.log(`Current daily reward: ~${Number(ethers.formatEther(currentCirqaPerSecond)) * 86400} CIRQA/day`);

    // Get information about existing assets
    const existingAssetsLength = await cirqaProtocol.getAssetsLength();
    console.log(`Found ${existingAssetsLength} existing assets.`);

    // Get current total allocation points
    const currentTotalAllocPoint = await cirqaProtocol.totalAllocPoint();
    console.log(`Current total allocation points: ${currentTotalAllocPoint}`);

    // Get information about each asset
    for (let i = 0; i < existingAssetsLength; i++) {
        const assetInfo = await cirqaProtocol.assetInfo(i);
        console.log(`Asset ${i} information:`);
        console.log(`  - Allocation points: ${assetInfo.allocPoint}`);
        console.log(`  - Last reward time: ${assetInfo.lastRewardTime}`);
        console.log(`  - Accumulated CIRQA per share: ${assetInfo.accCirqaPerShare}`);
    }

    // Update allocation points for each asset
    console.log("\nUpdating allocation points for assets...");
    let totalNewAllocPoints = 0;
    
    for (const asset of ASSETS_TO_UPDATE) {
        if (asset.pid < existingAssetsLength) {
            const assetInfo = await cirqaProtocol.assetInfo(asset.pid);
            console.log(`Updating asset ${asset.pid} allocation points: ${assetInfo.allocPoint} -> ${asset.allocPoint}`);
            
            // Call the set function to update allocation points
            try {
                const tx = await cirqaProtocol.set(asset.pid, asset.allocPoint, true);
                await tx.wait();
                console.log(`✅ Successfully updated asset ${asset.pid} allocation points`);
                totalNewAllocPoints += asset.allocPoint;
            } catch (error) {
                console.error(`❌ Failed to update asset ${asset.pid}:`, error);
            }
        } else {
            console.log(`⚠️ Asset ${asset.pid} does not exist, skipping...`);
        }
    }
    
    console.log("\nAllocation points update completed.");
    console.log(`New expected total allocation points: ${totalNewAllocPoints}`);
    
    // Verify the changes
    const newTotalAllocPoint = await cirqaProtocol.totalAllocPoint();
    console.log(`Actual new total allocation points: ${newTotalAllocPoint}`);
    
    if (newTotalAllocPoint.toString() !== currentTotalAllocPoint.toString()) {
        console.log(`✅ Total allocation points successfully changed from ${currentTotalAllocPoint} to ${newTotalAllocPoint}`);
    } else {
        console.log(`⚠️ Total allocation points did not change. Please check for errors above.`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});