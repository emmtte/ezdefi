// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Interface avec fonction de mint
interface IMintableERC20 {
    function mint(address to, uint256 amount) external;
}

contract MintableUSDC is ERC20, Ownable {
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }
    
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}

contract AdvancedCompoundERC4626 is ERC4626, Ownable {
    uint256 public exchangeRateStored;
    
    constructor(
        IERC20 asset,
        string memory name,
        string memory symbol
    ) ERC4626(asset) ERC20(name, symbol) Ownable(msg.sender) {
        exchangeRateStored = 10**18; // Initialisé à 1:1
    }
    
    // Possibilité d'ajuster le taux d'échange pour simuler les intérêts accumulés
    function setExchangeRate(uint256 newRate) external onlyOwner {
        exchangeRateStored = newRate;
    }
    
    // Override des méthodes pertinentes pour utiliser le taux d'échange personnalisé
    function convertToShares(uint256 assets) public view override returns (uint256) {
        return (assets * 10**18) / exchangeRateStored;
    }
    
    function convertToAssets(uint256 shares) public view override returns (uint256) {
        return (shares * exchangeRateStored) / 10**18;
    }
    
    // Cette fonction crée de nouveaux tokens USDC pour simuler les intérêts accumulés
    function accrueInterest(uint256 interestAmount) external onlyOwner {
        // Crée de nouveaux tokens USDC et les ajoute au contrat
        IMintableERC20(address(asset())).mint(address(this), interestAmount);
    }
    
    // Override de la méthode redeem pour utiliser notre conversion personnalisée
    function redeem(
        uint256 shares,
        address receiver,
        address owner
    ) public override returns (uint256) {
        uint256 assets = convertToAssets(shares);
        
        // Vérification d'autorisation standard
        if (owner != msg.sender) {
            uint256 allowed = allowance(owner, msg.sender);
            if (allowed != type(uint256).max) {
                require(allowed >= shares, "ERC4626: redeem amount exceeds allowance");
                _approve(owner, msg.sender, allowed - shares);
            }
        }
        
        // Brûle les parts
        _burn(owner, shares);
        
        // Transfère les actifs sous-jacents
        IERC20(asset()).transfer(receiver, assets);
        
        emit Withdraw(msg.sender, receiver, owner, assets, shares);
        
        return assets;
    }
}