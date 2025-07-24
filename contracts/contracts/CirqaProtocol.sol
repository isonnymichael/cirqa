// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ICirqaToken.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CirqaProtocol is Ownable {
    ICirqaToken public immutable cirqaToken;

    // Mapping from asset address to user address to the amount supplied
    mapping(address => mapping(address => uint256)) public supplied;

    // Mapping from asset address to user address to the amount borrowed
    mapping(address => mapping(address => uint256)) public borrowed;

    // Mapping from user address to asset address to the amount of collateral
    mapping(address => mapping(address => uint256)) public collateral;

    constructor(address _cirqaTokenAddress) Ownable(msg.sender) {
        cirqaToken = ICirqaToken(_cirqaTokenAddress);
    }

    function supply(address _asset, uint256 _amount) external {
        require(_amount > 0, "Amount must be greater than 0");
        IERC20(_asset).transferFrom(msg.sender, address(this), _amount);
        supplied[_asset][msg.sender] += _amount;
        // Add logic for reward distribution
    }

    function withdraw(address _asset, uint256 _amount) external {
        require(_amount > 0, "Amount must be greater than 0");
        require(supplied[_asset][msg.sender] >= _amount, "Insufficient supplied balance");
        supplied[_asset][msg.sender] -= _amount;
        IERC20(_asset).transfer(msg.sender, _amount);
        // Add logic for reward distribution
    }

    function borrow(address _asset, uint256 _amount) external {
        require(_amount > 0, "Amount must be greater than 0");
        // Add logic for checking collateral
        borrowed[_asset][msg.sender] += _amount;
        IERC20(_asset).transfer(msg.sender, _amount);
        // Add logic for reward distribution
    }

    function repay(address _asset, uint256 _amount) external {
        require(_amount > 0, "Amount must be greater than 0");
        require(borrowed[_asset][msg.sender] >= _amount, "Repay amount exceeds borrowed amount");
        IERC20(_asset).transferFrom(msg.sender, address(this), _amount);
        borrowed[_asset][msg.sender] -= _amount;
        // Add logic for reward distribution
    }

    function addCollateral(address _asset, uint256 _amount) external {
        require(_amount > 0, "Amount must be greater than 0");
        IERC20(_asset).transferFrom(msg.sender, address(this), _amount);
        collateral[msg.sender][_asset] += _amount;
    }

    function removeCollateral(address _asset, uint256 _amount) external {
        require(_amount > 0, "Amount must be greater than 0");
        require(collateral[msg.sender][_asset] >= _amount, "Insufficient collateral");
        collateral[msg.sender][_asset] -= _amount;
        IERC20(_asset).transfer(msg.sender, _amount);
    }

    /**
     * @notice Mints CIRQA token rewards to a user.
     * @dev This function can be called to claim rewards.
     * The logic for calculating the reward amount should be implemented here.
     * @param _amount The amount of CIRQA tokens to mint as a reward.
     */
    function claimReward(uint256 _amount) external {
        // For now, any user can claim a fixed amount for demonstration
        // In a real implementation, you would have logic to determine who can claim and how much.
        require(_amount > 0, "Amount must be greater than 0");
        cirqaToken.mint(msg.sender, _amount);
    }
}