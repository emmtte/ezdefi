// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IMintableERC20 {
    function mint(address to, uint256 amount) external;
}

contract aToken is ERC4626, Ownable {
    // Taux d'intérêt annuel en pourcentage (10% par défaut, avec 2 décimales - 1000 = 10.00%)
    uint256 public interestRate = 1500;
    
    // Horodatage du dernier calcul d'intérêts
    uint256 public lastInterestUpdate;
    
    constructor(
        IERC20 asset,
        string memory name,
        string memory symbol
    ) ERC4626(asset) ERC20(name, symbol) Ownable(msg.sender) {
        lastInterestUpdate = block.timestamp;
    }
    
    // Permet au propriétaire de modifier le taux d'intérêt
    function setInterestRate(uint256 newRate) external onlyOwner {
        interestRate = newRate;
    }
    
    // Fonction pour récupérer le taux d'intérêt actuel
    function getInterestRate() public view returns (uint256) {
        return interestRate;
    }

    // Calcule et ajoute les intérêts depuis la dernière mise à jour
    function accrueInterest() external {
        uint256 timeElapsed = block.timestamp - lastInterestUpdate;
        if (timeElapsed > 0) {
            uint256 totalAssets = IERC20(asset()).balanceOf(address(this));
            if (totalAssets > 0) {
                // Calcul des intérêts : montant * taux * temps / (100 * 365 jours en secondes)
                // Note: division par 10000 car le taux est stocké avec 2 décimales (1000 = 10.00%)
                uint256 interestAmount = (totalAssets * interestRate * timeElapsed) / (10000 * 365 days);
                
                if (interestAmount > 0) {
                    // Mint de nouveaux tokens pour simuler les intérêts
                    IMintableERC20(address(asset())).mint(address(this), interestAmount);
                }
            }
            lastInterestUpdate = block.timestamp;
        }
    }
}