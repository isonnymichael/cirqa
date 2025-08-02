// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CirqaToken is ERC20, ERC20Burnable, Ownable {
    uint256 public constant MAX_SUPPLY = 10_000_000_000 * 10**18;
    address public minter;

    event MinterChanged(address indexed newMinter);

    constructor() ERC20("Cirqa Token", "CIRQA") Ownable() {}

    function setMinter(address _minter) public onlyOwner {
        minter = _minter;
        emit MinterChanged(_minter);
    }

    function mint(address to, uint256 amount) public {
        require(msg.sender == minter, "Only the minter can mint tokens");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }
}