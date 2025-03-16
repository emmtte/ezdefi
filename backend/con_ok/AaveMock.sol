// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Interface pour le token sous-jacent avec fonction de génération d'intérêts
interface TestToken {
    function mintForInterest(address to, uint256 amount) external;
}

contract AaveMock is ERC4626 {
    // Taux d'intérêt simulé (en base points: 1000 = 10%)
    uint256 private _currentRate = 500; // 5% par défaut
    uint256 private _lastUpdate; // Dernier moment où les intérêts ont été mis à jour
    uint256 private _virtualTotalAssets; // Total des actifs incluant les intérêts virtuels
    
    // Référence au token sous-jacent
    ERC20 private _underlyingToken;
    
    // Événements pour le suivi des actions
    event Deposited(address indexed user, uint256 assets, uint256 shares);
    event Withdrawn(address indexed user, uint256 assets, uint256 shares);
    event RateUpdated(uint256 oldRate, uint256 newRate);
    event InterestAccrued(uint256 amount);
    
    constructor(IERC20Metadata asset_) 
        ERC4626(asset_) 
        ERC20("Aave Interest Bearing Token", "aToken") {
        _lastUpdate = block.timestamp;
        _virtualTotalAssets = 0;
        _underlyingToken = ERC20(address(asset_));
    }
    
    // Mise à jour des intérêts virtuels
    function _updateInterest() internal {
        // Si c'est le premier dépôt, on initialise seulement
        if (_virtualTotalAssets == 0) {
            _virtualTotalAssets = super.totalAssets();
            _lastUpdate = block.timestamp;
            return;
        }
        
        // Calculer les intérêts depuis la dernière mise à jour
        uint256 timeElapsed = block.timestamp - _lastUpdate;
        if (timeElapsed > 0) {
            // Simuler un taux annuel en le divisant par secondes dans une année
            uint256 interestAccrued = (_virtualTotalAssets * _currentRate * timeElapsed) / (10000 * 365 * 24 * 3600);
            
            // Mint des tokens supplémentaires pour représenter les intérêts
            if (interestAccrued > 0) {
                try TestToken(address(_underlyingToken)).mintForInterest(address(this), interestAccrued) {
                    // Succès : les intérêts sont maintenant disponibles sous forme de tokens réels
                } catch {
                    // Fallback si la fonction mintForInterest n'est pas disponible
                    // Dans ce cas, les intérêts seront virtuels uniquement
                }
            }
            
            _virtualTotalAssets += interestAccrued;
            _lastUpdate = block.timestamp;
            
            emit InterestAccrued(interestAccrued);
        }
    }
    
    // Fonction pour simuler le dépôt Aave
    function supply(uint256 assets, address onBehalfOf) external returns (uint256) {
        _updateInterest();
        
        // Dépôt standard via ERC4626
        uint256 shares = deposit(assets, onBehalfOf);
        
        // Mettre à jour le total virtuel
        _virtualTotalAssets = super.totalAssets();
        
        emit Deposited(onBehalfOf, assets, shares);
        return shares;
    }
    
    // Fonction pour simuler le retrait Aave (retrait d'un montant spécifique d'actifs)
    function withdraw(uint256 assets, address receiver) external returns (uint256) {
        _updateInterest();
        
        // Retrait standard via ERC4626
        uint256 shares = super.withdraw(assets, receiver, msg.sender);
        
        // Mettre à jour le total virtuel
        _virtualTotalAssets = super.totalAssets();
        
        emit Withdrawn(msg.sender, assets, shares);
        return shares;
    }
    
    // Fonction pour simuler le redeem Aave (brûlage d'un nombre spécifique de parts)
    function redeem(uint256 shares, address receiver) external returns (uint256) {
        _updateInterest();
        
        // Redeem standard via ERC4626
        uint256 assets = super.redeem(shares, receiver, msg.sender);
        
        // Mettre à jour le total virtuel
        _virtualTotalAssets = super.totalAssets();
        
        emit Withdrawn(msg.sender, assets, shares);
        return assets;
    }
    
    // Obtenir le taux d'intérêt actuel (format Aave)
    function getReserveNormalizedIncome() external view returns (uint256) {
        return 1e27 + (_currentRate * 1e27 / 10000);
    }
    
    // Fonction simplifiée pour obtenir le taux actuel en pourcentage
    function getCurrentRate() external view returns (uint256) {
        return _currentRate;
    }
    
    // Fonction admin pour mettre à jour le taux
    function setRate(uint256 newRate) external {
        _updateInterest(); // Mettre à jour les intérêts avant de changer le taux
        uint256 oldRate = _currentRate;
        _currentRate = newRate;
        emit RateUpdated(oldRate, newRate);
    }
    
    // Override pour totalAssets pour inclure les intérêts virtuels
    function totalAssets() public view override returns (uint256) {
        return super.totalAssets();
    }
    
    // Fonction pour simuler l'accroissement des actifs sans changer le comportement de ERC4626
    function totalAssetsWithInterest() public view returns (uint256) {
        if (_virtualTotalAssets == 0) {
            return super.totalAssets();
        }
        
        // Calculer les intérêts virtuels depuis la dernière mise à jour
        uint256 timeElapsed = block.timestamp - _lastUpdate;
        if (timeElapsed > 0) {
            uint256 interestAccrued = (_virtualTotalAssets * _currentRate * timeElapsed) / (10000 * 365 * 24 * 3600);
            return _virtualTotalAssets + interestAccrued;
        }
        
        return _virtualTotalAssets;
    }
}