// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IScholarshipManager.sol";
import "./interfaces/IScoreManager.sol";

/**
 * @title ScholarshipManager
 * @dev Manages scholarship data and operations
 */
contract ScholarshipManager is IScholarshipManager, Ownable {
    // Events
    event ScholarshipFrozen(uint256 indexed tokenId, uint256 currentScore);
    event ScholarshipUnfrozen(uint256 indexed tokenId, uint256 currentScore);
    event ScholarshipDataCleanedUp(uint256 indexed tokenId);
    
    struct WithdrawalRecord {
        uint256 amount;
        uint256 timestamp;
    }

    struct ScholarshipData {
        address student;
        uint256 balance;
        string metadata; // IPFS hash containing student data (photos, documents, etc.)
        WithdrawalRecord[] withdrawalHistory;
        bool isFrozen; // Whether scholarship is frozen due to low score
    }

    // Mapping from token ID to scholarship data
    mapping(uint256 => ScholarshipData) private scholarships;
    
    // Mapping from student address to their scholarship token IDs
    mapping(address => uint256[]) private studentScholarships;
    
    // Array of all scholarship token IDs
    uint256[] private allScholarships;
    
    // Investor tracking mappings (Option 2)
    mapping(uint256 => address[]) private scholarshipInvestors;
    mapping(uint256 => mapping(address => uint256)) private investorContributions;
    mapping(uint256 => uint256) private totalFundingReceived;
    
    // Withdrawal fee tracking (Hybrid approach)
    mapping(uint256 => mapping(uint256 => uint256)) private withdrawalFees;
    
    // Address of the Core contract
    address private coreContract;
    
    // Score Manager contract for checking performance scores
    IScoreManager public scoreManager;
    
    // Minimum score threshold (3.0 with 2 decimal precision = 300)
    uint256 public constant MIN_SCORE_THRESHOLD = 300;
    
    /**
     * @dev Modifier to ensure only the Core contract can call certain functions
     */
    modifier onlyCore() {
        require(msg.sender == coreContract, "Only Core contract can call this function");
        _;
    }
    
    /**
     * @dev Sets the Core contract address
     * @param _coreContract Address of the Core contract
     */
    function setCoreContract(address _coreContract) external onlyOwner {
        require(_coreContract != address(0), "Invalid address");
        coreContract = _coreContract;
    }
    
    /**
     * @dev Sets the Score Manager contract address
     * @param _scoreManager Address of the Score Manager contract
     */
    function setScoreManager(address _scoreManager) external onlyOwner {
        require(_scoreManager != address(0), "Invalid address");
        scoreManager = IScoreManager(_scoreManager);
    }
    
    /**
     * @dev Initializes a new scholarship
     * @param tokenId The ID of the scholarship NFT
     * @param student Address of the student
     * @param metadata IPFS hash containing student data
     */
    function initializeScholarship(uint256 tokenId, address student, string memory metadata) external override onlyCore {
        scholarships[tokenId].student = student;
        scholarships[tokenId].balance = 0;
        scholarships[tokenId].metadata = metadata;
        scholarships[tokenId].isFrozen = false; // Initialize as not frozen
        
        studentScholarships[student].push(tokenId);
        allScholarships.push(tokenId);
    }
    
    /**
     * @dev Adds funds to a scholarship and tracks investor
     * @param tokenId The ID of the scholarship NFT
     * @param amount Amount to add to the scholarship balance
     * @param investor Address of the investor
     */
    function addFunds(uint256 tokenId, uint256 amount, address investor) external override onlyCore {
        scholarships[tokenId].balance += amount;
        
        // Track investor if this is their first contribution
        if (investorContributions[tokenId][investor] == 0) {
            scholarshipInvestors[tokenId].push(investor);
        }
        
        // Update investor contribution and total funding
        investorContributions[tokenId][investor] += amount;
        totalFundingReceived[tokenId] += amount;
    }
    
    /**
     * @dev Withdraws funds from a scholarship
     * @param tokenId The ID of the scholarship NFT
     * @param amount Amount to withdraw from the scholarship balance
     */
    function withdrawFunds(uint256 tokenId, uint256 amount) external override onlyCore {
        scholarships[tokenId].balance -= amount;
    }
    
    /**
     * @dev Records a withdrawal in the scholarship's history with fee tracking
     * @param tokenId The ID of the scholarship NFT
     * @param netAmount Amount that was received by student (after fee)
     * @param feeAmount Fee amount that was deducted
     */
    function recordWithdrawal(uint256 tokenId, uint256 netAmount, uint256 feeAmount) external override onlyCore {
        uint256 withdrawalIndex = scholarships[tokenId].withdrawalHistory.length;
        
        // Store basic withdrawal record (same gas as before)
        scholarships[tokenId].withdrawalHistory.push(WithdrawalRecord({
            amount: netAmount,
            timestamp: block.timestamp
        }));
        
        // Store fee separately only if > 0 (saves gas when no fee)
        if (feeAmount > 0) {
            withdrawalFees[tokenId][withdrawalIndex] = feeAmount;
        }
    }
    
    /**
     * @dev Checks if an address is the student of a scholarship
     * @param tokenId The ID of the scholarship NFT
     * @param addr Address to check
     * @return True if the address is the student of the scholarship
     */
    function isStudent(uint256 tokenId, address addr) external view override returns (bool) {
        return scholarships[tokenId].student == addr;
    }
    
    /**
     * @dev Checks if a scholarship has enough balance for a withdrawal
     * @param tokenId The ID of the scholarship NFT
     * @param amount Amount to check against the scholarship balance
     * @return True if the scholarship has enough balance
     */
    function hasEnoughBalance(uint256 tokenId, uint256 amount) external view override returns (bool) {
        return scholarships[tokenId].balance >= amount;
    }
    
    /**
     * @dev Gets the withdrawal history for a scholarship
     * @param tokenId The ID of the scholarship NFT
     * @return amounts Array of withdrawal amounts
     * @return timestamps Array of withdrawal timestamps
     */
    function getWithdrawalHistory(uint256 tokenId) external view override returns (uint256[] memory amounts, uint256[] memory timestamps) {
        uint256 historyLength = scholarships[tokenId].withdrawalHistory.length;
        amounts = new uint256[](historyLength);
        timestamps = new uint256[](historyLength);

        for (uint256 i = 0; i < historyLength; i++) {
            amounts[i] = scholarships[tokenId].withdrawalHistory[i].amount;
            timestamps[i] = scholarships[tokenId].withdrawalHistory[i].timestamp;
        }
    }
    
    /**
     * @dev Gets all scholarship IDs
     * @return Array of all scholarship token IDs
     */
    function getAllScholarships() external view override returns (uint256[] memory) {
        return allScholarships;
    }
    
    /**
     * @dev Gets scholarships for a specific student
     * @param student Address of the student
     * @return Array of scholarship token IDs owned by the student
     */
    function getScholarshipsByStudent(address student) external view override returns (uint256[] memory) {
        return studentScholarships[student];
    }
    
    // === FREEZE MANAGEMENT FUNCTIONS ===
    
    /**
     * @dev Checks if a scholarship should be frozen based on score
     * @param tokenId The ID of the scholarship NFT
     * @return Whether the scholarship should be frozen
     */
    function shouldBeFrozen(uint256 tokenId) public view returns (bool) {
        if (address(scoreManager) == address(0)) {
            return false; // If score manager not set, don't freeze
        }
        
        uint256 currentScore = scoreManager.getScholarshipScore(tokenId);
        return currentScore < MIN_SCORE_THRESHOLD && currentScore > 0; // Only freeze if has score and it's low
    }
    
    /**
     * @dev Updates freeze status based on current score
     * @param tokenId The ID of the scholarship NFT
     */
    function updateFreezeStatus(uint256 tokenId) external {
        bool shouldFreeze = shouldBeFrozen(tokenId);
        scholarships[tokenId].isFrozen = shouldFreeze;
        
        if (shouldFreeze) {
            emit ScholarshipFrozen(tokenId, scoreManager.getScholarshipScore(tokenId));
        } else {
            emit ScholarshipUnfrozen(tokenId, scoreManager.getScholarshipScore(tokenId));
        }
    }
    
    /**
     * @dev Manual freeze/unfreeze by admin (emergency use)
     * @param tokenId The ID of the scholarship NFT
     * @param frozen Whether to freeze or unfreeze
     */
    function setFrozenStatus(uint256 tokenId, bool frozen) external onlyOwner {
        scholarships[tokenId].isFrozen = frozen;
        
        if (frozen) {
            emit ScholarshipFrozen(tokenId, scoreManager.getScholarshipScore(tokenId));
        } else {
            emit ScholarshipUnfrozen(tokenId, scoreManager.getScholarshipScore(tokenId));
        }
    }
    
    /**
     * @dev Checks if a scholarship is currently frozen
     * @param tokenId The ID of the scholarship NFT
     * @return Whether the scholarship is frozen
     */
    function isFrozen(uint256 tokenId) external view returns (bool) {
        return scholarships[tokenId].isFrozen;
    }
    
    /**
     * @dev Gets scholarship data including freeze status
     * @param tokenId The ID of the scholarship NFT
     * @return student Address of the student
     * @return balance Current balance of the scholarship
     * @return metadata IPFS hash containing student data
     * @return frozen Whether the scholarship is frozen
     */
    function getScholarshipData(uint256 tokenId) external view returns (address student, uint256 balance, string memory metadata, bool frozen) {
        ScholarshipData storage scholarship = scholarships[tokenId];
        return (scholarship.student, scholarship.balance, scholarship.metadata, scholarship.isFrozen);
    }
    
    // === INVESTOR TRACKING FUNCTIONS ===
    
    /**
     * @dev Gets all investors for a scholarship
     * @param tokenId The ID of the scholarship NFT
     * @return Array of investor addresses
     */
    function getInvestors(uint256 tokenId) external view returns (address[] memory) {
        return scholarshipInvestors[tokenId];
    }
    
    /**
     * @dev Gets the contribution amount of a specific investor
     * @param tokenId The ID of the scholarship NFT
     * @param investor Address of the investor
     * @return Amount contributed by the investor
     */
    function getInvestorContribution(uint256 tokenId, address investor) external view returns (uint256) {
        return investorContributions[tokenId][investor];
    }
    
    /**
     * @dev Gets the total funding received for a scholarship
     * @param tokenId The ID of the scholarship NFT
     * @return Total amount funded by all investors
     */
    function getTotalFunding(uint256 tokenId) external view returns (uint256) {
        return totalFundingReceived[tokenId];
    }
    
    /**
     * @dev Gets investor count for a scholarship
     * @param tokenId The ID of the scholarship NFT
     * @return Number of unique investors
     */
    function getInvestorCount(uint256 tokenId) external view returns (uint256) {
        return scholarshipInvestors[tokenId].length;
    }
    
    // === WITHDRAWAL FEE FUNCTIONS ===
    
    /**
     * @dev Gets the fee amount for a specific withdrawal
     * @param tokenId The ID of the scholarship NFT
     * @param withdrawalIndex Index of the withdrawal in history
     * @return Fee amount for the withdrawal (0 if no fee)
     */
    function getWithdrawalFee(uint256 tokenId, uint256 withdrawalIndex) external view returns (uint256) {
        return withdrawalFees[tokenId][withdrawalIndex];
    }
    
    /**
     * @dev Gets detailed withdrawal history including fees
     * @param tokenId The ID of the scholarship NFT
     * @return netAmounts Array of net amounts received by student
     * @return timestamps Array of withdrawal timestamps
     * @return feeAmounts Array of fee amounts deducted
     */
    function getDetailedWithdrawalHistory(uint256 tokenId) external view returns (
        uint256[] memory netAmounts,
        uint256[] memory timestamps,
        uint256[] memory feeAmounts
    ) {
        uint256 historyLength = scholarships[tokenId].withdrawalHistory.length;
        netAmounts = new uint256[](historyLength);
        timestamps = new uint256[](historyLength);
        feeAmounts = new uint256[](historyLength);

        for (uint256 i = 0; i < historyLength; i++) {
            netAmounts[i] = scholarships[tokenId].withdrawalHistory[i].amount;
            timestamps[i] = scholarships[tokenId].withdrawalHistory[i].timestamp;
            feeAmounts[i] = withdrawalFees[tokenId][i]; // 0 if no fee recorded
        }
    }
    
    // === SCHOLARSHIP DELETION FUNCTIONS ===
    
    /**
     * @dev Checks if a scholarship can be deleted
     * @param tokenId The ID of the scholarship NFT
     * @return True if scholarship can be deleted (no funding, ratings, or withdrawals)
     */
    function canDeleteScholarship(uint256 tokenId) external view returns (bool) {
        // Check if scholarship has any funding received
        if (totalFundingReceived[tokenId] > 0) {
            return false;
        }
        
        // Check if scholarship has any withdrawal history
        if (scholarships[tokenId].withdrawalHistory.length > 0) {
            return false;
        }
        
        // Check if scholarship has any ratings via ScoreManager
        if (address(scoreManager) != address(0)) {
            if (scoreManager.hasRatings(tokenId)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * @dev Cleans up all data associated with a scholarship
     * @param tokenId The ID of the scholarship NFT
     * @notice Only callable by Core contract
     */
    function cleanupScholarship(uint256 tokenId) external onlyCore {
        // Remove from allScholarships array
        for (uint256 i = 0; i < allScholarships.length; i++) {
            if (allScholarships[i] == tokenId) {
                allScholarships[i] = allScholarships[allScholarships.length - 1];
                allScholarships.pop();
                break;
            }
        }
        
        // Remove from student's scholarship list
        address student = scholarships[tokenId].student;
        uint256[] storage studentSchols = studentScholarships[student];
        for (uint256 i = 0; i < studentSchols.length; i++) {
            if (studentSchols[i] == tokenId) {
                studentSchols[i] = studentSchols[studentSchols.length - 1];
                studentSchols.pop();
                break;
            }
        }
        
        // Clean up investor data (should be empty, but cleanup for safety)
        delete scholarshipInvestors[tokenId];
        // Note: investorContributions mapping will be cleaned automatically when investors array is deleted
        delete totalFundingReceived[tokenId];
        
        // Clean up withdrawal fee data (should be empty, but cleanup for safety)
        // Note: withdrawalFees mapping entries will be inaccessible after scholarship deletion
        
        // Delete the main scholarship data
        delete scholarships[tokenId];
        
        emit ScholarshipDataCleanedUp(tokenId);
    }
}