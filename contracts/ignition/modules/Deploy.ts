import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CirqaModule = buildModule("CirqaModule", (m) => {
  // Deploy CirqaToken first
  const cirqaToken = m.contract("CirqaToken");

  // Deploy CirqaProtocol, passing the address of CirqaToken
  const cirqaProtocol = m.contract("CirqaProtocol", [cirqaToken]);

  // After deployment, set the CirqaProtocol contract as the minter on CirqaToken
  m.call(cirqaToken, "setMinter", [cirqaProtocol]);

  return { cirqaToken, cirqaProtocol };
});

export default CirqaModule;