// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IAaveLendingPool {
    function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
    function getReserveData(address asset) external view returns (uint256 currentLiquidityRate);
}

interface ICompound {
    function mint(uint256 mintAmount) external returns (uint256);
    function redeem(uint256 redeemTokens) external returns (uint256);
    function exchangeRateStored() external view returns (uint256);
    function supplyRatePerBlock() external view returns (uint256);
}

contract YieldOptimizingVault is ERC4626, Ownable {
    IERC20 public immutable usdc;
    IAaveLendingPool public immutable aave;
    ICompound public immutable compound;
    
    enum Protocol { Aave, Compound }
    Protocol public currentStrategy;
    
    uint256 public lastRebalance;
    uint256 public constant REBALANCE_INTERVAL = 1 days;

    constructor(
        IERC20 _usdc,
        address _aave,
        address _compound
    ) ERC4626(_usdc) ERC20("Yield Optimizing USDC", "yoUSDC") Ownable(msg.sender) {
        usdc = _usdc;
        aave = IAaveLendingPool(_aave);
        compound = ICompound(_compound);
        
        _usdc.approve(_aave, type(uint256).max);
        _usdc.approve(_compound, type(uint256).max);
    }

    function totalAssets() public view override returns (uint256) {
        return _getCurrentProtocolBalance();
    }

    function deposit(uint256 assets, address receiver) public override returns (uint256) {
        uint256 shares = super.deposit(assets, receiver);
        _rebalanceIfNeeded();
        return shares;
    }

    function withdraw(uint256 assets, address receiver, address owner) public override returns (uint256) {
        uint256 shares = super.withdraw(assets, receiver, owner);
        _rebalanceIfNeeded();
        return shares;
    }

    function _rebalanceIfNeeded() internal {
        if (block.timestamp - lastRebalance >= REBALANCE_INTERVAL) {
            _rebalance();
        }
    }

    function _rebalance() internal {
        (Protocol bestProtocol,) = _getBestProtocol();
        if (bestProtocol != currentStrategy) {
            uint256 balance = _getCurrentProtocolBalance();
            _withdrawFromProtocol(balance);
            _depositToProtocol(balance, bestProtocol);
            currentStrategy = bestProtocol;
        }
        lastRebalance = block.timestamp;
    }

    function _getBestProtocol() internal view returns (Protocol, uint256) {
        uint256 aaveRate = aave.getReserveData(address(usdc));
        uint256 compoundRate = compound.supplyRatePerBlock() * 2102400; // Approximation annuelle
        return aaveRate > compoundRate ? (Protocol.Aave, aaveRate) : (Protocol.Compound, compoundRate);
    }

    function _depositToProtocol(uint256 amount, Protocol protocol) internal {
        if (protocol == Protocol.Aave) {
            aave.deposit(address(usdc), amount, address(this), 0);
        } else {
            compound.mint(amount);
        }
    }

    function _withdrawFromProtocol(uint256 amount) internal {
        if (currentStrategy == Protocol.Aave) {
            aave.withdraw(address(usdc), amount, address(this));
        } else {
            uint256 cTokens = amount * 1e18 / compound.exchangeRateStored();
            compound.redeem(cTokens);
        }
    }

    function _getCurrentProtocolBalance() internal view returns (uint256) {
        if (currentStrategy == Protocol.Aave) {
            return usdc.balanceOf(address(this));
        } else {
            uint256 cTokenBalance = IERC20(address(compound)).balanceOf(address(this));
            return cTokenBalance * compound.exchangeRateStored() / 1e18;
        }
    }

    function manualRebalance() external onlyOwner {
        _rebalance();
    }
}
