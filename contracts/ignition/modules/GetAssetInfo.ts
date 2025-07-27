import { ethers } from "hardhat";

async function main() {
  const protocolAddress = "0x6f6A53069f1894D44032424AdB2c173C4d745526";

  console.log(`Fetching asset info from protocol: ${protocolAddress}`);

  const protocol = await ethers.getContractAt("CirqaProtocol", protocolAddress);

  const assetsLength = await protocol.getAssetsLength();
  console.log(`Found ${assetsLength} asset(s).\n`);

  for (let i = 0; i < assetsLength; i++) {
    const info = await protocol.assetInfo(i);
    console.log(`--- Asset ${i} ---`);
    console.log(`Asset Address: ${info.asset}`);
    console.log(`Allocation Points: ${info.allocPoint.toString()}`);
    console.log(`Last Reward Time: ${new Date(Number(info.lastRewardTime) * 1000).toLocaleString()}`);
    console.log(`Accumulated CIRQA per Share: ${ethers.formatUnits(info.accCirqaPerShare, 12)}`);
    console.log(`Total Points: ${info.totalPoints.toString()}`);
    console.log(`Total Supplied: ${ethers.formatEther(info.totalSupplied)}`);
    console.log(`Total Borrowed: ${ethers.formatEther(info.totalBorrowed)}`);
    console.log('--------------------\n');
  }

  console.log("Finished fetching asset info.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });