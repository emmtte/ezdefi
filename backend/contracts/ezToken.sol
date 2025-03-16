// SPDX-License-Identifier: MIT OR GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

interface IAave {
    function deposit(uint256 assets, address receiver) external returns (uint256);
    function withdraw(uint256 assets, address receiver, address owner) external returns (uint256);
    function redeem(uint256 shares, address receiver, address owner) external returns (uint256);
    function getInterestRate() external view returns (uint256);
}

interface ICompound {
    function deposit(uint256 assets, address receiver) external returns (uint256);
    function withdraw(uint256 assets, address receiver, address owner) external returns (uint256);
    function redeem(uint256 shares, address receiver, address owner) external returns (uint256);
    function getInterestRate() external view returns (uint256);
}

contract EZdefi is ERC4626, Ownable {
    IERC20 public immutable usdc;
    IAave public aToken;
    ICompound public cToken;
    address public currentProtocol;
    uint256 public lastRebalance;

    event Rebalanced(address newProtocol);

    constructor(
        IERC20 _usdc,
        IAave _aToken,
        ICompound _cToken
    ) ERC4626(_usdc) ERC20("EZDZFI Token", "EZDZFI") Ownable(msg.sender) {
        usdc = _usdc;
        aToken = _aToken;
        cToken = _cToken;
        lastRebalance = block.timestamp;
        // Initialiser le protocole courant avec le meilleur protocole au démarrage
        address bestProtocol = getBestProtocol();
        currentProtocol = bestProtocol;
    }

    function allocateFunds(address protocol, uint256 amount) public {
        require(protocol != address(0), "Invalid protocol address");
        usdc.approve(protocol, amount);
        if (protocol == address(aToken)) {
            aToken.deposit(amount, address(this));
        } else if (protocol == address(cToken)) {
            cToken.deposit(amount, address(this));
        }
        currentProtocol = protocol;
   }

    function getBestProtocol() public view returns (address) {
        uint256 aaveRate = aToken.getInterestRate();
        uint256 compoundRate = cToken.getInterestRate();
        return (aaveRate >= compoundRate) ? address(aToken) : address(cToken);
    }

    function retrieveFunds(uint256 amount) internal {
        if (currentProtocol == address(aToken)) {
            aToken.withdraw(amount, address(usdc), address(this));
        } else if (currentProtocol == address(cToken)) {
            cToken.withdraw(amount, address(usdc), address(this));
        }
    }

    function rebalance() external {
        require(block.timestamp >= lastRebalance + 12 hours, "Rebalance too soon");
        address newProtocol = getBestProtocol();
        if (newProtocol != currentProtocol) {
            uint256 balance = usdc.balanceOf(address(this));
            retrieveFunds(balance);
            allocateFunds(newProtocol, balance);
            currentProtocol = newProtocol;
            emit Rebalanced(newProtocol);
        }
        lastRebalance = block.timestamp;
    }

    // Override les fonctions de ERC4626 pour gérer les dépôts et retraits
    function deposit(uint256 assets, address receiver) public override returns (uint256) {
        usdc.transferFrom(msg.sender, address(this), assets); // Transfère d'abord les tokens de l'utilisateur au contrat
        require(currentProtocol != address(0), "Protocol not initialized"); // Vérification du protocole et allocation des fonds
        allocateFunds(currentProtocol, assets);
        uint256 shares = convertToShares(assets); // Calcul et émission des shares
        _mint(receiver, shares); // Emission des shares au destinataire
        return shares;
    }


    function withdraw(uint256 assets, address receiver, address owner) public override returns (uint256) {
        require(msg.sender == owner, "Caller must be the owner"); // Vérification que le caller est le propriétaire
        uint256 shares = convertToShares(assets); // Calcul des shares équivalentes
        _burn(owner, shares); // Brûler les shares du propriétaire
        retrieveFunds(assets); // Récupérer les fonds du protocole actuel
        usdc.transfer(receiver, assets); // Transférer les assets au destinataire
        return shares;
    }

    function redeem(uint256 shares, address receiver, address owner) public override returns (uint256) {
        require(msg.sender == owner, "Caller must be the owner"); // Vérification que le caller est le propriétaire
        uint256 assets = convertToAssets(shares); // Calcul des assets équivalents
        _burn(owner, shares); // Brûler les shares du propriétaire
        retrieveFunds(assets); // Récupérer les fonds du protocole actuel
        usdc.transfer(receiver, assets); // Transférer les assets au destinataire
        return assets;
    }

    // Fonction pour obtenir la valeur totale des actifs sous-jacents
    function totalAssets() public view override returns (uint256) {
        return usdc.balanceOf(address(this)); // La valeur totale des actifs est simplement le solde d'USDC du contrat
    }

    // Fonction pour convertir les shares en actifs (utilise la valeur totale des actifs)
    function convertToAssets(uint256 shares) public view override returns (uint256) {
        uint256 totalShares = totalSupply();
        if (totalShares == 0) {
            return shares; // Evite la division par zéro lors du premier dépôt
        }
        return (shares * totalAssets()) / totalShares;
    }

    // Fonction pour convertir les actifs en shares (utilise la valeur totale des actifs)
    function convertToShares(uint256 assets) public view override returns (uint256) {
        uint256 totalAssetsAmount = totalAssets();
        if (totalAssetsAmount == 0) {
            return assets; // Evite la division par zéro lors du premier dépôt
        }
        return (assets * totalSupply()) / totalAssetsAmount;
    }
}