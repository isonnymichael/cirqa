// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "./interfaces/ICirqaToken.sol";
import "./interfaces/IScholarshipManager.sol";
import "./interfaces/IScoreManager.sol";

/**
 * @title Core
 * @dev Core contract for the Cirqa Protocol that manages the scholarship system
 * and coordinates between different modules.
 */
contract Core is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    ICirqaToken public cirqaToken;
    IERC20 public usdtToken;
    Counters.Counter public _tokenIds;
    
    IScholarshipManager public scholarshipManager;
    IScoreManager public scoreManager;

    // Reward rate for investors (in Cirqa tokens per 1 USDT)
    // rewardRate = 1e18 means 1:1 ratio (1 CIRQA per 1 USDT) after decimal adjustment
    uint256 public rewardRate = 1e18; // 1 Cirqa token per 1 USDT
    uint256 public protocolFee = 100; // 1% (100 basis points) for 1e4 basis points total (10000)
    
    // Token decimals constants for proper calculation
    uint256 private constant USDT_DECIMALS = 6;
    uint256 private constant CIRQA_DECIMALS = 18;

    event ScholarshipCreated(uint256 indexed tokenId, address indexed student, string metadata);
    event ScholarshipFunded(uint256 indexed tokenId, address indexed investor, uint256 amount);
    event FundsWithdrawn(uint256 indexed tokenId, address indexed student, uint256 amount);
    event ScholarshipDeleted(uint256 indexed tokenId, address indexed student);
    event USDTContractUpdated(address indexed oldContract, address indexed newContract);
    event ScholarshipManagerUpdated(address indexed oldManager, address indexed newManager);
    event ScoreManagerUpdated(address indexed oldManager, address indexed newManager);

    /**
     * @dev Constructor initializes the NFT collection name and symbol, and sets initial token addresses
     * @param _cirqaToken Address of the Cirqa token contract
     * @param _usdtToken Initial USDT token contract address
     */
    constructor(address _cirqaToken, address _usdtToken) ERC721("Cirqa Scholarship", "CIRQASCHOLAR") {
        cirqaToken = ICirqaToken(_cirqaToken);
        usdtToken = IERC20(_usdtToken);
    }

    /**
     * @dev Sets the scholarship manager contract
     * @param _scholarshipManager Address of the scholarship manager contract
     */
    function setScholarshipManager(address _scholarshipManager) external onlyOwner {
        address oldManager = address(scholarshipManager);
        scholarshipManager = IScholarshipManager(_scholarshipManager);
        emit ScholarshipManagerUpdated(oldManager, _scholarshipManager);
    }

    /**
     * @dev Sets the score manager contract
     * @param _scoreManager Address of the score manager contract
     */
    function setScoreManager(address _scoreManager) external onlyOwner {
        address oldManager = address(scoreManager);
        scoreManager = IScoreManager(_scoreManager);
        emit ScoreManagerUpdated(oldManager, _scoreManager);
    }

    /**
     * @dev Creates a new scholarship NFT for a student
     * @param metadata IPFS hash containing student data
     * @return tokenId The ID of the newly minted NFT
     */
    function createScholarship(string memory metadata) external returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, metadata);

        scholarshipManager.initializeScholarship(newTokenId, msg.sender, metadata);
        scoreManager.initializeScore(newTokenId);

        emit ScholarshipCreated(newTokenId, msg.sender, metadata);
        return newTokenId;
    }

    /**
     * @dev Allows investors to fund a scholarship NFT
     * @param tokenId The ID of the scholarship NFT to fund
     * @param amount Amount of USDT to invest
     */
    function fundScholarship(uint256 tokenId, uint256 amount) external {
        require(_exists(tokenId), "Scholarship does not exist");
        require(amount > 0, "Amount must be greater than 0");
        require(!scholarshipManager.isFrozen(tokenId), "Scholarship is frozen due to low performance score");

        // Transfer USDT from investor to contract
        require(usdtToken.transferFrom(msg.sender, address(this), amount), "USDT transfer failed");

        // Update scholarship balance and track investor
        scholarshipManager.addFunds(tokenId, amount, msg.sender);

        // Calculate and transfer Cirqa rewards to investor
        // Convert USDT amount (6 decimals) to CIRQA amount (18 decimals) with reward rate
        // Example: 10 USDT = 10 * 10^6 = 10,000,000 (USDT units)
        // decimalAdjustment = 10^12 (to convert 6 decimals to 18 decimals)
        // rewardAmount = (10,000,000 * 10^12 * 1e18) / 1e18 = 10,000,000 * 10^12 = 10 * 10^18 (10 CIRQA)
        uint256 decimalAdjustment = 10**(CIRQA_DECIMALS - USDT_DECIMALS); // 10^12
        uint256 rewardAmount = (amount * decimalAdjustment * rewardRate) / 1e18;
        cirqaToken.mint(msg.sender, rewardAmount);

        emit ScholarshipFunded(tokenId, msg.sender, amount);
    }

    /**
     * @dev Allows students to withdraw USDT from their scholarship
     * @param tokenId The ID of the scholarship NFT
     * @param amount Amount of USDT to withdraw
     */
    function withdrawFunds(uint256 tokenId, uint256 amount) external {
        require(_exists(tokenId), "Scholarship does not exist");
        require(scholarshipManager.isStudent(tokenId, msg.sender), "Only student can withdraw");
        require(scholarshipManager.hasEnoughBalance(tokenId, amount), "Insufficient balance");
        require(!scholarshipManager.isFrozen(tokenId), "Scholarship is frozen due to low performance score");

        uint256 feeAmount = (amount * protocolFee) / 10000;
        uint256 amountToStudent = amount - feeAmount;
        
        scholarshipManager.withdrawFunds(tokenId, amount);
        
        require(usdtToken.transfer(msg.sender, amountToStudent), "USDT transfer failed");
        require(usdtToken.transfer(owner(), feeAmount), "Fee transfer failed");

        scholarshipManager.recordWithdrawal(tokenId, amountToStudent, feeAmount);

        emit FundsWithdrawn(tokenId, msg.sender, amountToStudent);
    }

    /**
     * @dev Updates the USDT contract address (only owner)
     * @param newUsdtContract Address of the new USDT contract
     */
    function updateUSDTContract(address newUsdtContract) external onlyOwner {
        require(newUsdtContract != address(0), "Invalid address");
        address oldContract = address(usdtToken);
        usdtToken = IERC20(newUsdtContract);
        emit USDTContractUpdated(oldContract, newUsdtContract);
    }

    /**
     * @dev Updates the reward rate for investors (only owner)
     * @param newRate New reward rate (Cirqa tokens per 1 USDT)
     * @notice rewardRate is used with decimal adjustment: (amount * 10^12 * rewardRate) / 1e18
     * @notice 1e18 = 1:1 ratio, 2e18 = 2:1 ratio (2 CIRQA per 1 USDT), etc.
     */
    function updateRewardRate(uint256 newRate) external onlyOwner {
        rewardRate = newRate;
    }

    /**
     * @dev Updates the protocol fee for withdrawals (only owner)
     * @param newFee New protocol fee in basis points (e.g., 100 for 1%)
     */
    function setProtocolFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee cannot exceed 10%"); // Max 10% (1000 basis points)
        protocolFee = newFee;
    }
    
    /**
     * @dev Deletes a scholarship NFT and all associated data
     * @param tokenId The ID of the scholarship NFT to delete
     * @notice Only the owner (student) can delete their scholarship
     * @notice Can only delete if no funding, ratings, or withdrawals have occurred
     */
    function deleteScholarship(uint256 tokenId) external {
        require(_exists(tokenId), "Scholarship does not exist");
        require(ownerOf(tokenId) == msg.sender, "Only scholarship owner can delete");
        
        // Check if scholarship can be deleted (no activity)
        require(scholarshipManager.canDeleteScholarship(tokenId), "Cannot delete scholarship with activity");
        
        address student = ownerOf(tokenId);
        
        // Clean up data in ScholarshipManager
        scholarshipManager.cleanupScholarship(tokenId);
        
        // Burn the NFT
        _burn(tokenId);
        
        emit ScholarshipDeleted(tokenId, student);
    }

    /**
     * @dev Updates freeze status for a scholarship based on current score
     * @param tokenId The ID of the scholarship NFT
     * @notice This function can be called by anyone to update freeze status
     */
    function updateScholarshipFreezeStatus(uint256 tokenId) external {
        require(_exists(tokenId), "Scholarship does not exist");
        scholarshipManager.updateFreezeStatus(tokenId);
    }

    // Override required functions
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}