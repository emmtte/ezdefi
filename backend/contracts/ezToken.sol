// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Interface pour les coffres-forts avec taux d'intérêt
/// @dev Extension de l'interface IERC4626 standard
interface Vault is IERC4626 {
    /// @notice Récupère le taux d'intérêt actuel du coffre-fort
    /// @return Le taux d'intérêt en points de base
    function getInterestRate() external view returns (uint256);
    function accrueInterest() external;
}

/// @title YieldOptimizer - Optimiseur de rendement dynamique
/// @notice Contrat permettant de déposer des actifs dans le coffre-fort offrant le meilleur rendement
/// @dev Implémente un ERC20 avec capacité de réallocation dynamique entre différents coffres-forts
contract YieldOptimizer is ERC20, Ownable {
    /// @notice Jeton d'actif sous-jacent
    /// @dev Jeton immuable qui sera déposé dans les différents coffres-forts
    IERC20 public immutable asset;

    /// @notice Liste des coffres-forts autorisés
    /// @dev Tableaux des adresses de coffres-forts pouvant être utilisés
    address[] public allowedVaults;

    /// @notice Adresse du coffre-fort actuellement sélectionné
    /// @dev Coffre-fort recevant les dépôts et générant des rendements
    address public currentVault;

    /// @notice Horodatage du dernier rééquilibrage
    /// @dev Utilisé pour appliquer un délai entre les rééquilibrages
    uint256 public lastRebalance;
    
    /// @notice Événement émis lors d'un dépôt
    /// @param user Adresse de l'utilisateur effectuant le dépôt
    /// @param amount Montant déposé
    /// @param shares Nombre de parts émises
    event Deposited(address indexed user, uint256 amount, uint256 shares);

    /// @notice Événement émis lors d'un retrait
    /// @param user Adresse de l'utilisateur effectuant le retrait
    /// @param amount Montant retiré
    /// @param shares Nombre de parts brûlées
    event Withdrawn(address indexed user, uint256 amount, uint256 shares);

    /// @notice Événement émis lors d'un rééquilibrage vers un nouveau coffre-fort
    /// @param newVault Adresse du nouveau coffre-fort
    /// @param amount Montant transféré
    event Rebalanced(address indexed newVault, uint256 amount);

    /// @notice Événement émis lors de l'ajout d'un nouveau coffre-fort
    /// @param vault Adresse du coffre-fort ajouté
    event VaultAdded(address indexed vault);

    /// @notice Événement émis lors de la suppression d'un coffre-fort
    /// @param vault Adresse du coffre-fort supprimé
    event VaultRemoved(address indexed vault);

    /// @notice Constructeur du contrat
    /// @param _asset Adresse du jeton d'actif
    /// @param _vaults Liste initiale des coffres-forts autorisés
    constructor(IERC20 _asset, address[] memory _vaults) 
        ERC20("Yield Optimizer", "YO") 
        Ownable(msg.sender) 
    {
        asset = _asset;
        for (uint i = 0; i < _vaults.length; i++) {
            _addVault(_vaults[i]);
        }
    }

    /// @notice Permet de déposer des actifs et de recevoir des parts
    /// @param amount Montant à déposer
    /// @return shares Nombre de parts émises
    /// @dev Sélectionne automatiquement le coffre-fort avec le meilleur rendement
    function deposit(uint256 amount) external returns (uint256 shares) {
        require(amount > 0, "Amount must be greater than 0");
        require(asset.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        if (currentVault == address(0)) {
            currentVault = findBestVault();
        }
        _depositTo(currentVault); 
        uint256 totalAssetsAfter = totalAssets();
        if (totalSupply() == 0) {
        shares = amount;
        } else {
        shares = amount * totalSupply() / (totalAssetsAfter - amount);
        }
        _mint(msg.sender, shares);
        emit Deposited(msg.sender, amount, shares);
        return shares;
    }
    
    /// @notice Permet de retirer des actifs en échangeant des parts
    /// @param shares Nombre de parts à brûler
    /// @return amount Montant d'actifs récupérés
    /// @dev Calcule le montant proportionnel aux parts détenues
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

    /// @notice Calcule le total des actifs détenus
    /// @return Montant total des actifs, incluant le solde du contrat et les actifs dans le coffre-fort
    function totalAssets() public view returns (uint256) {
        uint256 total = asset.balanceOf(address(this));
        if (currentVault != address(0)) {
            Vault vault = Vault(currentVault);
            uint256 shares = vault.balanceOf(address(this));
            if (shares > 0) {
                total += vault.previewRedeem(shares);
            }
        }
        return total;
    }

    /// @notice Permet d'ajouter un nouveau coffre-fort autorisé
    /// @param vault Adresse du coffre-fort à ajouter
    /// @dev Réservé au propriétaire du contrat
    function addVault(address vault) external onlyOwner {
        _addVault(vault);
    }

    /// @notice Permet de supprimer un coffre-fort de la liste autorisée
    /// @param vault Adresse du coffre-fort à supprimer
    /// @dev Réservé au propriétaire du contrat
    function removeVault(address vault) external onlyOwner {
        allowedVaults = _removeFromArray(allowedVaults, vault);
        emit VaultRemoved(vault);
    }

    /// @notice Rééquilibre les actifs vers le coffre-fort offrant le meilleur rendement
    /// @dev Peut être appelé uniquement par le propriétaire, avec un délai minimal de 12 heures
    function rebalance() external  {  //onlyOwner
        //require(block.timestamp >= lastRebalance + 12 hours, "Rebalance cooldown");
        address bestVault = findBestVault();
        if (bestVault != currentVault) {
            _withdrawFromCurrent();
            _depositTo(bestVault);
            currentVault = bestVault;
            emit Rebalanced(bestVault, asset.balanceOf(address(this)));
        }
        lastRebalance = block.timestamp;
    }

    /// @notice Trouve le coffre-fort avec le taux d'intérêt le plus élevé
    /// @return best Adresse du coffre-fort offrant le meilleur rendement
    /// @dev Parcourt la liste des coffres-forts autorisés
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

    /// @notice Retire tous les actifs du coffre-fort actuel
    /// @dev Fonction interne utilisée lors du rééquilibrage
    function _withdrawFromCurrent() internal {
        if (currentVault != address(0)) {
            Vault vault = Vault(currentVault);
            uint256 shares = vault.balanceOf(address(this));
            if (shares > 0) {
                vault.accrueInterest();
                vault.redeem(shares, address(this), address(this));
            }
        }
    }
    
    /// @notice Retire une partie des actifs du coffre-fort actuel
    /// @param amount Montant à retirer
    /// @dev Fonction interne utilisée lors des retraits partiels
    function _withdrawSomeFromCurrent(uint256 amount) internal {
        if (currentVault != address(0)) {
            Vault vault = Vault(currentVault);
            vault.accrueInterest();
            vault.withdraw(amount, address(this), address(this));
        }
    }

    /// @notice Dépose les actifs dans un coffre-fort spécifique
    /// @param vault Adresse du coffre-fort de destination
    /// @dev Fonction interne utilisée lors des dépôts et rééquilibrages
    function _depositTo(address vault) internal {
        uint256 amount = asset.balanceOf(address(this));
        if (amount > 0) {
            Vault(vault).deposit(amount, address(this));
        }
    }

    /// @notice Ajoute un coffre-fort à la liste des coffres-forts autorisés
    /// @param vault Adresse du coffre-fort à ajouter
    /// @dev Fonction interne avec approbation automatique
    function _addVault(address vault) internal {
        allowedVaults.push(vault);
        require(asset.approve(vault, type(uint256).max), "Approve failed");
        emit VaultAdded(vault);
    }

    /// @notice Supprime un élément d'un tableau d'adresses
    /// @param arr Tableau original
    /// @param element Élément à supprimer
    /// @return newArr Nouveau tableau sans l'élément spécifié
    /// @dev Fonction utilitaire de manipulation de tableau
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