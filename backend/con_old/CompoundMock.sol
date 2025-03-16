// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockCompoundERC4626 is ERC4626 {
    uint256 public exchangeRateStored;
    
    constructor(
        IERC20 asset,
        string memory name,
        string memory symbol
    ) ERC4626(asset) ERC20(name, symbol) {
        exchangeRateStored = 10**18; // Initialisé à 1:1
    }
    
    // Possibilité d'ajuster le taux d'échange pour simuler les intérêts accumulés
    function setExchangeRate(uint256 newRate) external {
        exchangeRateStored = newRate;
    }
    
    // Override des méthodes pertinentes pour utiliser le taux d'échange personnalisé
    function convertToShares(uint256 assets) public view override returns (uint256) {
        return (assets * 10**18) / exchangeRateStored;
    }
    
    function convertToAssets(uint256 shares) public view override returns (uint256) {
        return (shares * exchangeRateStored) / 10**18;
    }
}