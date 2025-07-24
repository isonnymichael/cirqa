// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CirqaToken is ERC20, ERC20Burnable, Ownable {
    uint256 public constant MAX_SUPPLY = 10_000_000_000 * 10**18;

    constructor() ERC20("Cirqa Token", "CIRQA") Ownable(msg.sender) {
        _mint(msg.sender, MAX_SUPPLY);
    }
}