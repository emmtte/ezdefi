// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MintableUSDC is ERC20, Ownable {
    mapping(address => bool) public minters;
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }
    
    function addMinter(address minter) external onlyOwner {
        minters[minter] = true;
    }
    
    function removeMinter(address minter) external onlyOwner {
        minters[minter] = false;
    }
    
    function mint(address to, uint256 amount) external {
        require(minters[msg.sender] || msg.sender == owner(), "Not authorized to mint");
        _mint(to, amount);
    }

    function faucet() external {
        _mint(msg.sender, 10000 * 10**18 );
    }
}