import { ethers } from "hardhat";

const { getAddress } = require("ethers");

const PROTOCOL_ADDRESS = "0x6f6A53069f1894D44032424AdB2c173C4d745526";
const ASSETS_TO_ADD = [
    { address: "0xd51e7187e54a4a22d790f8bbddd9b54b891bc920", allocPoint: 50 }, // Wrapped KII (native)
    { address: "0x7806bbef4f5aba0bd0e96139eeeb2df88e7839e5", allocPoint: 80 }, // Wrapped BTC
    { address: "0xb72ffa8e8079365c1890948464b542e42eec892b", allocPoint: 100 }, // USDC
    { address: "0x1a9992f48de81c57d38147f3c573e84575021de6", allocPoint: 100 }  // USDT
];

async function main() {
    const cirqaProtocol = await ethers.getContractAt("CirqaProtocol", PROTOCOL_ADDRESS);

    console.log(`Checking and adding assets to protocol: ${PROTOCOL_ADDRESS}`);

    const existingAssetsLength = await cirqaProtocol.getAssetsLength();
    const existingAssetAddresses = new Set();

    for (let i = 0; i < existingAssetsLength; i++) {
        const assetInfo = await cirqaProtocol.assetInfo(i);
        const info = await cirqaProtocol.assetInfo(i);
        existingAssetAddresses.add(info.asset.toLowerCase());
    }

    for (const asset of ASSETS_TO_ADD) {
        if (existingAssetAddresses.has(asset.address.toLowerCase())) {
            console.log(`Asset ${asset.address} already exists. Skipping.`);
        } else {
            console.log(`Adding asset ${asset.address} with ${asset.allocPoint} allocation points...`);
            const tx = await cirqaProtocol.add(asset.allocPoint, asset.address, true);
            await tx.wait();
            console.log(`Asset ${asset.address} added successfully.`);
        }
    }

    console.log("Finished checking and adding assets.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});