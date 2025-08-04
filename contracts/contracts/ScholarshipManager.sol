// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IScholarshipManager.sol";

/**
 * @title ScholarshipManager
 * @dev Manages scholarship data and operations
 */
contract ScholarshipManager is IScholarshipManager, Ownable {
    struct WithdrawalRecord {
        uint256 amount;
        uint256 timestamp;
    }

    struct ScholarshipData {
        address student;
        uint256 balance;
        string metadata; // IPFS hash containing student data (photos, documents, etc.)
        WithdrawalRecord[] withdrawalHistory;
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
     * @dev Initializes a new scholarship
     * @param tokenId The ID of the scholarship NFT
     * @param student Address of the student
     * @param metadata IPFS hash containing student data
     */
    function initializeScholarship(uint256 tokenId, address student, string memory metadata) external override onlyCore {
        scholarships[tokenId].student = student;
        scholarships[tokenId].balance = 0;
        scholarships[tokenId].metadata = metadata;
        
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
    
    /**
     * @dev Gets scholarship data
     * @param tokenId The ID of the scholarship NFT
     * @return student Address of the student
     * @return balance Current balance of the scholarship
     * @return metadata IPFS hash containing student data
     */
    function getScholarshipData(uint256 tokenId) external view returns (address student, uint256 balance, string memory metadata) {
        ScholarshipData storage scholarship = scholarships[tokenId];
        return (scholarship.student, scholarship.balance, scholarship.metadata);
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
}