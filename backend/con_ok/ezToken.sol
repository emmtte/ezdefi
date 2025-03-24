// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface Vault is IERC4626 {
    function getInterestRate() external view returns (uint256);
}

contract YieldOptimizer is ERC20, Ownable {
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

    function deposit(uint256 amount) external returns (uint256 shares) {
        require(amount > 0, "Amount must be greater than 0");
        require(asset.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        if (currentVault == address(0)) {
            currentVault = findBestVault();
        }
        _depositTo(currentVault);
        uint256 totalAssetsAfter = totalAssets();
        shares = totalSupply() == 0 ? 
            amount * 1e18 / 1e6 :
            amount * totalSupply() / (totalAssetsAfter - amount);
        _mint(msg.sender, shares);
        emit Deposited(msg.sender, amount, shares);
        return shares;
    }
    
    function withdraw(uint256 shares) external returns (uint256 amount) {
        require(shares > 0, "Shares must be greater than 0");
        require(balanceOf(msg.sender) >= shares, "Insufficient shares");
        uint256 totalAssetsBefore = totalAssets();
        amount = shares * totalAssetsBefore / totalSupply();
        _burn(msg.sender, shares);
        uint256 currentBalance = asset.balanceOf(address(this));
        if (currentBalance < amount) {
            _withdrawSomeFromCurrent(amount - currentBalance);
        }
        require(asset.transfer(msg.sender, amount), "Transfer failed");
        emit Withdrawn(msg.sender, amount, shares);
        return amount;
    }

    // Le reste des fonctions reste identique...
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
        require(block.timestamp >= lastRebalance + 12 hours, "Rebalance cooldown");
        address bestVault = findBestVault();
        if (bestVault != currentVault) {
            _withdrawFromCurrent();
            _depositTo(bestVault);
            currentVault = bestVault;
            emit Rebalanced(bestVault, asset.balanceOf(address(this)));
        }
        lastRebalance = block.timestamp;
    }


    // Puis dans votre fonction findBestVault, utilisez cette interface
    function findBestVault() public view returns (address best) {
        uint256 highestRate = 0;
        for (uint i = 0; i < allowedVaults.length; i++) {
            Vault vault = Vault(allowedVaults[i]);
            uint256 rate = vault.getInterestRate();
            if (rate > highestRate) {
                highestRate = rate;
                best = allowedVaults[i];
            }
        }
        require(best != address(0), "No vaults available");
        return best;
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
            vault.withdraw(amount, address(this), address(this));
        }
    }

    function _depositTo(address vault) internal {
        uint256 amount = asset.balanceOf(address(this));
        if (amount > 0) {
            IERC4626(vault).deposit(amount, address(this));
        }
    }

    function _addVault(address vault) internal {
        allowedVaults.push(vault);
        require(asset.approve(vault, type(uint256).max), "Approve failed");
        emit VaultAdded(vault);
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