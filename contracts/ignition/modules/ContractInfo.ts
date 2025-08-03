import { ethers } from "hardhat";
import { Core, ScholarshipManager, ScoreManager, CirqaToken } from "../../typechain-types";

async function main() {
  // Get the deployed contract address from environment variable or hardcode it
  const CIRQA_CORE = process.env.CIRQA_CORE;
  
  if (!CIRQA_CORE) {
    console.error("Please set CIRQA_CORE environment variable");
    return;
  }

  console.log("🔍 Getting comprehensive contract info from address:", CIRQA_CORE);
  console.log("=".repeat(80));

  // Connect to the deployed contract
  const core = await ethers.getContractAt("Core", CIRQA_CORE) as Core;

  try {
    // ============ BASIC CONTRACT INFO ============
    console.log("\n📋 BASIC CONTRACT INFO");
    console.log("Core Contract Address:", CIRQA_CORE);
    
    // ERC721 Info
    const name = await core.name();
    const symbol = await core.symbol();
    console.log("NFT Collection Name:", name);
    console.log("NFT Collection Symbol:", symbol);
    
    // Owner info
    const owner = await core.owner();
    console.log("Contract Owner:", owner);

    // ============ TOKEN ADDRESSES ============
    console.log("\n🪙 TOKEN ADDRESSES");
    const cirqaTokenAddress = await core.cirqaToken();
    const usdtTokenAddress = await core.usdtToken();
    console.log("Cirqa Token Address:", cirqaTokenAddress);
    console.log("USDT Token Address:", usdtTokenAddress);

    // ============ MANAGER ADDRESSES ============
    console.log("\n⚙️  MANAGER ADDRESSES");
    const scholarshipManagerAddress = await core.scholarshipManager();
    const scoreManagerAddress = await core.scoreManager();
    console.log("Scholarship Manager Address:", scholarshipManagerAddress);
    console.log("Score Manager Address:", scoreManagerAddress);

    // ============ PROTOCOL SETTINGS ============
    console.log("\n⚡ PROTOCOL SETTINGS");
    const rewardRate = await core.rewardRate();
    console.log("Reward Rate:", ethers.formatUnits(rewardRate, 18), "CIRQA per 1 USDT");
    
    const protocolFee = await core.protocolFee();
    console.log("Protocol Fee:", (Number(protocolFee) / 100).toFixed(2), "%", `(${protocolFee} basis points)`);

    // ============ SCHOLARSHIP STATS ============
    console.log("\n📊 SCHOLARSHIP STATISTICS");
    const tokenIds = await core._tokenIds();
    console.log("Total Scholarships Created:", tokenIds.toString());

    // Get scholarship details if any exist
    if (Number(tokenIds) > 0) {
      console.log("\n🎓 SCHOLARSHIP DETAILS");
      for (let i = 1; i <= Math.min(Number(tokenIds), 5); i++) {
        try {
          const tokenURI = await core.tokenURI(i);
          const ownerAddress = await core.ownerOf(i);
          console.log(`Scholarship #${i}:`);
          console.log(`  Owner: ${ownerAddress}`);
          console.log(`  Metadata: ${tokenURI}`);
        } catch (error) {
          console.log(`  Scholarship #${i}: Not found or burned`);
        }
      }
      if (Number(tokenIds) > 5) {
        console.log(`  ... and ${Number(tokenIds) - 5} more scholarships`);
      }
    }

    // ============ MANAGER CONTRACT DETAILS ============
    if (scholarshipManagerAddress !== ethers.ZeroAddress) {
      console.log("\n📚 SCHOLARSHIP MANAGER INFO");
      try {
        const scholarshipManager = await ethers.getContractAt("ScholarshipManager", scholarshipManagerAddress) as ScholarshipManager;
        const allScholarships = await scholarshipManager.getAllScholarships();
        console.log("Total Scholarships in Manager:", allScholarships.length);
        
        if (allScholarships.length > 0) {
          console.log("Scholarship IDs:", allScholarships.slice(0, 10).join(", "));
          if (allScholarships.length > 10) {
            console.log(`  ... and ${allScholarships.length - 10} more`);
          }
        }
      } catch (error) {
        console.log("Could not access ScholarshipManager details:", error instanceof Error ? error.message : String(error));
      }
    }

    // ============ TOKEN CONTRACT DETAILS ============
    if (cirqaTokenAddress !== ethers.ZeroAddress) {
      console.log("\n🪙 CIRQA TOKEN INFO");
      try {
        const cirqaToken = await ethers.getContractAt("CirqaToken", cirqaTokenAddress) as CirqaToken;
        const totalSupply = await cirqaToken.totalSupply();
        console.log("Total CIRQA Supply:", ethers.formatUnits(totalSupply, 18));
        
        // Check if Core contract has any CIRQA tokens
        const coreBalance = await cirqaToken.balanceOf(CIRQA_CORE);
        console.log("Core Contract CIRQA Balance:", ethers.formatUnits(coreBalance, 18));
      } catch (error) {
        console.log("Could not access CirqaToken details:", error instanceof Error ? error.message : String(error));
      }
    }

    if (usdtTokenAddress !== ethers.ZeroAddress) {
      console.log("\n💰 USDT TOKEN INFO");
      try {
        const usdtToken = await ethers.getContractAt("IERC20", usdtTokenAddress);
        const coreUsdtBalance = await usdtToken.balanceOf(CIRQA_CORE);
        
        // Try to get decimals (might fail for some tokens)
        let decimals = 6;
        try {
          // Cast to any to access decimals function that might not be in interface
          const decimalsCall = await (usdtToken as any).decimals();
          decimals = Number(decimalsCall);
        } catch (e) {
          console.log("Could not get USDT decimals, assuming 6");
        }
        
        console.log("Core Contract USDT Balance:", ethers.formatUnits(coreUsdtBalance, decimals));
        console.log("USDT Decimals:", decimals);
      } catch (error) {
        console.log("Could not access USDT details:", error instanceof Error ? error.message : String(error));
      }
    }

    // ============ NETWORK INFO ============
    console.log("\n🌐 NETWORK INFO");
    const network = await ethers.provider.getNetwork();
    console.log("Network Name:", network.name);
    console.log("Chain ID:", network.chainId.toString());
    
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log("Current Block Number:", blockNumber);

    // ============ CONTRACT VERIFICATION ============
    console.log("\n✅ CONTRACT VERIFICATION");
    console.log("Core Contract Code Size:", (await ethers.provider.getCode(CIRQA_CORE)).length / 2 - 1, "bytes");
    
    // Check if managers are properly set
    console.log("Scholarship Manager Set:", scholarshipManagerAddress !== ethers.ZeroAddress ? "✅" : "❌");
    console.log("Score Manager Set:", scoreManagerAddress !== ethers.ZeroAddress ? "✅" : "❌");
    console.log("Cirqa Token Set:", cirqaTokenAddress !== ethers.ZeroAddress ? "✅" : "❌");
    console.log("USDT Token Set:", usdtTokenAddress !== ethers.ZeroAddress ? "✅" : "❌");

  } catch (error) {
    console.error("❌ Error getting contract info:", error);
  }

  console.log("\n" + "=".repeat(80));
  console.log("✅ Contract info retrieval completed!");
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });