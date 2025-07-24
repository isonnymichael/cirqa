// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CirqaProtocol is Ownable {
    IERC20 public immutable cirqaToken;

    mapping(address => uint256) public staked;

    constructor(address _cirqaTokenAddress) Ownable(msg.sender) {
        cirqaToken = IERC20(_cirqaTokenAddress);
    }

    function stake(uint256 amount) external {
        require(amount > 0, "Cannot stake 0");
        staked[msg.sender] += amount;
        bool success = cirqaToken.transferFrom(msg.sender, address(this), amount);
        require(success, "Token transfer failed");
    }

    function unstake(uint256 amount) external {
        require(staked[msg.sender] >= amount, "Cannot unstake more than you have staked");
        staked[msg.sender] -= amount;
        cirqaToken.transfer(msg.sender, amount);
    }

    function claimReward() external {
        // Reward logic will be added here
    }
}