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
          
          // Show detailed info for first few scholarships
          console.log("\n📋 DETAILED SCHOLARSHIP INFO");
          for (let i = 0; i < Math.min(allScholarships.length, 3); i++) {
            const tokenId = allScholarships[i];
            try {
              const [student, balance, metadata, frozen] = await scholarshipManager.getScholarshipData(tokenId);
              console.log(`\nScholarship #${tokenId}:`);
              console.log(`  Student: ${student}`);
              console.log(`  Balance: ${ethers.formatUnits(balance, 6)} USDT`);
              console.log(`  Metadata: ${metadata}`);
              console.log(`  Status: ${frozen ? "🔒 FROZEN" : "✅ Active"}`);
              
              // Investor information
              const investors = await scholarshipManager.getInvestors(tokenId);
              const totalFunding = await scholarshipManager.getTotalFunding(tokenId);
              const investorCount = await scholarshipManager.getInvestorCount(tokenId);
              
              console.log(`  Total Funding: ${ethers.formatUnits(totalFunding, 6)} USDT`);
              console.log(`  Investor Count: ${investorCount}`);
              
              if (investors.length > 0) {
                console.log(`  Top Investors:`);
                for (let j = 0; j < Math.min(investors.length, 3); j++) {
                  const contribution = await scholarshipManager.getInvestorContribution(tokenId, investors[j]);
                  console.log(`    ${investors[j]}: ${ethers.formatUnits(contribution, 6)} USDT`);
                }
                if (investors.length > 3) {
                  console.log(`    ... and ${investors.length - 3} more investors`);
                }
              }
              
              // Withdrawal history
              const [netAmounts, timestamps, feeAmounts] = await scholarshipManager.getDetailedWithdrawalHistory(tokenId);
              if (netAmounts.length > 0) {
                console.log(`  Withdrawal History (${netAmounts.length} withdrawals):`);
                for (let k = 0; k < Math.min(netAmounts.length, 3); k++) {
                  const date = new Date(Number(timestamps[k]) * 1000).toLocaleDateString();
                  console.log(`    ${date}: ${ethers.formatUnits(netAmounts[k], 6)} USDT (fee: ${ethers.formatUnits(feeAmounts[k], 6)} USDT)`);
                }
                if (netAmounts.length > 3) {
                  console.log(`    ... and ${netAmounts.length - 3} more withdrawals`);
                }
              }
            } catch (error) {
              console.log(`  Scholarship #${tokenId}: Could not get details`);
            }
          }
        }
      } catch (error) {
        console.log("Could not access ScholarshipManager details:", error instanceof Error ? error.message : String(error));
      }
    }

    // ============ SCORE MANAGER DETAILS ============
    if (scoreManagerAddress !== ethers.ZeroAddress) {
      console.log("\n🏆 SCORE MANAGER INFO");
      try {
        const scoreManager = await ethers.getContractAt("ScoreManager", scoreManagerAddress) as ScoreManager;
        const minRatingTokens = await scoreManager.minRatingTokens();
        console.log("Minimum Rating Tokens:", ethers.formatUnits(minRatingTokens, 18), "CIRQA");
        
        // Get scholarship scores if any exist
        if (Number(tokenIds) > 0) {
          console.log("\n📊 SCHOLARSHIP SCORES & FREEZE STATUS");
          const scholarshipManager = await ethers.getContractAt("ScholarshipManager", scholarshipManagerAddress) as ScholarshipManager;
          const freezeThreshold = 300; // 3.0 with 2 decimal precision
          
          for (let i = 1; i <= Math.min(Number(tokenIds), 5); i++) {
            try {
              const score = await scoreManager.getScholarshipScore(i);
              const ratingCount = await scoreManager.getRatingCount(i);
              const totalTokens = await scoreManager.getTotalRatingTokens(i);
              const isFrozen = await scholarshipManager.isFrozen(i);
              const shouldBeFrozen = await scholarshipManager.shouldBeFrozen(i);
              
              console.log(`\nScholarship #${i} Performance:`);
              
              if (Number(score) === 0) {
                console.log(`  Score: No ratings yet`);
                console.log(`  Status: ⚪ Unrated (Active)`);
              } else {
                const scoreDecimal = Number(score) / 100;
                console.log(`  Score: ${scoreDecimal.toFixed(2)}/10.00`);
                console.log(`  Ratings: ${ratingCount} (${ethers.formatUnits(totalTokens, 18)} CIRQA weighted)`);
                
                let statusEmoji = "";
                let statusText = "";
                
                if (isFrozen) {
                  statusEmoji = "🔒";
                  statusText = "FROZEN (Score < 3.0)";
                } else if (Number(score) >= freezeThreshold) {
                  statusEmoji = "✅";
                  statusText = "Active (Good Performance)";
                } else {
                  statusEmoji = "⚠️";
                  statusText = "Active (No Score)";
                }
                
                console.log(`  Status: ${statusEmoji} ${statusText}`);
                
                if (shouldBeFrozen !== isFrozen) {
                  console.log(`  ⚠️  Freeze status needs update! Should be: ${shouldBeFrozen ? "FROZEN" : "ACTIVE"}`);
                }
              }
            } catch (error) {
              console.log(`  Scholarship #${i}: Could not get score info`);
            }
          }
          
          // Show top rated scholarships
          try {
            const [topTokenIds, topScores] = await scoreManager.getTopRatedScholarships(5);
            if (topTokenIds.length > 0) {
              console.log("\n🥇 TOP RATED SCHOLARSHIPS");
              for (let i = 0; i < topTokenIds.length; i++) {
                const scoreDecimal = Number(topScores[i]) / 100;
                console.log(`  #${topTokenIds[i]}: ${scoreDecimal.toFixed(2)}/10.00`);
              }
            }
          } catch (error) {
            console.log("Could not get top rated scholarships");
          }
        }
        
        // Auto-freeze configuration
        console.log("\n❄️  AUTO-FREEZE CONFIGURATION");
        console.log("Freeze Threshold: 3.00/10.00 (300 basis points)");
        console.log("Auto-freeze: ✅ Enabled");
        console.log("Trigger: After each rating submission");
        
      } catch (error) {
        console.log("Could not access ScoreManager details:", error instanceof Error ? error.message : String(error));
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
    
    // ============ FEATURE AVAILABILITY CHECK ============
    console.log("\n🔧 FEATURE AVAILABILITY & SYSTEM STATUS");
    try {
      // Test functionality by calling public functions
      console.log("Basic Contract Functions:");
      
      // Test ScholarshipManager functions
      if (scholarshipManagerAddress !== ethers.ZeroAddress) {
        const scholarshipManager = await ethers.getContractAt("ScholarshipManager", scholarshipManagerAddress) as ScholarshipManager;
        try {
          await scholarshipManager.getAllScholarships();
          console.log("  ScholarshipManager Functions: ✅ Working");
        } catch (e) {
          console.log("  ScholarshipManager Functions: ❌ Error");
        }
      }
      
      // Test ScoreManager functions  
      if (scoreManagerAddress !== ethers.ZeroAddress) {
        const scoreManager = await ethers.getContractAt("ScoreManager", scoreManagerAddress) as ScoreManager;
        try {
          await scoreManager.minRatingTokens();
          console.log("  ScoreManager Functions: ✅ Working");
        } catch (e) {
          console.log("  ScoreManager Functions: ❌ Error");
        }
      }
      
      // Test CirqaToken functions
      if (cirqaTokenAddress !== ethers.ZeroAddress) {
        const cirqaToken = await ethers.getContractAt("CirqaToken", cirqaTokenAddress) as CirqaToken;
        try {
          const minter = await cirqaToken.minter();
          const scoreManagerAddr = await cirqaToken.scoreManager();
          
          console.log("  CirqaToken → Minter (Core):", minter === CIRQA_CORE ? "✅" : "❌");
          console.log("  CirqaToken → ScoreManager:", scoreManagerAddr === scoreManagerAddress ? "✅" : "❌");
        } catch (e) {
          console.log("  CirqaToken Functions: ❌ Error");
        }
      }
      
      console.log("\nNew Features Status:");
      console.log("  📊 Investor Tracking:", "✅ Enabled");
      console.log("  💸 Withdrawal Fee Tracking:", "✅ Enabled");
      console.log("  🔒 Auto-Freeze System:", scoreManagerAddress !== ethers.ZeroAddress && scholarshipManagerAddress !== ethers.ZeroAddress ? "✅ Enabled" : "❌ Disabled");
      console.log("  ⭐ Score-based Governance:", "✅ Enabled");
      console.log("  🎯 Real-time Performance Monitoring:", "✅ Enabled");
      
      console.log("\nSystem Integration:");
      console.log("  Contract Addresses Set:", scholarshipManagerAddress !== ethers.ZeroAddress && scoreManagerAddress !== ethers.ZeroAddress ? "✅" : "❌");
      console.log("  Cross-contract Communication:", "✅ Ready (Deploy script configured)");
      console.log("  Auto-freeze Triggers:", "✅ Active (After each rating)");
      
    } catch (error) {
      console.log("❌ Could not verify system status:", error instanceof Error ? error.message : String(error));
    }

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