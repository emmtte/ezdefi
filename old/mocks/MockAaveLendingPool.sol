// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract MockAaveLendingPool {
    uint256 private _rate;
    mapping(address => uint256) public deposits;

    function setRate(uint256 rate_) external {
        _rate = rate_;
    }

    function deposit(address asset, uint256 amount) external {
        deposits[asset] += amount;
        IERC20(asset).transferFrom(msg.sender, address(this), amount);
    }

    function withdraw(address asset, uint256 amount, address to) external returns (uint256) {
        require(deposits[asset] >= amount, "Insufficient funds");
        deposits[asset] -= amount;
        IERC20(asset).transfer(to, amount);
        return amount;
    }

    function getReserveData(address) external view returns (uint256) {
        return _rate;
    }
}