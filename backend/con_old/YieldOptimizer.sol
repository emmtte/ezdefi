// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IAaveMock {
    function supply(uint256 assets, address onBehalfOf) external returns (uint256);
    function withdraw(uint256 assets, address receiver, address owner) external returns (uint256);
    function getCurrentRate() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function convertToAssets(uint256 shares) external view returns (uint256);
}

interface ICompoundMock {
    function mint(uint256 assets) external returns (uint256);
    function redeemUnderlying(uint256 assets) external returns (uint256);
    function getSupplyRate() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function convertToAssets(uint256 shares) external view returns (uint256);
}

contract YieldOptimizer is ERC4626, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Les contrats de protocole
    IAaveMock public aave;
    ICompoundMock public compound;
    
    // Protocole actuellement utilisé
    enum Protocol { AAVE, COMPOUND }
    Protocol public currentProtocol;
    
    // Horodatage du dernier rebalancement
    uint256 public lastRebalance;
    
    // Délai de rebalancement (12 heures par défaut)
    uint256 public rebalanceInterval = 12 hours;
    
    // Seuil minimum de différence de taux pour déclencher un rebalancement (10 = 0.1%)
    uint256 public rateThreshold = 10;
    
    // Événements
    event Deposited(address indexed user, uint256 assets);
    event Withdrawn(address indexed user, uint256 assets);
    event Rebalanced(Protocol indexed previousProtocol, Protocol indexed newProtocol, uint256 assets);
    event RebalanceIntervalUpdated(uint256 newInterval);
    event RateThresholdUpdated(uint256 newThreshold);
    
    constructor(
        IERC20Metadata asset_,
        address aaveAddress,
        address compoundAddress
    ) 
        ERC4626(asset_) 
        ERC20("Yield Optimizer Token", "YOT")
        Ownable(msg.sender)
    {
        aave = IAaveMock(aaveAddress);
        compound = ICompoundMock(compoundAddress);
        lastRebalance = block.timestamp;
        
        // Déterminer le protocole initial avec le meilleur taux
        currentProtocol = getBestProtocol();
        
        // Approuver les protocoles à utiliser les tokens
        IERC20(asset_).approve(aaveAddress, type(uint256).max);
        IERC20(asset_).approve(compoundAddress, type(uint256).max);
    }
    
    // Fonction pour obtenir le protocole avec le meilleur taux
    function getBestProtocol() public view returns (Protocol) {
        uint256 aaveRate = aave.getCurrentRate();
        uint256 compoundRate = compound.getSupplyRate();
        
        return aaveRate > compoundRate ? Protocol.AAVE : Protocol.COMPOUND;
    }
    
    // Vérifier si un rebalancement est nécessaire
    function isRebalanceNeeded() public view returns (bool) {
        // Vérifier si l'intervalle de temps est écoulé
        if (block.timestamp < lastRebalance + rebalanceInterval) {
            return false;
        }
        
        // Vérifier la différence de taux
        uint256 aaveRate = aave.getCurrentRate();
        uint256 compoundRate = compound.getSupplyRate();
        
        // Calculer la différence absolue entre les taux
        uint256 rateDifference = aaveRate > compoundRate ? 
            aaveRate - compoundRate : 
            compoundRate - aaveRate;
        
        // Si la différence est supérieure au seuil et le meilleur protocole n'est pas le courant
        Protocol bestProtocol = getBestProtocol();
        return rateDifference > rateThreshold && bestProtocol != currentProtocol;
    }
    
    // Fonction pour effectuer un rebalancement
    function rebalance() external nonReentrant {
        require(isRebalanceNeeded(), "Rebalancement non necessaire");
        
        Protocol bestProtocol = getBestProtocol();
        Protocol previousProtocol = currentProtocol;
        
        // Si aucun changement requis, sortir
        if (bestProtocol == currentProtocol) {
            return;
        }
        
        uint256 assets = 0;
        
        // Retirer les actifs du protocole actuel
        if (currentProtocol == Protocol.AAVE) {
            uint256 aaveShares = aave.balanceOf(address(this));
            if (aaveShares > 0) {
                assets = aave.convertToAssets(aaveShares);
                aave.withdraw(assets, address(this), address(this));
            }
        } else {
            uint256 compoundTokens = compound.balanceOf(address(this));
            if (compoundTokens > 0) {
                assets = compound.convertToAssets(compoundTokens);
                compound.redeemUnderlying(assets);
            }
        }
        
        // Déposer dans le nouveau protocole si des actifs ont été retirés
        if (assets > 0) {
            if (bestProtocol == Protocol.AAVE) {
                aave.supply(assets, address(this));
            } else {
                compound.mint(assets);
            }
        }
        
        // Mettre à jour le protocole courant
        currentProtocol = bestProtocol;
        lastRebalance = block.timestamp;
        
        emit Rebalanced(previousProtocol, bestProtocol, assets);
    }
    
    // Override de deposit pour déposer dans le protocole avec le meilleur taux
    function deposit(uint256 assets, address receiver) public override nonReentrant returns (uint256) {
        uint256 shares = super.deposit(assets, receiver);
        
        // Vérifier si un rebalancement est nécessaire
        if (isRebalanceNeeded()) {
            Protocol previousProtocol = currentProtocol;
            currentProtocol = getBestProtocol();
            lastRebalance = block.timestamp;
            
            if (previousProtocol != currentProtocol) {
                emit Rebalanced(previousProtocol, currentProtocol, 0);
            }
        }
        
        // Déposer les actifs dans le protocole actuel
        if (currentProtocol == Protocol.AAVE) {
            aave.supply(assets, address(this));
        } else {
            compound.mint(assets);
        }
        
        emit Deposited(receiver, assets);
        return shares;
    }
    
    // Override de withdraw pour retirer du protocole actuel
    function withdraw(
        uint256 assets,
        address receiver,
        address owner
    ) public override nonReentrant returns (uint256) {
        uint256 shares = super.withdraw(assets, receiver, owner);
        
        // Retirer du protocole actuel
        if (currentProtocol == Protocol.AAVE) {
            aave.withdraw(assets, address(this), address(this));
        } else {
            compound.redeemUnderlying(assets);
        }
        
        // Transférer les actifs au destinataire
        if (receiver != address(this)) {
            IERC20(asset()).safeTransfer(receiver, assets);
        }
        
        emit Withdrawn(owner, assets);
        return shares;
    }
    
    // Override pour calculer les actifs totaux
    function totalAssets() public view override returns (uint256) {
        if (currentProtocol == Protocol.AAVE) {
            uint256 aaveShares = aave.balanceOf(address(this));
            return aave.convertToAssets(aaveShares);
        } else {
            uint256 compoundTokens = compound.balanceOf(address(this));
            return compound.convertToAssets(compoundTokens);
        }
    }
    
    // Fonction pour mettre à jour l'intervalle de rebalancement
    function setRebalanceInterval(uint256 newInterval) external onlyOwner {
        rebalanceInterval = newInterval;
        emit RebalanceIntervalUpdated(newInterval);
    }
    
    // Fonction pour mettre à jour le seuil de différence de taux
    function setRateThreshold(uint256 newThreshold) external onlyOwner {
        rateThreshold = newThreshold;
        emit RateThresholdUpdated(newThreshold);
    }
    
    // Fonction pour forcer un rebalancement (en cas d'urgence)
    function forceRebalance() external onlyOwner {
        Protocol bestProtocol = getBestProtocol();
        Protocol previousProtocol = currentProtocol;
        
        // Si aucun changement requis, sortir
        if (bestProtocol == currentProtocol) {
            return;
        }
        
        uint256 assets = 0;
        
        // Retirer les actifs du protocole actuel
        if (currentProtocol == Protocol.AAVE) {
            uint256 aaveShares = aave.balanceOf(address(this));
            if (aaveShares > 0) {
                assets = aave.convertToAssets(aaveShares);
                aave.withdraw(assets, address(this), address(this));
            }
        } else {
            uint256 compoundTokens = compound.balanceOf(address(this));
            if (compoundTokens > 0) {
                assets = compound.convertToAssets(compoundTokens);
                compound.redeemUnderlying(assets);
            }
        }
        
        // Déposer dans le nouveau protocole si des actifs ont été retirés
        if (assets > 0) {
            if (bestProtocol == Protocol.AAVE) {
                aave.supply(assets, address(this));
            } else {
                compound.mint(assets);
            }
        }
        
        // Mettre à jour le protocole courant
        currentProtocol = bestProtocol;
        lastRebalance = block.timestamp;
        
        emit Rebalanced(previousProtocol, bestProtocol, assets);
    }
}