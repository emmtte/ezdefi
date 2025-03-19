// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract YieldOptimizer is ERC20, Ownable {
    using SafeERC20 for IERC20;
    
    IERC20 public immutable asset;
    address[] public allowedVaults;
    address public currentVault;
    uint256 public lastRebalance;
    
    event Deposited(address indexed user, uint256 amount, uint256 shares);
    event Withdrawn(address indexed user, uint256 amount, uint256 shares);
    event Rebalanced(address indexed newVault, uint256 amount);
    event VaultAdded(address indexed vault);
    event VaultRemoved(address indexed vault);

    constructor(IERC20 _asset, address[] memory _vaults) 
        ERC20("Yield Optimizer", "YO") 
        Ownable(msg.sender) 
    {
        asset = _asset;
        for (uint i = 0; i < _vaults.length; i++) {
            _addVault(_vaults[i]);
        }
    }

    // Allow users to deposit assets and receive shares
    function deposit(uint256 amount) external returns (uint256 shares) {
        require(amount > 0, "Amount must be greater than 0");
        
        // Transfer assets from user to this contract
        asset.safeTransferFrom(msg.sender, address(this), amount);
        
        // If this is our first deposit, select the best vault
        if (currentVault == address(0)) {
            currentVault = _findBestVault();
        }
        
        // Deposit assets to the current best vault
        _depositTo(currentVault);
        
        // Calculate shares to mint
        uint256 totalAssetsAfter = totalAssets();
        shares = totalSupply() == 0 ? 
            amount * 1e18 / 1e6 :  // Initial exchange rate (considering decimal differences)
            amount * totalSupply() / (totalAssetsAfter - amount);
        
        // Mint shares to the user
        _mint(msg.sender, shares);
        
        emit Deposited(msg.sender, amount, shares);
        return shares;
    }
    
    // Allow users to withdraw their assets
    function withdraw(uint256 shares) external returns (uint256 amount) {
        require(shares > 0, "Shares must be greater than 0");
        require(balanceOf(msg.sender) >= shares, "Insufficient shares");
        
        uint256 totalAssetsBefore = totalAssets();
        amount = shares * totalAssetsBefore / totalSupply();
        
        // Burn shares
        _burn(msg.sender, shares);
        
        // Ensure we have enough assets in the contract
        uint256 currentBalance = asset.balanceOf(address(this));
        if (currentBalance < amount) {
            _withdrawSomeFromCurrent(amount - currentBalance);
        }
        
        // Transfer assets to user
        asset.safeTransfer(msg.sender, amount);
        
        emit Withdrawn(msg.sender, amount, shares);
        return amount;
    }

    // Calculate total assets across all vaults and in this contract
    function totalAssets() public view returns (uint256) {
        uint256 total = asset.balanceOf(address(this));
        
        if (currentVault != address(0)) {
            IERC4626 vault = IERC4626(currentVault);
            uint256 shares = vault.balanceOf(address(this));
            if (shares > 0) {
                total += vault.previewRedeem(shares);
            }
        }
        
        return total;
    }

    function addVault(address vault) external onlyOwner {
        _addVault(vault);
    }

    function removeVault(address vault) external onlyOwner {
        allowedVaults = _removeFromArray(allowedVaults, vault);
        emit VaultRemoved(vault);
    }

    function rebalance() external onlyOwner {
        require(block.timestamp >= lastRebalance + 1 days, "Rebalance cooldown");
        
        address bestVault = _findBestVault();
        
        if (bestVault != currentVault) {
            _withdrawFromCurrent();
            _depositTo(bestVault);
            currentVault = bestVault;
            emit Rebalanced(bestVault, asset.balanceOf(address(this)));
        }
        
        lastRebalance = block.timestamp;
    }

    function _addVault(address vault) internal {
        allowedVaults.push(vault);
        asset.approve(vault, type(uint256).max);
        emit VaultAdded(vault);
    }

    function _findBestVault() internal view returns (address best) {
        uint256 highestRate;
        for (uint i = 0; i < allowedVaults.length; i++) {
            IERC4626 vault = IERC4626(allowedVaults[i]);
            uint256 rate = vault.previewDeposit(1e6); // APY equivalent
            if (rate > highestRate) {
                highestRate = rate;
                best = allowedVaults[i];
            }
        }
        require(best != address(0), "No vaults available");
    }

    function _withdrawFromCurrent() internal {
        if (currentVault != address(0)) {
            IERC4626 vault = IERC4626(currentVault);
            uint256 shares = vault.balanceOf(address(this));
            if (shares > 0) {
                vault.redeem(shares, address(this), address(this));
            }
        }
    }
    
    function _withdrawSomeFromCurrent(uint256 amount) internal {
        if (currentVault != address(0)) {
            IERC4626 vault = IERC4626(currentVault);
            uint256 assetAmount = amount > 0 ? amount : asset.balanceOf(address(this));
            vault.withdraw(assetAmount, address(this), address(this));
        }
    }

    function _depositTo(address vault) internal {
        uint256 amount = asset.balanceOf(address(this));
        if (amount > 0) {
            IERC4626(vault).deposit(amount, address(this));
        }
    }

    function _removeFromArray(address[] memory arr, address element) internal pure returns (address[] memory) {
        address[] memory newArr = new address[](arr.length - 1);
        uint256 j;
        for (uint i = 0; i < arr.length; i++) {
            if (arr[i] != element) {
                newArr[j++] = arr[i];
            }
        }
        return newArr;
    }
}