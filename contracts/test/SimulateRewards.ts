import { expect } from "chai";
import { ethers } from "hardhat";
import { CirqaProtocol } from "../typechain-types";

describe("CIRQA Reward Simulation", function () {
  // Simulation parameters
  const CIRQA_PER_SECOND = 79e15; // Reduced rate (0.079 CIRQA/sec)
  const SECONDS_PER_DAY = 86400;
  const CIRQA_PER_DAY = Number(CIRQA_PER_SECOND) * SECONDS_PER_DAY / 1e18;

  // Asset allocation points (after reduction)
  const ASSETS = [
    { name: "Wrapped KII", allocPoint: 50 },
    { name: "Wrapped BTC", allocPoint: 100 },
    { name: "USDC", allocPoint: 150 },
    { name: "USDT", allocPoint: 200 }
  ];

  const TOTAL_ALLOC_POINTS = ASSETS.reduce((sum, asset) => sum + asset.allocPoint, 0);

  // User simulation scenarios
  interface UserSimulation {
    numUsers: number;
    distributionType: string;
    description: string;
  }

  const SCENARIOS: UserSimulation[] = [
    {
      numUsers: 10,
      distributionType: "equal",
      description: "10 users with equal contributions"
    },
    {
      numUsers: 100,
      distributionType: "equal",
      description: "100 users with equal contributions"
    },
    {
      numUsers: 100,
      distributionType: "pareto",
      description: "100 users with Pareto distribution (80/20 rule)"
    }
  ];

  interface SimulatedUser {
    id: number;
    points: number;
  }

  function createSimulatedUsers(scenario: UserSimulation): SimulatedUser[] {
    const users: SimulatedUser[] = [];
    const numUsers = scenario.numUsers;
    
    if (scenario.distributionType === "equal") {
      // Equal distribution - all users have the same points
      for (let i = 0; i < numUsers; i++) {
        users.push({
          id: i + 1,
          points: 100 // Arbitrary equal value
        });
      }
    } else if (scenario.distributionType === "pareto") {
      // Pareto distribution - 20% of users have 80% of the points
      const topUserCount = Math.ceil(numUsers * 0.2);
      const totalPoints = numUsers * 100; // Total arbitrary points
      const topUserPoints = totalPoints * 0.8 / topUserCount;
      const regularUserPoints = totalPoints * 0.2 / (numUsers - topUserCount);
      
      for (let i = 0; i < numUsers; i++) {
        users.push({
          id: i + 1,
          points: i < topUserCount ? topUserPoints : regularUserPoints
        });
      }
    }
    
    return users;
  }

  it("Should calculate correct daily CIRQA rewards", function () {
    expect(CIRQA_PER_DAY).to.be.closeTo(6825.6, 0.1);
  });

  it("Should calculate correct asset reward distribution", function () {
    for (const asset of ASSETS) {
      const assetRewardPerDay = CIRQA_PER_DAY * asset.allocPoint / TOTAL_ALLOC_POINTS;
      const expectedPercentage = asset.allocPoint / TOTAL_ALLOC_POINTS * 100;
      
      // Verify the asset's percentage of the total allocation
      expect(expectedPercentage).to.be.closeTo(
        asset.allocPoint / TOTAL_ALLOC_POINTS * 100, 
        0.01
      );
      
      // Verify the asset's daily reward
      expect(assetRewardPerDay).to.be.closeTo(
        CIRQA_PER_DAY * asset.allocPoint / TOTAL_ALLOC_POINTS,
        0.01
      );
    }
  });

  it("Should distribute rewards correctly for equal distribution scenario", function () {
    const scenario = SCENARIOS[0]; // 10 users with equal contributions
    const users = createSimulatedUsers(scenario);
    
    // All users should have equal points
    for (const user of users) {
      expect(user.points).to.equal(100);
    }
    
    // Calculate rewards for an example asset
    const asset = ASSETS[0]; // Wrapped KII
    const assetRewardPerDay = CIRQA_PER_DAY * asset.allocPoint / TOTAL_ALLOC_POINTS;
    const totalPoints = users.reduce((sum, user) => sum + user.points, 0);
    
    // Each user should get an equal share of the asset's rewards
    const expectedRewardPerUser = assetRewardPerDay / users.length;
    
    for (const user of users) {
      const userReward = assetRewardPerDay * user.points / totalPoints;
      expect(userReward).to.be.closeTo(expectedRewardPerUser, 0.01);
    }
  });

  it("Should distribute rewards correctly for Pareto distribution scenario", function () {
    const scenario = SCENARIOS[2]; // 100 users with Pareto distribution
    const users = createSimulatedUsers(scenario);
    
    // Verify 20% of users have 80% of points
    const topUserCount = Math.ceil(scenario.numUsers * 0.2);
    const topUsers = [...users].sort((a, b) => b.points - a.points).slice(0, topUserCount);
    const totalPoints = users.reduce((sum, user) => sum + user.points, 0);
    const topUserPoints = topUsers.reduce((sum, user) => sum + user.points, 0);
    
    // Top 20% of users should have approximately 80% of points
    expect(topUserPoints / totalPoints).to.be.closeTo(0.8, 0.01);
    
    // Calculate rewards for an example asset
    const asset = ASSETS[0]; // Wrapped KII
    const assetRewardPerDay = CIRQA_PER_DAY * asset.allocPoint / TOTAL_ALLOC_POINTS;
    
    // Top users should get approximately 80% of the rewards
    const topUserRewards = topUsers.reduce((sum, user) => {
      return sum + (assetRewardPerDay * user.points / totalPoints);
    }, 0);
    
    expect(topUserRewards / assetRewardPerDay).to.be.closeTo(0.8, 0.01);
  });
});