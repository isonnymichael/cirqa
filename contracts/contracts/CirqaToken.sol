// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ICirqaToken.sol";

/**
 * @title CirqaToken
 * @dev ERC20 token for the Cirqa Protocol with minting and burning capabilities
 */
contract CirqaToken is ERC20, ERC20Burnable, Ownable, ICirqaToken {
    // Override functions from ICirqaToken that conflict with ERC20 implementations
    uint256 public constant MAX_SUPPLY = 10_000_000_000 * 10**18;
    address public minter;
    address public scoreManager;

    event MinterChanged(address indexed newMinter);
    event ScoreManagerChanged(address indexed newScoreManager);

    constructor() ERC20("Cirqa Token", "CIRQA") Ownable() {}

    /**
     * @dev Sets the minter address
     * @param _minter Address that can mint tokens
     */
    function setMinter(address _minter) public onlyOwner {
        minter = _minter;
        emit MinterChanged(_minter);
    }

    /**
     * @dev Sets the score manager address
     * @param _scoreManager Address of the score manager contract
     */
    function setScoreManager(address _scoreManager) public onlyOwner {
        scoreManager = _scoreManager;
        emit ScoreManagerChanged(_scoreManager);
    }

    /**
     * @dev Mints new tokens
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) public override {
        require(msg.sender == minter, "Only the minter can mint tokens");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }
    
    /**
     * @dev Override for ICirqaToken.burn
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) public override(ERC20Burnable, ICirqaToken) {
        ERC20Burnable.burn(amount);
    }
    
    /**
     * @dev Override for ICirqaToken.burnFrom
     * @param account Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burnFrom(address account, uint256 amount) public override(ERC20Burnable, ICirqaToken) {
        ERC20Burnable.burnFrom(account, amount);
    }
    
    /**
     * @dev Override for ICirqaToken.balanceOf
     * @param account Address to get the balance of
     * @return The balance of the account
     */
    function balanceOf(address account) public view override(ERC20, ICirqaToken) returns (uint256) {
        return ERC20.balanceOf(account);
    }
    
    /**
     * @dev Override for ICirqaToken.approve
     * @param spender Address to approve
     * @param amount Amount of tokens to approve
     * @return True if the approval was successful
     */
    function approve(address spender, uint256 amount) public override(ERC20, ICirqaToken) returns (bool) {
        return ERC20.approve(spender, amount);
    }
    
    /**
     * @dev Override for ICirqaToken.allowance
     * @param owner Address of the owner
     * @param spender Address of the spender
     * @return The amount of tokens the spender is allowed to spend
     */
    function allowance(address owner, address spender) public view override(ERC20, ICirqaToken) returns (uint256) {
        return ERC20.allowance(owner, spender);
    }
    
    /**
     * @dev Override for ICirqaToken.transferFrom
     * @param from Address to transfer tokens from
     * @param to Address to transfer tokens to
     * @param amount Amount of tokens to transfer
     * @return True if the transfer was successful
     */
    function transferFrom(address from, address to, uint256 amount) public override(ERC20, ICirqaToken) returns (bool) {
        return ERC20.transferFrom(from, to, amount);
    }
    
    /**
     * @dev Override for ICirqaToken.transfer
     * @param to Address to transfer tokens to
     * @param amount Amount of tokens to transfer
     * @return True if the transfer was successful
     */
    function transfer(address to, uint256 amount) public override(ERC20, ICirqaToken) returns (bool) {
        return ERC20.transfer(to, amount);
    }

    /**
     * @dev Approves the score manager to spend tokens
     * @param amount Amount of tokens to approve
     * @return True if the approval was successful
     */
    function approveScoreManager(uint256 amount) public returns (bool) {
        require(scoreManager != address(0), "Score manager not set");
        return approve(scoreManager, amount);
    }
}