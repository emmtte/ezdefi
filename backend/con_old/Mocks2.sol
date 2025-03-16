// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "mUSDC") {
        _mint(msg.sender, 1000000 * 10**6); // 1 million USDC
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}

contract MockAave {
    mapping(address => uint256) public deposits;
    uint256 public liquidityRate = 5e26; // 5% APY

    function deposit(address asset, uint256 amount, address onBehalfOf, uint16) external {
        IERC20(asset).transferFrom(msg.sender, address(this), amount);
        deposits[onBehalfOf] += amount;
    }

    function withdraw(address asset, uint256 amount, address to) external returns (uint256) {
        require(deposits[msg.sender] >= amount, "Insufficient balance");
        deposits[msg.sender] -= amount;
        IERC20(asset).transfer(to, amount);
        return amount;
    }

    function getReserveData(address) external view returns (uint256) {
        return liquidityRate;
    }

    function setLiquidityRate(uint256 _rate) external {
        liquidityRate = _rate;
    }
}

contract MockCompound is ERC20 {
    IERC20 public usdc;
    uint256 public exchangeRate = 2e28; // 1 cToken = 0.02 USDC
    uint256 public supplyRate = 1e18; // 1% APY

    constructor(IERC20 _usdc) ERC20("Mock cUSDC", "mcUSDC") {
        usdc = _usdc;
    }

    function mint(uint256 mintAmount) external returns (uint256) {
        usdc.transferFrom(msg.sender, address(this), mintAmount);
        uint256 cTokens = (mintAmount * 1e18) / exchangeRate;
        _mint(msg.sender, cTokens);
        return 0;
    }

    function redeem(uint256 redeemTokens) external returns (uint256) {
        uint256 usdcAmount = (redeemTokens * exchangeRate) / 1e18;
        _burn(msg.sender, redeemTokens);
        usdc.transfer(msg.sender, usdcAmount);
        return 0;
    }

    function exchangeRateStored() external view returns (uint256) {
        return exchangeRate;
    }

    function supplyRatePerBlock() external view returns (uint256) {
        return supplyRate;
    }

    function setExchangeRate(uint256 _rate) external {
        exchangeRate = _rate;
    }

    function setSupplyRate(uint256 _rate) external {
        supplyRate = _rate;
    }
}
