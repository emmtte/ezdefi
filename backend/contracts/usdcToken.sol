// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title MintableUSDC - Jeton ERC20 avec capacité de minting contrôlée
/// @notice Contrat de jeton personnalisable permettant un minting sélectif
/// @dev Étend les contrats OpenZeppelin ERC20 et Ownable
contract MintableUSDC is ERC20, Ownable {
    /// @notice Mapping des adresses autorisées à minter des jetons
    /// @dev Stocke les droits de minting pour chaque adresse
    mapping(address => bool) public minters;
    
    /// @notice Constructeur du contrat
    /// @param name Nom du jeton
    /// @param symbol Symbole du jeton
    /// @param initialSupply Approvisionnement initial mintée au déployeur
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }
    
    /// @notice Ajoute une adresse autorisée à minter des jetons
    /// @param minter Adresse à autoriser pour le minting
    /// @dev Peut être appelée uniquement par le propriétaire du contrat
    function addMinter(address minter) external onlyOwner {
        minters[minter] = true;
    }
    
    /// @notice Supprime les droits de minting d'une adresse
    /// @param minter Adresse à désautoriser pour le minting
    /// @dev Peut être appelée uniquement par le propriétaire du contrat
    function removeMinter(address minter) external onlyOwner {
        minters[minter] = false;
    }
    
    /// @notice Permet de minter de nouveaux jetons
    /// @param to Adresse qui recevra les nouveaux jetons
    /// @param amount Nombre de jetons à minter
    /// @dev Seuls les minters autorisés et le propriétaire peuvent minter
    function mint(address to, uint256 amount) external {
        require(minters[msg.sender] || msg.sender == owner(), "Not authorized to mint");
        _mint(to, amount);
    }

    /// @notice Fonction de faucet pour obtenir des jetons de test
    /// @dev Mint un montant fixe de jetons à l'appelant
    /// @dev Utile pour les environnements de test et de développement
    function faucet() external {
        _mint(msg.sender, 10000 * 10**18);
    }
}