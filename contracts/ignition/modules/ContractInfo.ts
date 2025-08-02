import { ethers } from "hardhat";
import { CirqaProtocol } from "../../typechain-types";

async function main() {
  // Get the deployed contract address from environment variable or hardcode it
  const CIRQA_PROTOCOL_ADDRESS = process.env.CIRQA_PROTOCOL_ADDRESS;
  
  if (!CIRQA_PROTOCOL_ADDRESS) {
    console.error("Please set CIRQA_PROTOCOL_ADDRESS environment variable");
    return;
  }

  console.log("Getting contract info from address:", CIRQA_PROTOCOL_ADDRESS);

  // Connect to the deployed contract
  const cirqaProtocol = await ethers.getContractAt(
    "CirqaProtocol",
    CIRQA_PROTOCOL_ADDRESS
  ) as CirqaProtocol;

  try {
    // Get rewardRate
    const rewardRate = await cirqaProtocol.rewardRate();
    console.log("Reward Rate:", ethers.formatUnits(rewardRate, 18), "CIRQA per 1 USDT");

    // Get protocolFee
    const protocolFee = await cirqaProtocol.protocolFee();
    console.log("Protocol Fee:", (Number(protocolFee) / 100).toFixed(2), "%");

    // Try to get _tokenIds (this might fail if it's not accessible)
    try {
      // Note: Since _tokenIds is marked as public in the contract, we can access it
      const tokenIds = await cirqaProtocol._tokenIds();
      console.log("Current Token ID Counter:", tokenIds.toString());
    } catch (error) {
      console.error("Could not access _tokenIds directly. This might be because it's not accessible or the method signature is different.");
      
      // Alternative approach: Try to find the highest token ID by checking if tokens exist
      console.log("Trying alternative approach to find highest token ID...");
      let maxId = 0;
      let found = true;
      
      while (found && maxId < 1000) { // Limit to 1000 to avoid infinite loop
        try {
          const owner = await cirqaProtocol.ownerOf(maxId + 1);
          maxId++;
          if (maxId % 10 === 0) {
            console.log(`Found token ID ${maxId}, owner: ${owner}`);
          }
        } catch (e) {
          found = false;
        }
      }
      
      console.log("Highest token ID found:", maxId);
    }
  } catch (error) {
    console.error("Error getting contract info:", error);
  }
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });