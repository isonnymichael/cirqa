// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "./ICirqaToken.sol";

/**
 * @title CirqaProtocol
 * @dev A scholarship system where students can mint NFTs with their data and receive USDT funding from investors.
 * Investors are rewarded with Cirqa tokens for their contributions.
 */
contract CirqaProtocol is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    ICirqaToken public cirqaToken;
    IERC20 public usdtToken;
    Counters.Counter private _tokenIds;

    // Reward rate for investors (in Cirqa tokens per 1 USDT)
    uint256 public rewardRate = 1e18; // 1 Cirqa token per 1 USDT

    struct ScholarshipData {
        address student;
        uint256 balance;
        string metadata; // IPFS hash containing student data (photos, documents, etc.)
    }

    mapping(uint256 => ScholarshipData) public scholarships;

    event ScholarshipCreated(uint256 indexed tokenId, address indexed student, string metadata);
    event ScholarshipFunded(uint256 indexed tokenId, address indexed investor, uint256 amount);
    event FundsWithdrawn(uint256 indexed tokenId, address indexed student, uint256 amount);
    event USDTContractUpdated(address indexed oldContract, address indexed newContract);

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
     * @dev Creates a new scholarship NFT for a student
     * @param metadata IPFS hash containing student data
     * @return tokenId The ID of the newly minted NFT
     */
    function createScholarship(string memory metadata) external returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, metadata);

        scholarships[newTokenId] = ScholarshipData({
            student: msg.sender,
            balance: 0,
            metadata: metadata
        });

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

        // Transfer USDT from investor to contract
        require(usdtToken.transferFrom(msg.sender, address(this), amount), "USDT transfer failed");

        // Update scholarship balance
        scholarships[tokenId].balance += amount;

        // Calculate and transfer Cirqa rewards to investor
        uint256 rewardAmount = (amount * rewardRate) / 1e18;
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
        require(msg.sender == scholarships[tokenId].student, "Only student can withdraw");
        require(amount <= scholarships[tokenId].balance, "Insufficient balance");

        scholarships[tokenId].balance -= amount;
        require(usdtToken.transfer(msg.sender, amount), "USDT transfer failed");

        emit FundsWithdrawn(tokenId, msg.sender, amount);
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
     */
    function updateRewardRate(uint256 newRate) external onlyOwner {
        rewardRate = newRate;
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