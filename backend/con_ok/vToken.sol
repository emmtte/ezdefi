// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract vToken is ERC4626 {
    uint256 private _interestRate = 1e6; // Default 1:1 with no interest

    constructor(
        address asset,
        string memory name,
        string memory symbol
    ) ERC4626(IERC20(asset)) ERC20(name, symbol) {}

    function setInterestRate(uint256 newRate) external {
        _interestRate = newRate;
    }

    function previewDeposit(uint256 assets) public view override returns (uint256) {
        return assets * 1e6 / _interestRate;
    }

    function previewRedeem(uint256 shares) public view override returns (uint256) {
        return shares * _interestRate / 1e6;
    }

    function increaseVirtualBalance(uint256 amount) external {
        // This is a test-only function to simulate yield
        _interestRate = _interestRate * (totalAssets() + amount) / totalAssets();
    }
}