// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IScoreManager
 * @dev Interface for the ScoreManager contract that handles scholarship scoring
 */
interface IScoreManager {
    /**
     * @dev Initializes a score for a new scholarship
     * @param tokenId The ID of the scholarship NFT
     */
    function initializeScore(uint256 tokenId) external;
    
    /**
     * @dev Allows an investor to rate a scholarship using Cirqa tokens
     * @param tokenId The ID of the scholarship NFT to rate
     * @param score Score value (1-10)
     * @param amount Amount of Cirqa tokens to use for rating
     */
    function rateScholarship(uint256 tokenId, uint8 score, uint256 amount) external;
    
    /**
     * @dev Gets the current score for a scholarship
     * @param tokenId The ID of the scholarship NFT
     * @return The current average score (0-10 with 2 decimals precision)
     */
    function getScholarshipScore(uint256 tokenId) external view returns (uint256);
    
    /**
     * @dev Gets the total amount of Cirqa tokens used to rate a scholarship
     * @param tokenId The ID of the scholarship NFT
     * @return The total amount of Cirqa tokens used for rating
     */
    function getTotalRatingTokens(uint256 tokenId) external view returns (uint256);
    
    /**
     * @dev Gets the number of ratings for a scholarship
     * @param tokenId The ID of the scholarship NFT
     * @return The number of ratings
     */
    function getRatingCount(uint256 tokenId) external view returns (uint256);
    
    /**
     * @dev Gets the top rated scholarships
     * @param count Number of top scholarships to return
     * @return tokenIds Array of scholarship token IDs
     * @return scores Array of corresponding scores
     */
    function getTopRatedScholarships(uint256 count) external view returns (uint256[] memory tokenIds, uint256[] memory scores);
}