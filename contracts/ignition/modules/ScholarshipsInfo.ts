/**
 * 🎓 SCHOLARSHIP DEBUG SCRIPT
 * 
 * This script provides comprehensive debugging information for all scholarships
 * in the Cirqa protocol. It displays detailed information about each scholarship
 * including NFT data, financial status, scores, ratings, and withdrawal history.
 * 
 * USAGE:
 * 1. Set environment variable: CIRQA_CORE=0x[your_core_contract_address]
 * 2. Run: npm run scholarships-info
 * 
 * OR directly with Hardhat:
 * CIRQA_CORE=0x... npx hardhat run ignition/modules/ScholarshipsInfo.ts
 * 
 * DISPLAYS:
 * - Protocol overview and settings
 * - Total scholarship statistics  
 * - Individual scholarship details:
 *   • NFT information (owner, metadata)
 *   • Financial data (balance, funded, withdrawn)
 *   • Score and rating information
 *   • Withdrawal history
 *   • CIRQA rewards
 * - Summary statistics
 * - Network information
 */

import { ethers } from "hardhat";
import { Core, ScholarshipManager, ScoreManager, CirqaToken } from "../../typechain-types";

async function main() {
  // Get the deployed contract address from environment variable
  const CIRQA_CORE = process.env.CIRQA_CORE;
  
  if (!CIRQA_CORE) {
    console.error("❌ Please set CIRQA_CORE environment variable");
    console.error("💡 Usage: CIRQA_CORE=0x... npx hardhat run ignition/modules/ScholarshipsInfo.ts");
    return;
  }

  console.log("🎓 Getting comprehensive scholarship information from Core contract:", CIRQA_CORE);
  console.log("=".repeat(100));

  try {
    // Connect to the deployed contracts
    const core = await ethers.getContractAt("Core", CIRQA_CORE) as Core;
    
    // Get contract addresses
    const scholarshipManagerAddress = await core.scholarshipManager();
    const scoreManagerAddress = await core.scoreManager();
    const cirqaTokenAddress = await core.cirqaToken();
    const usdtTokenAddress = await core.usdtToken();

    // Connect to manager contracts
    const scholarshipManager = await ethers.getContractAt("ScholarshipManager", scholarshipManagerAddress) as ScholarshipManager;
    const scoreManager = await ethers.getContractAt("ScoreManager", scoreManagerAddress) as ScoreManager;
    const cirqaToken = await ethers.getContractAt("CirqaToken", cirqaTokenAddress) as CirqaToken;

    // ============ BASIC PROTOCOL INFO ============
    console.log("\n📋 PROTOCOL OVERVIEW");
    console.log("Core Contract:", CIRQA_CORE);
    console.log("Scholarship Manager:", scholarshipManagerAddress);
    console.log("Score Manager:", scoreManagerAddress);
    console.log("CIRQA Token:", cirqaTokenAddress);
    console.log("USDT Token:", usdtTokenAddress);

    // Get protocol settings
    const rewardRate = await core.rewardRate();
    const protocolFee = await core.protocolFee();
    console.log("Reward Rate:", ethers.formatUnits(rewardRate, 18), "CIRQA per USDT");
    console.log("Protocol Fee:", (Number(protocolFee) / 100).toFixed(2), "%");

    // ============ REWARD CALCULATION DEBUG ============
    console.log("\n🧮 REWARD CALCULATION DEBUG");
    console.log("USDT Decimals: 6 (assumed from MockERC20)");
    console.log("CIRQA Decimals: 18 (standard ERC20)");
    console.log("Decimal Adjustment: 10^12 (to convert USDT to CIRQA decimals)");
    console.log("Reward Formula: (usdtAmount * 10^12 * rewardRate) / 1e18");
    
    // Example calculation
    const exampleUSDT = ethers.parseUnits("10", 6); // 10 USDT
    const decimalAdjustment = BigInt(10) ** BigInt(12);
    const exampleReward = (exampleUSDT * decimalAdjustment * rewardRate) / BigInt(1e18);
    console.log(`Example: 10 USDT funding = ${ethers.formatUnits(exampleReward, 18)} CIRQA reward`);

    // ============ SCHOLARSHIP STATISTICS ============
    console.log("\n📊 SCHOLARSHIP STATISTICS");
    const totalTokenIds = await core._tokenIds();
    console.log("Total Scholarships Created:", totalTokenIds.toString());

    // Get all scholarships from manager
    let allScholarships: bigint[] = [];
    try {
      allScholarships = await scholarshipManager.getAllScholarships();
      console.log("Active Scholarships in Manager:", allScholarships.length);
    } catch (error) {
      console.log("Could not get scholarships from manager, will iterate through token IDs");
      // Fallback: create array from 1 to totalTokenIds
      allScholarships = Array.from({ length: Number(totalTokenIds) }, (_, i) => BigInt(i + 1));
    }

    if (allScholarships.length === 0) {
      console.log("🔍 No scholarships found");
      return;
    }

    // ============ DETAILED SCHOLARSHIP INFORMATION ============
    console.log("\n🎓 DETAILED SCHOLARSHIP INFORMATION");
    console.log("=".repeat(100));

    for (let i = 0; i < allScholarships.length; i++) {
      const tokenId = allScholarships[i];
      console.log(`\n📚 SCHOLARSHIP #${tokenId}`);
      console.log("-".repeat(80));

      try {
        // ===== BASIC NFT INFO =====
        console.log("🏷️  NFT Information:");
        const owner = await core.ownerOf(tokenId);
        const tokenURI = await core.tokenURI(tokenId);
        console.log(`   Owner: ${owner}`);
        console.log(`   Metadata URI: ${tokenURI}`);

        // Parse metadata if it's JSON or IPFS
        if (tokenURI) {
          try {
            if (tokenURI.startsWith('ipfs://')) {
              console.log(`   📎 IPFS Link: https://ipfs.io/ipfs/${tokenURI.replace('ipfs://', '')}`);
            } else if (tokenURI.startsWith('{')) {
              // Try to parse as JSON
              const metadata = JSON.parse(tokenURI);
              console.log(`   📋 Metadata Preview:`);
              if (metadata.name) console.log(`      Name: ${metadata.name}`);
              if (metadata.description) console.log(`      Description: ${metadata.description.substring(0, 100)}...`);
              if (metadata.image) console.log(`      Image: ${metadata.image}`);
            }
          } catch (e) {
            console.log(`   📋 Metadata: ${tokenURI.substring(0, 100)}...`);
          }
        }

        // ===== FINANCIAL INFO =====
        console.log("\n💰 Financial Information:");
        try {
          const scholarshipData = await scholarshipManager.getScholarshipData(tokenId);
          console.log(`   Current Balance: ${ethers.formatUnits(scholarshipData.currentBalance, 6)} USDT`);
          console.log(`   Total Funded: ${ethers.formatUnits(scholarshipData.totalFunded, 6)} USDT`);
          console.log(`   Total Withdrawn: ${ethers.formatUnits(scholarshipData.totalWithdrawn, 6)} USDT`);
          console.log(`   Creation Timestamp: ${new Date(Number(scholarshipData.createdAt) * 1000).toLocaleString()}`);

          // Calculate scholarship status
          const currentBalance = Number(ethers.formatUnits(scholarshipData.currentBalance, 6));
          const totalFunded = Number(ethers.formatUnits(scholarshipData.totalFunded, 6));
          
          let status = "🔴 Unfunded";
          if (currentBalance > 0) {
            status = "🟢 Available for Funding";
          } else if (totalFunded > 0) {
            status = "🟡 Fully Withdrawn";
          }
          console.log(`   Status: ${status}`);

        } catch (error) {
          console.log(`   ❌ Could not get financial data: ${error instanceof Error ? error.message : String(error)}`);
        }

        // ===== WITHDRAWAL HISTORY =====
        console.log("\n📤 Withdrawal History:");
        try {
          const withdrawalHistory = await scholarshipManager.getWithdrawalHistory(tokenId);
          if (withdrawalHistory.length > 0) {
            console.log(`   Total Withdrawals: ${withdrawalHistory.length}`);
            withdrawalHistory.slice(0, 3).forEach((withdrawal, idx) => {
              console.log(`   #${idx + 1}: ${ethers.formatUnits(withdrawal.amount, 6)} USDT at ${new Date(Number(withdrawal.timestamp) * 1000).toLocaleString()}`);
            });
            if (withdrawalHistory.length > 3) {
              console.log(`   ... and ${withdrawalHistory.length - 3} more withdrawals`);
            }
          } else {
            console.log(`   No withdrawals yet`);
          }
        } catch (error) {
          console.log(`   ❌ Could not get withdrawal history: ${error instanceof Error ? error.message : String(error)}`);
        }

        // ===== SCORE & RATING INFO =====
        console.log("\n⭐ Score & Rating Information:");
        try {
          const scholarshipScore = await scoreManager.getScholarshipScore(tokenId);
          const totalRatingTokens = await scoreManager.getTotalRatingTokens(tokenId);
          const ratingCount = await scoreManager.getRatingCount(tokenId);
          
          console.log(`   Average Score: ${(Number(scholarshipScore) / 100).toFixed(2)}/10`);
          console.log(`   Total Ratings: ${ratingCount.toString()}`);
          console.log(`   Total CIRQA Used: ${ethers.formatUnits(totalRatingTokens, 18)} CIRQA`);

          if (Number(ratingCount) > 0) {
            console.log(`   💡 Weighted by: ${ethers.formatUnits(totalRatingTokens, 18)} CIRQA tokens`);
          } else {
            console.log(`   📝 No ratings yet`);
          }
        } catch (error) {
          console.log(`   ❌ Could not get score data: ${error instanceof Error ? error.message : String(error)}`);
        }

        // ===== CIRQA REWARDS =====
        console.log("\n🎁 CIRQA Rewards:");
        try {
          const cirqaBalance = await cirqaToken.balanceOf(owner);
          console.log(`   Owner CIRQA Balance: ${ethers.formatUnits(cirqaBalance, 18)} CIRQA`);
        } catch (error) {
          console.log(`   ❌ Could not get CIRQA balance: ${error instanceof Error ? error.message : String(error)}`);
        }

      } catch (error) {
        console.log(`❌ Error getting data for scholarship #${tokenId}:`);
        console.log(`   ${error instanceof Error ? error.message : String(error)}`);
      }

      // Add separator between scholarships
      if (i < allScholarships.length - 1) {
        console.log("\n" + "·".repeat(80));
      }
    }

    // ============ SUMMARY STATISTICS ============
    console.log("\n" + "=".repeat(100));
    console.log("📈 SUMMARY STATISTICS");

    try {
      let totalFundedSum = BigInt(0);
      let totalWithdrawnSum = BigInt(0);
      let totalCurrentBalance = BigInt(0);
      let scholarshipsWithRatings = 0;
      let totalRatings = BigInt(0);
      let activeScholarships = 0;

      for (const tokenId of allScholarships) {
        try {
          const scholarshipData = await scholarshipManager.getScholarshipData(tokenId);
          totalFundedSum += scholarshipData.totalFunded;
          totalWithdrawnSum += scholarshipData.totalWithdrawn;
          totalCurrentBalance += scholarshipData.currentBalance;
          
          if (scholarshipData.currentBalance > 0) {
            activeScholarships++;
          }

          const ratingCount = await scoreManager.getRatingCount(tokenId);
          if (ratingCount > 0) {
            scholarshipsWithRatings++;
            totalRatings += ratingCount;
          }
        } catch (e) {
          // Skip scholarships with errors
        }
      }

      console.log(`Total Scholarships: ${allScholarships.length}`);
      console.log(`Active (Funded) Scholarships: ${activeScholarships}`);
      console.log(`Scholarships with Ratings: ${scholarshipsWithRatings}`);
      console.log(`Total USDT Funded: ${ethers.formatUnits(totalFundedSum, 6)} USDT`);
      console.log(`Total USDT Withdrawn: ${ethers.formatUnits(totalWithdrawnSum, 6)} USDT`);
      console.log(`Total Current Balance: ${ethers.formatUnits(totalCurrentBalance, 6)} USDT`);
      console.log(`Total Ratings Given: ${totalRatings.toString()}`);

      // Calculate percentages
      if (allScholarships.length > 0) {
        const activePercentage = (activeScholarships / allScholarships.length * 100).toFixed(1);
        const ratedPercentage = (scholarshipsWithRatings / allScholarships.length * 100).toFixed(1);
        console.log(`Active Rate: ${activePercentage}%`);
        console.log(`Rating Rate: ${ratedPercentage}%`);
      }

    } catch (error) {
      console.log("❌ Error calculating summary statistics:", error instanceof Error ? error.message : String(error));
    }

    // ============ NETWORK INFO ============
    console.log("\n🌐 NETWORK INFO");
    const network = await ethers.provider.getNetwork();
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
    console.log(`Current Block: ${blockNumber}`);
    console.log(`Timestamp: ${new Date().toLocaleString()}`);

  } catch (error) {
    console.error("❌ Error getting scholarship information:", error);
  }

  console.log("\n" + "=".repeat(100));
  console.log("✅ Scholarship information retrieval completed!");
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });