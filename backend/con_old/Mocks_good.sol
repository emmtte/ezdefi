// Mocks.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";
/*
contract MockAaveLendingPool2 {
    uint256 private _rate;
    mapping(address => uint256) public deposits;

    function setRate(uint256 rate_) external {
        _rate = rate_;
    }

    function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external override {
        require(amount > 0, "Amount must be greater than zero");
        balances[onBehalfOf] += amount;
        collateral[onBehalfOf] += amount;
    }

    function deposit(address asset, uint256 amount) external {
        deposits[asset] += amount;
        IERC20(asset).transferFrom(msg.sender, address(this), amount);
    }

    function withdraw(address asset, uint256 amount, address to) external returns (uint256) {
        require(deposits[asset] >= amount, "MockAaveLendingPool withdraw Insufficient funds");
        deposits[asset] -= amount;
        IERC20(asset).transfer(to, amount);
        return amount;
    }

    function getReserveData(address) external view returns (uint256) {
        return _rate;
    }
}
*/
contract MockAaveLendingPool {
    // Mapping to simulate liquidity rates for assets
    mapping(address => uint256) public liquidityRates;
    // Mapping to simulate user balances
    mapping(address => mapping(address => uint256)) public userBalances;

    // Deposit function simulates deposit in Aave
    function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external {
        require(amount > 0, "Amount must be greater than zero");
        userBalances[asset][onBehalfOf] += amount;
    }

    // Withdraw function simulates withdraw from Aave
    function withdraw(address asset, uint256 amount, address to) external returns (uint256) {
        require(amount > 0, "Amount must be greater than zero");
        require(userBalances[asset][msg.sender] >= amount, "Insufficient balance");

        // Decrease the user's balance
        userBalances[asset][msg.sender] -= amount;

        // In a real contract, we would transfer the asset here (e.g., ERC20 transfer)
        // For now, just return the amount to simulate a successful withdrawal
        return amount;
    }

    // getReserveData function returns only liquidityRate
    function getReserveData(address asset) external view returns (uint256 liquidityRate) {
        liquidityRate = liquidityRates[asset]; // Return the liquidity rate set for the asset
    }

    // Function to set liquidity rates for testing purposes
    function setLiquidityRate(address asset, uint256 rate) external {
        liquidityRates[asset] = rate;
    }
}














contract MockCompoundCToken {
    uint256 private _rate;
    mapping(address => uint256) public supplies;
    IERC20 public usdc;

    constructor(address usdcAddress) {
        usdc = IERC20(usdcAddress);
    }

    function setRate(uint256 rate_) external {
        _rate = rate_;
    }

    function supply(uint256 amount) external returns (uint256) {
        supplies[msg.sender] += amount;
        usdc.transferFrom(msg.sender, address(this), amount);
        return 0; // Success code
    }

    function withdraw(uint256 amount) external returns (uint256) {
        console.log("** MockCompoundCToken withdraw: amount ",amount);
        console.log("** MockCompoundCToken withdraw: supplies[msg.sender]",supplies[msg.sender]);
        console.log("** MockCompoundCToken withdraw: msg.sender",msg.sender);
        require(supplies[msg.sender] >= amount, "MockCompoundCToken withdraw Insufficient funds");
        supplies[msg.sender] -= amount;
        usdc.transfer(msg.sender, amount);
        return 0; // Success code
    }

    function exchangeRateStored() external view returns (uint256) {
        return _rate;
    }
}

contract MockERC20 is ERC20 {
    uint8 private _decimals;

    constructor(string memory name, string memory symbol, uint8 decimals_) ERC20(name, symbol) {
        _decimals = decimals_;
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}