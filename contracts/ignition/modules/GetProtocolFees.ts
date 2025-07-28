import { ethers } from "hardhat";

const PROTOCOL_ADDRESS = "0x6f6A53069f1894D44032424AdB2c173C4d745526";

// Interface for ERC20 metadata (name, symbol, decimals)
const IERC20MetadataABI = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)"
];

async function main() {
  const cirqaProtocol = await ethers.getContractAt("CirqaProtocol", PROTOCOL_ADDRESS);
  
  console.log(`Fetching protocol fee information from: ${PROTOCOL_ADDRESS}`);
  
  // Get current fee settings
  const feeBps = await cirqaProtocol.protocolFeeBps();
  const feeRecipient = await cirqaProtocol.protocolFeeRecipient();
  
  console.log(`Current protocol fee: ${feeBps} bps (${Number(feeBps)/100}%)`);
  console.log(`Fee recipient: ${feeRecipient}`);
  
  // Get the current block number
  const currentBlock = await ethers.provider.getBlockNumber();
  console.log(`Current block number: ${currentBlock}`);
  
  // Define the ProtocolFeePaid event filter
  const filter = cirqaProtocol.filters.ProtocolFeePaid();
  
  // Get logs for the last 10000 blocks (adjust as needed)
  const fromBlock = Math.max(0, currentBlock - 10000);
  console.log(`Fetching fee events from block ${fromBlock} to ${currentBlock}...`);
  
  const logs = await ethers.provider.getLogs({
    ...filter,
    fromBlock: fromBlock,
    toBlock: currentBlock
  });
  
  console.log(`Found ${logs.length} fee payment events.`);
  
  // Parse the logs and calculate total fees
  const feesByAsset = {};
  let totalFees = ethers.parseEther("0");
  
  const iface = new ethers.Interface([
    "event ProtocolFeePaid(address indexed asset, address indexed user, uint256 feeAmount)"
  ]);
  
  for (const log of logs) {
    const parsedLog = iface.parseLog({
      topics: log.topics,
      data: log.data
    });
    
    if (parsedLog) {
      const { asset, user, feeAmount } = parsedLog.args;
      
      // Get asset info to display proper token symbol
      const pid = Number(await cirqaProtocol.assetId(asset)) - 1;
      const assetInfo = await cirqaProtocol.assetInfo(pid);
      let symbol = "Unknown";
      try {
        // Use IERC20MetadataABI instead of IERC20 to access symbol()
        const assetContract = await ethers.getContractAt(IERC20MetadataABI, asset);
        symbol = await assetContract.symbol();
      } catch (error) {
        console.log(`Could not get symbol for asset ${asset}`);
      }
      
      // Add to asset totals
      if (!feesByAsset[asset as keyof typeof feesByAsset]) {
        // @ts-ignore
        feesByAsset[asset as string] = {
          symbol,
          total: ethers.parseEther("0"),
          count: 0
        };
      }
      // @ts-ignore
      feesByAsset[asset as string].total = feesByAsset[asset as string].total + feeAmount;
      // @ts-ignore
      feesByAsset[asset as string].count += 1;
      
      // For simplicity, we're adding all fees together, but in reality
      // different assets would have different values
      totalFees = totalFees + feeAmount;
      
      // Print individual fee payment
      console.log(`Block ${log.blockNumber}: User ${user} paid ${ethers.formatEther(feeAmount)} ${symbol} fee`);
    }
  }
  
  // Print summary
  console.log("\n--- Fee Collection Summary ---");
  for (const [asset, info] of Object.entries(feesByAsset)) {
    // @ts-ignore
    console.log(`${info.symbol}: ${ethers.formatEther(info.total)} (${info.count} transactions)`);
  }
  
  console.log(`\nTotal fees collected: ${ethers.formatEther(totalFees)} (across all assets)`);
  console.log("Note: This total combines different assets and is for reference only.");
  
  // Get balance of fee recipient for each asset
  console.log("\n--- Fee Recipient Balances ---");
  const assetsLength = await cirqaProtocol.getAssetsLength();
  
  for (let i = 0; i < assetsLength; i++) {
    const assetInfo = await cirqaProtocol.assetInfo(i);
    // Use standard IERC20 for balanceOf
    const assetContract = await ethers.getContractAt("IERC20", assetInfo.asset);
    
    let symbol = "Unknown";
    try {
      // Use IERC20MetadataABI for symbol
      const metadataContract = await ethers.getContractAt(IERC20MetadataABI, assetInfo.asset);
      symbol = await metadataContract.symbol();
    } catch (error) {
      console.log(`Could not get symbol for asset ${assetInfo.asset}`);
    }
    
    const balance = await assetContract.balanceOf(feeRecipient);
    console.log(`${symbol}: ${ethers.formatEther(balance)}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});