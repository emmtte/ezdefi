// SPDX-License-Identifier: MIT OR GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

interface IAaveLendingPool {
    function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
    function getReserveData(address asset) external view returns (uint256 liquidityRate);
}

interface ICompoundCToken {
    function supply(uint256 amount) external returns (uint256);
    function withdraw(uint256 amount) external returns (uint256);
    function exchangeRateStored() external view returns (uint256);
}

contract EZdefi is ERC4626, Ownable {
    IERC20 public immutable usdc;
    IAaveLendingPool public aave;
    ICompoundCToken public cToken;
    address public currentProtocol;
    uint256 public lastRebalance;

    event Rebalanced(address newProtocol);

    constructor(
        IERC20 _usdc,
        IAaveLendingPool _aave,
        ICompoundCToken _cToken
    ) ERC4626(_usdc) ERC20("EZDZFI Token", "EZDZFI") Ownable(msg.sender) {
        usdc = _usdc;
        aave = _aave;
        cToken = _cToken;
        lastRebalance = block.timestamp;
    }

    function allocateFunds(address protocol, uint256 amount) public {
        
        usdc.approve(protocol, amount);
        if (protocol == address(aave)) {
        } else {
            cToken.supply(amount);
        }
        currentProtocol = protocol;
    }

    function getBestProtocol() public view returns (address) {
        uint256 aaveRate = aave.getReserveData(address(usdc));
        uint256 compoundRate = cToken.exchangeRateStored();
        return (aaveRate >= compoundRate) ? address(aave) : address(cToken);
    }

    function retrieveFunds(uint256 amount) internal {

        if (currentProtocol == address(aave)) {
            aave.withdraw(address(usdc), amount, address(this));
        } else {
            cToken.withdraw(amount);
        }
    }

    function rebalance() external {
        require(block.timestamp >= lastRebalance + 12 hours, "Rebalance too soon");
        address newProtocol = getBestProtocol();
        if (newProtocol != currentProtocol) {
            uint256 balance = usdc.balanceOf(address(this));
            retrieveFunds(balance);

            allocateFunds(newProtocol, balance);

            currentProtocol = newProtocol;

            emit Rebalanced(newProtocol);
        }

        lastRebalance = block.timestamp;
    }
}