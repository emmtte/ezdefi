// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @dev Interface pour la création de nouveaux tokens
interface IMintableERC20 {
    /// @notice Créer de nouveaux tokens pour une adresse spécifiée
    /// @param to L'adresse de réception des tokens créés
    /// @param amount Le montant de tokens à créer
    function mint(address to, uint256 amount) external;
}

/// @title aToken - Un token de coffre-fort (vault) ERC4626 générant des intérêts
/// @notice Implémente un coffre-fort ERC4626 avec un taux d'intérêt personnalisable et accumulation automatique des intérêts
/// @dev Étend ERC4626 et Ownable pour fournir une fonctionnalité de génération d'intérêts
contract aToken is ERC4626, Ownable {
    /// @notice Taux d'intérêt annuel actuel (en points de base)
    /// @dev Par défaut à 15% (1500 points de base)
    uint256 public interestRate = 1500;

    /// @notice Horodatage de la dernière mise à jour des intérêts
    uint256 public lastInterestUpdate;
    
    /// @notice Constructeur pour initialiser l'aToken
    /// @param asset Le token ERC20 sous-jacent utilisé dans le coffre-fort
    /// @param name Le nom de l'aToken
    /// @param symbol Le symbole de l'aToken
    constructor(
        IERC20 asset,
        string memory name,
        string memory symbol
    ) ERC4626(asset) ERC20(name, symbol) Ownable(msg.sender) {
        lastInterestUpdate = block.timestamp;
    }
    
    /// @notice Permet de définir un nouveau taux d'intérêt
    /// @param newRate Le nouveau taux d'intérêt en points de base
    function setInterestRate(uint256 newRate) external {
        interestRate = newRate;
    }
    
    /// @notice Récupère le taux d'intérêt actuel
    /// @return - Le taux d'intérêt actuel en points de base
    function getInterestRate() public view returns (uint256) {
        return interestRate;
    }

    /// @notice Accumule les intérêts en créant de nouveaux tokens basés sur le taux d'intérêt actuel
    /// @dev Calcule les intérêts en fonction du temps écoulé, des actifs totaux et du taux d'intérêt
    /// @dev Crée uniquement des intérêts s'il y a des actifs dans le contrat et si du temps s'est écoulé
    function accrueInterest() external {
        uint256 timeElapsed = block.timestamp - lastInterestUpdate;
        if (timeElapsed > 0) {
            uint256 totalAssets = IERC20(asset()).balanceOf(address(this));
            if (totalAssets > 0) {
                // Calcul des intérêts : (actifs totaux * taux d'intérêt * temps écoulé) / (points de base * secondes dans une année)
                uint256 interestAmount = (totalAssets * interestRate * timeElapsed) / (10000 * 365 days);
                if (interestAmount > 0) {
                    // Création de nouveaux tokens pour représenter les intérêts accumulés
                    IMintableERC20(address(asset())).mint(address(this), interestAmount);
                }
            }
            lastInterestUpdate = block.timestamp;
        }
    }
}