import { ethers } from "hardhat";

const PROTOCOL_ADDRESS = "0x3890D4c8CfEe3B7F338ff12A8b4B13d80c7201EB";

// No longer updating allocation points, only updating CIRQA per second

const NEW_CIRQA_PER_SECOND = "11574074074074000"; // ~1000 CIRQA per day

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
        console.error(`The 'updateCirqaPerSecond' function requires the 'onlyOwner' modifier.`);
        console.error(`Please run this script with the owner account.`);
        return;
    }

    // Get current CIRQA per second rate (for information only)
    const currentCirqaPerSecond = await cirqaProtocol.cirqaPerSecond();
    console.log(`Current CIRQA per second: ${currentCirqaPerSecond} (${ethers.formatEther(currentCirqaPerSecond)} CIRQA/sec)`);
    console.log(`Current daily reward: ~${Number(ethers.formatEther(currentCirqaPerSecond)) * 86400} CIRQA/day`);

    // Get information about existing assets (for information only)
    const existingAssetsLength = await cirqaProtocol.getAssetsLength();
    console.log(`Found ${existingAssetsLength} existing assets.`);

    // Get current total allocation points (for information only)
    const currentTotalAllocPoint = await cirqaProtocol.totalAllocPoint();
    console.log(`Current total allocation points: ${currentTotalAllocPoint}`);

    // Display summary of current reward distribution
    console.log("\nCurrent reward distribution (for information only):");
    console.log(`Total allocation points: ${currentTotalAllocPoint}`);
    console.log(`CIRQA per second: ${currentCirqaPerSecond} (${ethers.formatEther(currentCirqaPerSecond)} CIRQA/sec)`);
    console.log(`Daily CIRQA distribution: ~${Number(ethers.formatEther(currentCirqaPerSecond)) * 86400} CIRQA/day`);

    // Update CIRQA per second
    console.log("\nUpdating CIRQA per second rate...");
    console.log(`New CIRQA per second: ${NEW_CIRQA_PER_SECOND} (${ethers.formatEther(NEW_CIRQA_PER_SECOND)} CIRQA/sec)`);
    console.log(`New daily reward: ~${Number(ethers.formatEther(NEW_CIRQA_PER_SECOND)) * 86400} CIRQA/day`);
    

    try {
        const tx = await cirqaProtocol.updateCirqaPerSecond(NEW_CIRQA_PER_SECOND);
        await tx.wait();
        console.log(`✅ Successfully updated CIRQA per second rate`);
        
        // Verify the changes
        const newCirqaPerSecond = await cirqaProtocol.cirqaPerSecond();
        console.log(`\nVerified new CIRQA per second: ${newCirqaPerSecond} (${ethers.formatEther(newCirqaPerSecond)} CIRQA/sec)`);
        console.log(`Verified daily reward: ~${Number(ethers.formatEther(newCirqaPerSecond)) * 86400} CIRQA/day`);
        
        if (newCirqaPerSecond.toString() === NEW_CIRQA_PER_SECOND) {
            console.log(`✅ CIRQA per second successfully updated`);
        } else {
            console.log(`⚠️ CIRQA per second did not update correctly. Please check for errors above.`);
        }
    } catch (error) {
        console.error(`❌ Failed to update CIRQA per second:`, error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});