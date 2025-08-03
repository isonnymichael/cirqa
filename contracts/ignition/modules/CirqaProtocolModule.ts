import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const USDT_ADDRESS = process.env.USDT_ADDRESS!!;

const CirqaProtocolModule = buildModule("CirqaProtocolModule", (m) => {
  // Deploy mock USDT for testing
  const mockUSDT = m.contract("MockERC20", ["Test USDT", "USDT", 6]);

  // Deploy CirqaToken
  const cirqaToken = m.contract("CirqaToken");

  // Deploy Core contract
  const core = m.contract("Core", [cirqaToken, USDT_ADDRESS]);

  // Deploy ScholarshipManager
  const scholarshipManager = m.contract("ScholarshipManager");

  // Deploy ScoreManager
  const scoreManager = m.contract("ScoreManager");

  // Set up contracts
  m.call(cirqaToken, "setMinter", [core]);
  m.call(cirqaToken, "setScoreManager", [scoreManager]);
  m.call(scholarshipManager, "setCoreContract", [core]);
  m.call(scoreManager, "setCoreContract", [core]);
  m.call(scoreManager, "setCirqaToken", [cirqaToken]);
  m.call(core, "setScholarshipManager", [scholarshipManager]);
  m.call(core, "setScoreManager", [scoreManager]);

  // Mint some initial USDT for testing
  m.call(mockUSDT, "mint", [m.getAccount(0), "1000000000000"]);

  // Return all deployed contracts
  return {
    mockUSDT,
    cirqaToken,
    core,
    scholarshipManager,
    scoreManager,
  };
});

export default CirqaProtocolModule;