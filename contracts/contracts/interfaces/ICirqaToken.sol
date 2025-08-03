// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ICirqaToken
 * @dev Interface for the Cirqa token contract
 */
interface ICirqaToken {
    /**
     * @dev Mints new tokens
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external;
    
    /**
     * @dev Burns tokens
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) external;
    
    /**
     * @dev Burns tokens from a specific address
     * @param account Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burnFrom(address account, uint256 amount) external;
    
    /**
     * @dev Transfers tokens
     * @param to Address to transfer tokens to
     * @param amount Amount of tokens to transfer
     * @return True if the transfer was successful
     */
    function transfer(address to, uint256 amount) external returns (bool);
    
    /**
     * @dev Gets the balance of an account
     * @param account Address to get the balance of
     * @return The balance of the account
     */
    function balanceOf(address account) external view returns (uint256);
    
    /**
     * @dev Approves an address to spend tokens
     * @param spender Address to approve
     * @param amount Amount of tokens to approve
     * @return True if the approval was successful
     */
    function approve(address spender, uint256 amount) external returns (bool);
    
    /**
     * @dev Gets the allowance of a spender for an owner
     * @param owner Address of the owner
     * @param spender Address of the spender
     * @return The amount of tokens the spender is allowed to spend
     */
    function allowance(address owner, address spender) external view returns (uint256);
    
    /**
     * @dev Transfers tokens from one address to another
     * @param from Address to transfer tokens from
     * @param to Address to transfer tokens to
     * @param amount Amount of tokens to transfer
     * @return True if the transfer was successful
     */
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}