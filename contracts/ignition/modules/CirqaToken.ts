// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CirqaTokenModule = buildModule("CirqaTokenModule", (m) => {
  // Deploy the CirqaToken contract
  const cirqaToken = m.contract("CirqaToken", []);

  return { cirqaToken };
});

export default CirqaTokenModule;