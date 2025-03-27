// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IMintableERC20 {
    function mint(address to, uint256 amount) external;
}

contract aToken is ERC4626, Ownable {
    uint256 public interestRate = 1500;
    uint256 public lastInterestUpdate;
    
    constructor(
        IERC20 asset,
        string memory name,
        string memory symbol
    ) ERC4626(asset) ERC20(name, symbol) Ownable(msg.sender) {
        lastInterestUpdate = block.timestamp;
    }
    
    function setInterestRate(uint256 newRate) external {
        interestRate = newRate;
    }
    
    function getInterestRate() public view returns (uint256) {
        return interestRate;
    }

    function accrueInterest() external {
        uint256 timeElapsed = block.timestamp - lastInterestUpdate;
        if (timeElapsed > 0) {
            uint256 totalAssets = IERC20(asset()).balanceOf(address(this));
            if (totalAssets > 0) {
                uint256 interestAmount = (totalAssets * interestRate * timeElapsed) / (10000 * 365 days);
                if (interestAmount > 0) {
                    IMintableERC20(address(asset())).mint(address(this), interestAmount);
                }
            }
            lastInterestUpdate = block.timestamp;
        }
    }
}