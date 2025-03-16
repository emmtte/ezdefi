// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract AaveMock is ERC4626 {
    // Taux d'intérêt simulé (en base points: 1000 = 10%)
    uint256 private _currentRate = 500; // 5% par défaut
    
    // Événements pour le suivi des actions
    event Deposited(address indexed user, uint256 assets, uint256 shares);
    event Withdrawn(address indexed user, uint256 assets, uint256 shares);
    event RateUpdated(uint256 oldRate, uint256 newRate);
    
    constructor(IERC20Metadata asset_) 
        ERC4626(asset_) 
        ERC20("Aave Interest Bearing Token", "aToken") {}
    
    // Fonction pour simuler le dépôt Aave
    
    function supply(uint256 assets, address onBehalfOf) external returns (uint256) {
        // Utilisation de la fonction deposit d'ERC4626 pour gérer la logique de base
        uint256 shares = deposit(assets, onBehalfOf);
        
        emit Deposited(onBehalfOf, assets, shares);
        return shares;
    }
    
    // Fonction pour simuler le retrait Aave
    /*
    function withdraw(uint256 assets, address receiver, address owner) public override returns (uint256) {
        // Utilisation de la fonction withdraw d'ERC4626
        uint256 shares = super.withdraw(assets, receiver, owner);
        
        emit Withdrawn(owner, assets, shares);
        return shares;
    }
    */
    
    // Obtenir le taux d'intérêt actuel (format Aave)
    function getReserveNormalizedIncome() external view returns (uint256) {
        // Retourne un taux normalisé selon le format Aave
        return 1e27 + (_currentRate * 1e27 / 10000);
    }
    
    // Fonction simplifiée pour obtenir le taux actuel en pourcentage
    function getCurrentRate() external view returns (uint256) {
        return _currentRate;
    }
    
    // Fonction admin pour mettre à jour le taux
    function setRate(uint256 newRate) external {
        uint256 oldRate = _currentRate;
        _currentRate = newRate;
        emit RateUpdated(oldRate, newRate);
    }
    
    // Override pour simuler l'accroissement des actifs basé sur le taux
    
    function totalAssets() public view override returns (uint256) {
        uint256 baseAssets = super.totalAssets();
        return baseAssets + (baseAssets * _currentRate / 10000);
    }

//en moins
/*
function maxRedeemAll(address owner) public view returns (uint256) {
    uint256 totalAssetsWithInterest = totalAssets(); // Inclut les intérêts
    uint256 maxShares = convertToShares(totalAssetsWithInterest);
    uint256 userShares = balanceOf(owner);

    return userShares > maxShares ? maxShares : userShares;
}
*/


///en plus

function convertToAssets(uint256 shares) public view override returns (uint256) {
    uint256 _supply = totalSupply();
    if (_supply == 0) {
        return shares;
    }
    
    // Calculer les actifs avec intérêts
    uint256 totalAssetsWithInterest = totalAssets();
    return shares * totalAssetsWithInterest / _supply;
}


function maxRedeemAll(address owner) public view returns (uint256) {
    uint256 userShares = balanceOf(owner);
    return userShares; // L'utilisateur devrait pouvoir retirer toutes ses parts
}

function maxWithdraw(address owner) public view override returns (uint256) {
    return convertToAssets(balanceOf(owner));
}


}