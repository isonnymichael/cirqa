import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const USDT_ADDRESS = "0x78296ebF90dA046EB04b1352EF7a7402499D8231";

const CirqaModule = buildModule("CirqaModule", (m) => {
  // Deploy MockERC20 first
  const MockERC20 = m.contract("MockERC20", ["Mock USDT", "USDT", 6]);

  // Deploy CirqaToken
  const cirqaToken = m.contract("CirqaToken");

  // Deploy CirqaProtocol, passing the address of CirqaToken and USDT_ADDRESS
  const cirqaProtocol = m.contract("CirqaProtocol", [cirqaToken, USDT_ADDRESS]);

  // After deployment, set the CirqaProtocol contract as the minter on CirqaToken
  m.call(cirqaToken, "setMinter", [cirqaProtocol]);

  // Mint some initial USDT for testing
  m.call(MockERC20, "mint", [m.getAccount(0), "1000000000000"]);

  return { MockERC20, cirqaToken, cirqaProtocol };
});

export default CirqaModule;