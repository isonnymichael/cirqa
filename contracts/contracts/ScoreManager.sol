// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IScoreManager.sol";
import "./interfaces/ICirqaToken.sol";
import "./interfaces/IScholarshipManager.sol";

/**
 * @title ScoreManager
 * @dev Manages scholarship scoring using Cirqa tokens
 */
contract ScoreManager is IScoreManager, Ownable {
    struct ScoreData {
        uint256 totalScore;       // Sum of all scores (weighted by tokens)
        uint256 totalTokens;      // Total tokens used for scoring
        uint256 ratingCount;      // Number of ratings
        mapping(address => Rating) ratingsByInvestor; // Ratings by investor address
    }
    
    struct Rating {
        uint8 score;             // Score value (1-10)
        uint256 tokens;          // Tokens used for this rating
        uint256 timestamp;       // When the rating was given
    }
    
    struct ScholarshipScore {
        uint256 tokenId;
        uint256 score;
    }
    
    // Mapping from token ID to score data
    mapping(uint256 => ScoreData) private scores;
    
    // Array to track top rated scholarships
    ScholarshipScore[] private topRatedScholarships;
    
    // Address of the Core contract
    address private coreContract;
    
    // Cirqa token contract
    ICirqaToken private cirqaToken;
    
    // Scholarship Manager contract for auto-freeze functionality
    IScholarshipManager private scholarshipManager;
    
    // Minimum amount of tokens required for rating
    uint256 public minRatingTokens = 1e18; // 1 Cirqa token
    
    // Events
    event ScholarshipRated(uint256 indexed tokenId, address indexed investor, uint8 score, uint256 tokens);
    event MinRatingTokensUpdated(uint256 oldValue, uint256 newValue);
    event AutoFreezeStatusUpdated(uint256 indexed tokenId, bool frozen, uint256 currentScore);
    
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
     * @dev Sets the Cirqa token contract
     * @param _cirqaToken Address of the Cirqa token contract
     */
    function setCirqaToken(address _cirqaToken) external onlyOwner {
        require(_cirqaToken != address(0), "Invalid address");
        cirqaToken = ICirqaToken(_cirqaToken);
    }
    
    /**
     * @dev Sets the Scholarship Manager contract for auto-freeze functionality
     * @param _scholarshipManager Address of the Scholarship Manager contract
     */
    function setScholarshipManager(address _scholarshipManager) external onlyOwner {
        require(_scholarshipManager != address(0), "Invalid address");
        scholarshipManager = IScholarshipManager(_scholarshipManager);
    }
    
    /**
     * @dev Sets the minimum amount of tokens required for rating
     * @param _minRatingTokens New minimum amount
     */
    function setMinRatingTokens(uint256 _minRatingTokens) external onlyOwner {
        uint256 oldValue = minRatingTokens;
        minRatingTokens = _minRatingTokens;
        emit MinRatingTokensUpdated(oldValue, _minRatingTokens);
    }
    
    /**
     * @dev Initializes a score for a new scholarship
     * @param tokenId The ID of the scholarship NFT
     */
    function initializeScore(uint256 tokenId) external override onlyCore {
        // No initialization needed for now, the struct will be created when first rated
    }
    
    /**
     * @dev Allows an investor to rate a scholarship using Cirqa tokens
     * @param tokenId The ID of the scholarship NFT to rate
     * @param score Score value (1-10)
     * @param amount Amount of Cirqa tokens to use for rating
     */
    function rateScholarship(uint256 tokenId, uint8 score, uint256 amount) external override {
        require(score >= 1 && score <= 10, "Score must be between 1 and 10");
        require(amount >= minRatingTokens, "Amount below minimum");
        
        // Transfer Cirqa tokens from investor to this contract
        require(cirqaToken.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        
        // Get previous rating if exists
        uint256 previousScore = 0;
        uint256 previousTokens = 0;
        
        if (scores[tokenId].ratingsByInvestor[msg.sender].tokens > 0) {
            previousScore = scores[tokenId].ratingsByInvestor[msg.sender].score;
            previousTokens = scores[tokenId].ratingsByInvestor[msg.sender].tokens;
            
            // Remove previous rating from total
            scores[tokenId].totalScore -= previousScore * previousTokens;
            scores[tokenId].totalTokens -= previousTokens;
            scores[tokenId].ratingCount -= 1;
        }
        
        // Add new rating
        scores[tokenId].ratingsByInvestor[msg.sender] = Rating({
            score: score,
            tokens: amount,
            timestamp: block.timestamp
        });
        
        scores[tokenId].totalScore += score * amount;
        scores[tokenId].totalTokens += amount;
        scores[tokenId].ratingCount += 1;
        
        // Update top rated scholarships
        updateTopRatedScholarships(tokenId);
        
        // Auto-update freeze status based on new score
        autoUpdateFreezeStatus(tokenId);
        
        emit ScholarshipRated(tokenId, msg.sender, score, amount);
    }
    
    /**
     * @dev Updates the top rated scholarships list
     * @param tokenId The ID of the scholarship NFT that was just rated
     */
    function updateTopRatedScholarships(uint256 tokenId) private {
        uint256 currentScore = getScholarshipScore(tokenId);
        bool found = false;
        
        // Check if scholarship is already in the top list
        for (uint256 i = 0; i < topRatedScholarships.length; i++) {
            if (topRatedScholarships[i].tokenId == tokenId) {
                topRatedScholarships[i].score = currentScore;
                found = true;
                break;
            }
        }
        
        // If not found, add it
        if (!found) {
            topRatedScholarships.push(ScholarshipScore({
                tokenId: tokenId,
                score: currentScore
            }));
        }
        
        // Sort the array (simple bubble sort for now, can be optimized)
        for (uint256 i = 0; i < topRatedScholarships.length - 1; i++) {
            for (uint256 j = 0; j < topRatedScholarships.length - i - 1; j++) {
                if (topRatedScholarships[j].score < topRatedScholarships[j + 1].score) {
                    ScholarshipScore memory temp = topRatedScholarships[j];
                    topRatedScholarships[j] = topRatedScholarships[j + 1];
                    topRatedScholarships[j + 1] = temp;
                }
            }
        }
    }
    
    /**
     * @dev Gets the current score for a scholarship
     * @param tokenId The ID of the scholarship NFT
     * @return The current average score (0-10 with 2 decimals precision)
     */
    function getScholarshipScore(uint256 tokenId) public view override returns (uint256) {
        if (scores[tokenId].totalTokens == 0) {
            return 0;
        }
        
        // Return score with 2 decimal precision (multiply by 100)
        return (scores[tokenId].totalScore * 100) / scores[tokenId].totalTokens;
    }
    
    /**
     * @dev Gets the total amount of Cirqa tokens used to rate a scholarship
     * @param tokenId The ID of the scholarship NFT
     * @return The total amount of Cirqa tokens used for rating
     */
    function getTotalRatingTokens(uint256 tokenId) external view override returns (uint256) {
        return scores[tokenId].totalTokens;
    }
    
    /**
     * @dev Gets the number of ratings for a scholarship
     * @param tokenId The ID of the scholarship NFT
     * @return The number of ratings
     */
    function getRatingCount(uint256 tokenId) external view override returns (uint256) {
        return scores[tokenId].ratingCount;
    }
    
    /**
     * @dev Gets the top rated scholarships
     * @param count Number of top scholarships to return
     * @return tokenIds Array of scholarship token IDs
     * @return scholarshipScores Array of corresponding scores
     */
    function getTopRatedScholarships(uint256 count) external view override returns (uint256[] memory tokenIds, uint256[] memory scholarshipScores) {
        uint256 resultCount = count;
        if (resultCount > topRatedScholarships.length) {
            resultCount = topRatedScholarships.length;
        }
        
        tokenIds = new uint256[](resultCount);
        scholarshipScores = new uint256[](resultCount);
        
        for (uint256 i = 0; i < resultCount; i++) {
            tokenIds[i] = topRatedScholarships[i].tokenId;
            scholarshipScores[i] = topRatedScholarships[i].score;
        }
    }
    
    /**
     * @dev Gets the rating given by an investor for a scholarship
     * @param tokenId The ID of the scholarship NFT
     * @param investor Address of the investor
     * @return score The score given by the investor
     * @return tokens The amount of tokens used for the rating
     * @return timestamp When the rating was given
     */
    function getInvestorRating(uint256 tokenId, address investor) external view returns (uint8 score, uint256 tokens, uint256 timestamp) {
        Rating storage rating = scores[tokenId].ratingsByInvestor[investor];
        return (rating.score, rating.tokens, rating.timestamp);
    }
    
    /**
     * @dev Automatically updates freeze status based on current score
     * @param tokenId The ID of the scholarship NFT
     * @notice This is called automatically after each rating
     */
    function autoUpdateFreezeStatus(uint256 tokenId) private {
        // Only proceed if ScholarshipManager is set
        if (address(scholarshipManager) == address(0)) {
            return;
        }
        
        uint256 currentScore = getScholarshipScore(tokenId);
        
        // Only check freeze status if scholarship has been rated (score > 0)
        if (currentScore > 0) {
            // Threshold is 3.0 with 2 decimal precision = 300
            bool shouldFreeze = currentScore < 300;
            bool currentlyFrozen = scholarshipManager.isFrozen(tokenId);
            
            // Only update if status needs to change
            if (shouldFreeze != currentlyFrozen) {
                scholarshipManager.updateFreezeStatus(tokenId);
                emit AutoFreezeStatusUpdated(tokenId, shouldFreeze, currentScore);
            }
        }
    }
}