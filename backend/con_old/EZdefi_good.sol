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

        console.log("** allocateFunds: ", protocol);
        console.log("** allocateFunds aave: ", address(aave));
        console.log("** allocateFunds ctoken: ", address(cToken));
        console.log("** allocateFunds usdc: ", address(usdc));
        console.log("** allocateFunds this: ", address(this));
        
        usdc.approve(protocol, amount);
        if (protocol == address(aave)) {
            console.log("** allocateFunds deposit aave address(usdc)", address(usdc));
            console.log("** allocateFunds deposit aave amount", amount);
            console.log("** allocateFunds deposit aave address(this)", address(this));
            aave.deposit(address(usdc), amount, address(this), 0);
        } else {
            cToken.supply(amount);
        }
        currentProtocol = protocol;
    }

    function getBestProtocol() public view returns (address) {
        uint256 aaveRate = aave.getReserveData(address(usdc));
        uint256 compoundRate = cToken.exchangeRateStored();
        console.log("** getBestProtocol Aave rate: ", aaveRate, "Address AAve", address(aave));
        console.log("** getBestProtocol Compound rate: ", compoundRate, "Address Compound", address(cToken));
        return (aaveRate >= compoundRate) ? address(aave) : address(cToken);
    }

    function retrieveFunds(uint256 amount) internal {
        console.log("** retrieveFunds currentProtocol: ",currentProtocol);
        console.log("** retrieveFunds aave address: ",address(aave));
        console.log("** retrieveFunds cToken address: ", address(cToken));
        console.log("** retrieveFunds usdc address", address(usdc));
        console.log("** retrieveFunds adress this", address(this));

        if (currentProtocol == address(aave)) {
            aave.withdraw(address(usdc), amount, address(this));
            console.log("**Aave withdraw");
            console.log("**usdc", address(usdc));
            console.log("**amount", amount);
            console.log("**user", address(this));
        } else {
            cToken.withdraw(amount);
            console.log("**Compound withdraw");
            console.log("**amount", amount);
            console.log("**usdc", address(usdc));
            console.log("**user", address(this));
        }
    }

    function rebalance() external {
        require(block.timestamp >= lastRebalance + 12 hours, "Rebalance too soon");

        console.log("**Old protocol: ", currentProtocol);
        address newProtocol = getBestProtocol();
        console.log("**New protocol: ", newProtocol);

        if (newProtocol != currentProtocol) {
            uint256 balance = usdc.balanceOf(address(this));
            console.log("**Balance before rebalance: ", balance);

            retrieveFunds(balance);
            console.log("**Balance after retrieveFunds: ", usdc.balanceOf(address(this)));

            allocateFunds(newProtocol, balance);
            console.log("**Balance after allocateFunds: ", usdc.balanceOf(address(this)));

            currentProtocol = newProtocol;

            emit Rebalanced(newProtocol);
        }

        lastRebalance = block.timestamp;
    }
}