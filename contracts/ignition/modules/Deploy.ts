import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CirqaModule = buildModule("CirqaModule", (m) => {
  // Deploy MockERC20 first
  const MockERC20 = m.contract("MockERC20", ["Mock USDT", "USDT", 6]);

  // Deploy CirqaToken
  const cirqaToken = m.contract("CirqaToken");

  // Deploy CirqaProtocol, passing the address of CirqaToken and MockERC20
  const cirqaProtocol = m.contract("CirqaProtocol", [cirqaToken, MockERC20]);

  // After deployment, set the CirqaProtocol contract as the minter on CirqaToken
  m.call(cirqaToken, "setMinter", [cirqaProtocol]);

  // Mint some initial USDT for testing
  m.call(MockERC20, "mint", [m.getAccount(0), "1000000000000"]);

  return { MockERC20, cirqaToken, cirqaProtocol };
});

export default CirqaModule;