import { ethers } from "hardhat";

const PROTOCOL_ADDRESS = "0x6f6A53069f1894D44032424AdB2c173C4d745526";
const FEE_BPS = 100; // 1% in basis points (100 bps = 1%)

async function main() {
  const cirqaProtocol = await ethers.getContractAt("CirqaProtocol", PROTOCOL_ADDRESS);

  console.log(`Updating protocol fee on contract: ${PROTOCOL_ADDRESS}`);
  
  // Get current fee
  const currentFeeBps = await cirqaProtocol.protocolFeeBps();
  console.log(`Current protocol fee: ${currentFeeBps} bps (${Number(currentFeeBps)/100}%)`);
  
  // Set new fee
  console.log(`Setting new protocol fee to: ${FEE_BPS} bps (${FEE_BPS/100}%)`);
  const tx = await cirqaProtocol.setProtocolFee(FEE_BPS);
  await tx.wait();
  
  // Verify the fee was updated
  const newFeeBps = await cirqaProtocol.protocolFeeBps();
  console.log(`Updated protocol fee: ${newFeeBps} bps (${Number(newFeeBps)/100}%)`);
  
  // Get fee recipient
  const feeRecipient = await cirqaProtocol.protocolFeeRecipient();
  console.log(`Protocol fee recipient: ${feeRecipient}`);
  
  console.log("Protocol fee update completed successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});