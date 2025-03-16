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
    function maxWithdraw(address owner) external view returns (uint256);
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
    
    // Constante pour l'arrondi (99.5%)
    uint256 public constant ROUNDING_FACTOR = 995;
    
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
    
    // Fonction utilitaire pour arrondir en sécurité
    function _safeAmount(uint256 amount) internal pure returns (uint256) {
        // Arrondir à 99.5% pour éviter les erreurs d'insuffisance de solde
        return amount * ROUNDING_FACTOR / 1000;
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
        
        uint256 transferredAssets = 0;
        
        // Retirer les actifs du protocole actuel
        if (currentProtocol == Protocol.AAVE) {
            uint256 aaveShares = aave.balanceOf(address(this));
            if (aaveShares > 0) {
                // Obtenir le montant maximum que nous pouvons retirer
                uint256 maxWithdraw = aave.maxWithdraw(address(this));
                
                // Appliquer l'arrondi de sécurité
                uint256 safeWithdraw = _safeAmount(maxWithdraw);
                
                if (safeWithdraw > 0) {
                    aave.withdraw(safeWithdraw, address(this), address(this));
                    transferredAssets = safeWithdraw;
                }
            }
        } else {
            uint256 compoundTokens = compound.balanceOf(address(this));
            if (compoundTokens > 0) {
                // Calculer les actifs avec arrondi de sécurité
                uint256 assets = _safeAmount(compound.convertToAssets(compoundTokens));
                
                if (assets > 0) {
                    compound.redeemUnderlying(assets);
                    transferredAssets = assets;
                }
            }
        }
        
        // Vérifier le solde réel après les opérations
        uint256 actualBalance = IERC20(asset()).balanceOf(address(this));
        
        // Déposer dans le nouveau protocole
        if (actualBalance > 0) {
            if (bestProtocol == Protocol.AAVE) {
                aave.supply(actualBalance, address(this));
            } else {
                compound.mint(actualBalance);
            }
            transferredAssets = actualBalance; // Mettre à jour avec le montant réel transféré
        }
        
        // Mettre à jour le protocole courant
        currentProtocol = bestProtocol;
        lastRebalance = block.timestamp;
        
        emit Rebalanced(previousProtocol, bestProtocol, transferredAssets);
    }
    
    // Override de deposit pour déposer dans le protocole avec le meilleur taux
    function deposit(uint256 assets, address receiver) public override nonReentrant returns (uint256) {
        // Vérifier si un rebalancement est nécessaire avant de déposer
        if (isRebalanceNeeded()) {
            Protocol previousProtocol = currentProtocol;
            currentProtocol = getBestProtocol();
            lastRebalance = block.timestamp;
            
            if (previousProtocol != currentProtocol) {
                emit Rebalanced(previousProtocol, currentProtocol, 0);
            }
        }
        
        // Transférer les tokens au contrat
        uint256 beforeBalance = IERC20(asset()).balanceOf(address(this));
        uint256 shares = super.deposit(assets, receiver);
        uint256 actualDeposit = IERC20(asset()).balanceOf(address(this)) - beforeBalance;
        
        // Déposer les actifs dans le protocole actuel
        if (actualDeposit > 0) {
            if (currentProtocol == Protocol.AAVE) {
                aave.supply(actualDeposit, address(this));
            } else {
                compound.mint(actualDeposit);
            }
        }
        
        emit Deposited(receiver, actualDeposit);
        return shares;
    }
    
    // Override de withdraw pour retirer du protocole actuel
    function withdraw(
        uint256 assets,
        address receiver,
        address owner
    ) public override nonReentrant returns (uint256) {
        // Calculer le montant à retirer avec l'arrondi de sécurité
        uint256 safeAssets = _safeAmount(assets);
        
        // Retirer les actifs du protocole actuel avant le traitement ERC4626
        uint256 beforeBalance = IERC20(asset()).balanceOf(address(this));
        
        if (currentProtocol == Protocol.AAVE) {
            if (safeAssets > 0) {
                try aave.withdraw(safeAssets, address(this), address(this)) {}
                catch {
                    // Si l'erreur persiste malgré l'arrondi, essayer avec un montant encore plus bas
                    uint256 reducedAssets = safeAssets * 9 / 10; // 90% du montant arrondi
                    if (reducedAssets > 0) {
                        aave.withdraw(reducedAssets, address(this), address(this));
                    }
                }
            }
        } else {
            if (safeAssets > 0) {
                try compound.redeemUnderlying(safeAssets) {}
                catch {
                    // Si l'erreur persiste malgré l'arrondi, essayer avec un montant encore plus bas
                    uint256 reducedAssets = safeAssets * 9 / 10; // 90% du montant arrondi
                    if (reducedAssets > 0) {
                        compound.redeemUnderlying(reducedAssets);
                    }
                }
            }
        }
        
        // Vérifier combien nous avons réellement retiré
        uint256 actualWithdrawn = IERC20(asset()).balanceOf(address(this)) - beforeBalance;
        
        // Si nous n'avons pas assez retiré, utiliser ce que nous avons
        uint256 finalAssets = actualWithdrawn < assets ? actualWithdrawn : assets;
        
        // Maintenant faire le traitement ERC4626 standard avec le montant réel que nous avons
        uint256 shares = super.withdraw(finalAssets, receiver, owner);
        
        emit Withdrawn(owner, finalAssets);
        return shares;
    }
    
    // Récupérer automatiquement le maximum que l'on peut retirer d'un protocole
    function maxWithdrawFromProtocol() public view returns (uint256) {
        if (currentProtocol == Protocol.AAVE) {
            return aave.maxWithdraw(address(this));
        } else {
            uint256 compoundTokens = compound.balanceOf(address(this));
            return compound.convertToAssets(compoundTokens);
        }
    }
    
    // Override pour calculer les actifs totaux
    function totalAssets() public view override returns (uint256) {
        // Ajouter le solde du contrat lui-même
        uint256 selfBalance = IERC20(asset()).balanceOf(address(this));
        
        // Ajouter les actifs dans le protocole actif
        if (currentProtocol == Protocol.AAVE) {
            uint256 aaveShares = aave.balanceOf(address(this));
            if (aaveShares > 0) {
                selfBalance += aave.convertToAssets(aaveShares);
            }
        } else {
            uint256 compoundTokens = compound.balanceOf(address(this));
            if (compoundTokens > 0) {
                selfBalance += compound.convertToAssets(compoundTokens);
            }
        }
        
        return selfBalance;
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
}