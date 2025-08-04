/**
 * 🎓 COMPREHENSIVE SCHOLARSHIP ANALYSIS SCRIPT
 * 
 * This script provides comprehensive debugging and analysis information for all 
 * scholarships in the Cirqa protocol. It displays detailed information about 
 * each scholarship including new features like investor tracking, auto-freeze 
 * system, and withdrawal fee transparency.
 * 
 * USAGE:
 * 1. Set environment variable: CIRQA_CORE=0x[your_core_contract_address]
 * 2. Run: npm run scholarships-info
 * 
 * OR directly with Hardhat:
 * CIRQA_CORE=0x... npx hardhat run ignition/modules/ScholarshipsInfo.ts
 * 
 * DISPLAYS:
 * - Protocol overview and auto-freeze settings
 * - Total scholarship statistics with new metrics
 * - Individual scholarship details:
 *   • NFT information (owner, metadata)
 *   • Financial data (balance, funding, withdrawals, fees)
 *   • 👥 Investor tracking (contributors, amounts, percentages)
 *   • 📤 Detailed withdrawal history (net amounts, fees, dates)
 *   • ⭐ Score & rating information with freeze status
 *   • 🔒 Auto-freeze system status and analysis
 *   • 🎁 CIRQA rewards distribution
 * - Enhanced summary statistics (frozen rate, utilization, etc.)
 * - Network information
 * 
 * NEW FEATURES COVERED:
 * ✅ Investor transparency and tracking
 * ✅ Withdrawal fee breakdown and history
 * ✅ Auto-freeze based on performance scores (<3.0)
 * ✅ Real-time freeze status validation
 * ✅ Enhanced financial analytics
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
    
    // Auto-freeze configuration
    console.log("\n❄️  AUTO-FREEZE SYSTEM");
    console.log("Freeze Threshold: 3.00/10.00");
    console.log("Auto-freeze: ✅ Enabled");
    console.log("Trigger: After each rating submission");
    console.log("Benefits: Protects investors from poor-performing scholarships");

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
          const [student, balance, metadata, frozen] = await scholarshipManager.getScholarshipData(tokenId);
          const totalFunding = await scholarshipManager.getTotalFunding(tokenId);
          const investorCount = await scholarshipManager.getInvestorCount(tokenId);
          
          console.log(`   Student: ${student}`);
          console.log(`   Current Balance: ${ethers.formatUnits(balance, 6)} USDT`);
          console.log(`   Total Funding Received: ${ethers.formatUnits(totalFunding, 6)} USDT`);
          console.log(`   Number of Investors: ${investorCount}`);
          
          // Calculate total withdrawn from withdrawal history
          const [netAmounts, timestamps, feeAmounts] = await scholarshipManager.getDetailedWithdrawalHistory(tokenId);
          let totalWithdrawn = BigInt(0);
          let totalFees = BigInt(0);
          
          for (let i = 0; i < netAmounts.length; i++) {
            totalWithdrawn += netAmounts[i];
            totalFees += feeAmounts[i];
          }
          
          console.log(`   Total Withdrawn: ${ethers.formatUnits(totalWithdrawn, 6)} USDT`);
          console.log(`   Total Fees Paid: ${ethers.formatUnits(totalFees, 6)} USDT`);
          console.log(`   Withdrawal Count: ${netAmounts.length}`);

          // Calculate scholarship status
          const currentBalance = Number(ethers.formatUnits(balance, 6));
          const totalFunded = Number(ethers.formatUnits(totalFunding, 6));
          
          let status = "🔴 Unfunded";
          let statusEmoji = "🔴";
          
          if (frozen) {
            status = "🔒 FROZEN (Low Performance Score)";
            statusEmoji = "🔒";
          } else if (currentBalance > 0) {
            status = "🟢 Active & Available";
            statusEmoji = "🟢";
          } else if (totalFunded > 0) {
            status = "🟡 Fully Withdrawn";
            statusEmoji = "🟡";
          }
          
          console.log(`   Status: ${status}`);
          console.log(`   Freeze Status: ${frozen ? "🔒 FROZEN" : "✅ Active"}`);

        } catch (error) {
          console.log(`   ❌ Could not get financial data: ${error instanceof Error ? error.message : String(error)}`);
        }

        // ===== INVESTOR INFORMATION =====
        console.log("\n👥 Investor Information:");
        try {
          const investors = await scholarshipManager.getInvestors(tokenId);
          const investorCount = await scholarshipManager.getInvestorCount(tokenId);
          const totalFunding = await scholarshipManager.getTotalFunding(tokenId);
          
          if (investors.length > 0) {
            console.log(`   Total Investors: ${investorCount}`);
            console.log(`   Total Funding: ${ethers.formatUnits(totalFunding, 6)} USDT`);
            console.log(`   Top Contributors:`);
            
            // Get contributions and sort by amount
            const investorData = [];
            for (const investor of investors) {
              const contribution = await scholarshipManager.getInvestorContribution(tokenId, investor);
              investorData.push({ address: investor, amount: contribution });
            }
            
            // Sort by contribution amount (descending)
            investorData.sort((a, b) => Number(b.amount - a.amount));
            
            // Show top 5 investors
            investorData.slice(0, 5).forEach((inv, idx) => {
              const percentage = Number(inv.amount) * 100 / Number(totalFunding);
              console.log(`      #${idx + 1}: ${inv.address}`);
              console.log(`           ${ethers.formatUnits(inv.amount, 6)} USDT (${percentage.toFixed(1)}%)`);
            });
            
            if (investors.length > 5) {
              console.log(`      ... and ${investors.length - 5} more investors`);
            }
          } else {
            console.log(`   💰 No investors yet - scholarship needs funding`);
          }
        } catch (error) {
          console.log(`   ❌ Could not get investor data: ${error instanceof Error ? error.message : String(error)}`);
        }

        // ===== WITHDRAWAL HISTORY =====
        console.log("\n📤 Withdrawal History:");
        try {
          const [netAmounts, timestamps, feeAmounts] = await scholarshipManager.getDetailedWithdrawalHistory(tokenId);
          if (netAmounts.length > 0) {
            console.log(`   Total Withdrawals: ${netAmounts.length}`);
            
            let totalWithdrawn = BigInt(0);
            let totalFees = BigInt(0);
            
            for (let i = 0; i < Math.min(netAmounts.length, 5); i++) {
              const date = new Date(Number(timestamps[i]) * 1000).toLocaleString();
              const grossAmount = netAmounts[i] + feeAmounts[i];
              console.log(`   #${i + 1}: ${ethers.formatUnits(netAmounts[i], 6)} USDT`);
              console.log(`        Date: ${date}`);
              console.log(`        Gross: ${ethers.formatUnits(grossAmount, 6)} USDT`);
              console.log(`        Fee: ${ethers.formatUnits(feeAmounts[i], 6)} USDT`);
              
              totalWithdrawn += netAmounts[i];
              totalFees += feeAmounts[i];
            }
            
            if (netAmounts.length > 5) {
              // Calculate totals for remaining withdrawals
              for (let i = 5; i < netAmounts.length; i++) {
                totalWithdrawn += netAmounts[i];
                totalFees += feeAmounts[i];
              }
              console.log(`   ... and ${netAmounts.length - 5} more withdrawals`);
            }
            
            console.log(`   💸 Total Net Withdrawn: ${ethers.formatUnits(totalWithdrawn, 6)} USDT`);
            console.log(`   🏦 Total Fees Paid: ${ethers.formatUnits(totalFees, 6)} USDT`);
          } else {
            console.log(`   📭 No withdrawals yet`);
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
          const [student, balance, metadata, frozen] = await scholarshipManager.getScholarshipData(tokenId);
          const shouldBeFrozen = await scholarshipManager.shouldBeFrozen(tokenId);
          
          if (Number(scholarshipScore) === 0) {
            console.log(`   Score: No ratings yet ⚪`);
            console.log(`   Status: Unrated (Active)`);
          } else {
            const scoreDecimal = Number(scholarshipScore) / 100;
            console.log(`   Average Score: ${scoreDecimal.toFixed(2)}/10.00`);
            console.log(`   Total Ratings: ${ratingCount.toString()}`);
            console.log(`   Total CIRQA Used: ${ethers.formatUnits(totalRatingTokens, 18)} CIRQA`);
            console.log(`   💡 Token-weighted average`);
            
            // Performance status
            if (scoreDecimal >= 3.0) {
              console.log(`   Performance: ✅ Good (≥3.0)`);
            } else {
              console.log(`   Performance: ⚠️ Poor (<3.0)`);
            }
          }
          
          // Freeze status analysis
          console.log(`   Current Freeze Status: ${frozen ? "🔒 FROZEN" : "✅ Active"}`);
          if (Number(scholarshipScore) > 0) {
            console.log(`   Should Be Frozen: ${shouldBeFrozen ? "🔒 Yes" : "✅ No"}`);
            if (frozen !== shouldBeFrozen) {
              console.log(`   ⚠️  STATUS MISMATCH! Needs update.`);
            }
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
      let totalFeesSum = BigInt(0);
      let totalCurrentBalance = BigInt(0);
      let scholarshipsWithRatings = 0;
      let totalRatings = BigInt(0);
      let activeScholarships = 0;
      let frozenScholarships = 0;
      let totalInvestors = 0;

      for (const tokenId of allScholarships) {
        try {
          const [student, balance, metadata, frozen] = await scholarshipManager.getScholarshipData(tokenId);
          const totalFunding = await scholarshipManager.getTotalFunding(tokenId);
          const investorCount = await scholarshipManager.getInvestorCount(tokenId);
          
          // Calculate withdrawn amounts from detailed history
          const [netAmounts, timestamps, feeAmounts] = await scholarshipManager.getDetailedWithdrawalHistory(tokenId);
          let scholarshipWithdrawn = BigInt(0);
          let scholarshipFees = BigInt(0);
          
          for (let i = 0; i < netAmounts.length; i++) {
            scholarshipWithdrawn += netAmounts[i];
            scholarshipFees += feeAmounts[i];
          }
          
          totalFundedSum += totalFunding;
          totalWithdrawnSum += scholarshipWithdrawn;
          totalFeesSum += scholarshipFees;
          totalCurrentBalance += balance;
          totalInvestors += Number(investorCount);
          
          if (Number(balance) > 0) {
            activeScholarships++;
          }
          
          if (frozen) {
            frozenScholarships++;
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

      console.log(`📊 PROTOCOL STATISTICS`);
      console.log(`Total Scholarships: ${allScholarships.length}`);
      console.log(`Active (Funded) Scholarships: ${activeScholarships}`);
      console.log(`Frozen Scholarships: ${frozenScholarships}`);
      console.log(`Scholarships with Ratings: ${scholarshipsWithRatings}`);
      console.log(`Total Unique Investors: ${totalInvestors}`);
      
      console.log(`\n💰 FINANCIAL STATISTICS`);
      console.log(`Total USDT Funded: ${ethers.formatUnits(totalFundedSum, 6)} USDT`);
      console.log(`Total USDT Withdrawn: ${ethers.formatUnits(totalWithdrawnSum, 6)} USDT`);
      console.log(`Total Fees Collected: ${ethers.formatUnits(totalFeesSum, 6)} USDT`);
      console.log(`Total Current Balance: ${ethers.formatUnits(totalCurrentBalance, 6)} USDT`);
      console.log(`Total Ratings Given: ${totalRatings.toString()}`);

      // Calculate percentages
      if (allScholarships.length > 0) {
        const activePercentage = (activeScholarships / allScholarships.length * 100).toFixed(1);
        const frozenPercentage = (frozenScholarships / allScholarships.length * 100).toFixed(1);
        const ratedPercentage = (scholarshipsWithRatings / allScholarships.length * 100).toFixed(1);
        const utilizedPercentage = Number(totalWithdrawnSum) > 0 ? (Number(totalWithdrawnSum) / Number(totalFundedSum) * 100).toFixed(1) : "0.0";
        
        console.log(`\n📈 PERFORMANCE METRICS`);
        console.log(`Active Rate: ${activePercentage}%`);
        console.log(`Frozen Rate: ${frozenPercentage}%`);
        console.log(`Rating Coverage: ${ratedPercentage}%`);
        console.log(`Fund Utilization: ${utilizedPercentage}%`);
        
        if (totalInvestors > 0) {
          const avgFundingPerInvestor = Number(totalFundedSum) / totalInvestors;
          console.log(`Avg Funding per Investor: ${(avgFundingPerInvestor / 1e6).toFixed(2)} USDT`);
        }
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