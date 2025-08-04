// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IScholarshipManager
 * @dev Interface for the ScholarshipManager contract that handles scholarship data and operations
 */
interface IScholarshipManager {
    /**
     * @dev Initializes a new scholarship
     * @param tokenId The ID of the scholarship NFT
     * @param student Address of the student
     * @param metadata IPFS hash containing student data
     */
    function initializeScholarship(uint256 tokenId, address student, string memory metadata) external;
    
    /**
     * @dev Adds funds to a scholarship and tracks investor
     * @param tokenId The ID of the scholarship NFT
     * @param amount Amount to add to the scholarship balance
     * @param investor Address of the investor
     */
    function addFunds(uint256 tokenId, uint256 amount, address investor) external;
    
    /**
     * @dev Withdraws funds from a scholarship
     * @param tokenId The ID of the scholarship NFT
     * @param amount Amount to withdraw from the scholarship balance
     */
    function withdrawFunds(uint256 tokenId, uint256 amount) external;
    
    /**
     * @dev Records a withdrawal in the scholarship's history with fee tracking
     * @param tokenId The ID of the scholarship NFT
     * @param netAmount Amount that was received by student (after fee)
     * @param feeAmount Fee amount that was deducted
     */
    function recordWithdrawal(uint256 tokenId, uint256 netAmount, uint256 feeAmount) external;
    
    /**
     * @dev Checks if an address is the student of a scholarship
     * @param tokenId The ID of the scholarship NFT
     * @param addr Address to check
     * @return True if the address is the student of the scholarship
     */
    function isStudent(uint256 tokenId, address addr) external view returns (bool);
    
    /**
     * @dev Checks if a scholarship has enough balance for a withdrawal
     * @param tokenId The ID of the scholarship NFT
     * @param amount Amount to check against the scholarship balance
     * @return True if the scholarship has enough balance
     */
    function hasEnoughBalance(uint256 tokenId, uint256 amount) external view returns (bool);
    
    /**
     * @dev Gets the withdrawal history for a scholarship
     * @param tokenId The ID of the scholarship NFT
     * @return amounts Array of withdrawal amounts
     * @return timestamps Array of withdrawal timestamps
     */
    function getWithdrawalHistory(uint256 tokenId) external view returns (uint256[] memory amounts, uint256[] memory timestamps);
    
    /**
     * @dev Gets all scholarship IDs
     * @return Array of all scholarship token IDs
     */
    function getAllScholarships() external view returns (uint256[] memory);
    
    /**
     * @dev Gets scholarships for a specific student
     * @param student Address of the student
     * @return Array of scholarship token IDs owned by the student
     */
    function getScholarshipsByStudent(address student) external view returns (uint256[] memory);
    
    // === INVESTOR TRACKING FUNCTIONS ===
    
    /**
     * @dev Gets all investors for a scholarship
     * @param tokenId The ID of the scholarship NFT
     * @return Array of investor addresses
     */
    function getInvestors(uint256 tokenId) external view returns (address[] memory);
    
    /**
     * @dev Gets the contribution amount of a specific investor
     * @param tokenId The ID of the scholarship NFT
     * @param investor Address of the investor
     * @return Amount contributed by the investor
     */
    function getInvestorContribution(uint256 tokenId, address investor) external view returns (uint256);
    
    /**
     * @dev Gets the total funding received for a scholarship
     * @param tokenId The ID of the scholarship NFT
     * @return Total amount funded by all investors
     */
    function getTotalFunding(uint256 tokenId) external view returns (uint256);
    
    /**
     * @dev Gets investor count for a scholarship
     * @param tokenId The ID of the scholarship NFT
     * @return Number of unique investors
     */
    function getInvestorCount(uint256 tokenId) external view returns (uint256);
    
    // === WITHDRAWAL FEE FUNCTIONS ===
    
    /**
     * @dev Gets the fee amount for a specific withdrawal
     * @param tokenId The ID of the scholarship NFT
     * @param withdrawalIndex Index of the withdrawal in history
     * @return Fee amount for the withdrawal (0 if no fee)
     */
    function getWithdrawalFee(uint256 tokenId, uint256 withdrawalIndex) external view returns (uint256);
    
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
    );
}