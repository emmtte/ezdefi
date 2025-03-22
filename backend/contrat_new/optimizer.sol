// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
}

interface IERC4626 {
    function asset() external view returns (address);
    function deposit(uint256 assets, address receiver) external returns (uint256);
    function withdraw(uint256 assets, address receiver, address owner) external returns (uint256);
    function convertToAssets(uint256 shares) external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
}

contract SimpleYieldOptimizer {
    address public owner;
    IERC20 public usdcToken;
    address[] public vaults;
    
    event VaultAdded(address vault);
    event VaultRemoved(address vault);
    event Deposited(address user, uint256 amount, address bestVault);
    event Withdrawn(address user, uint256 amount);
    
    constructor(address _usdcToken) {
        owner = msg.sender;
        usdcToken = IERC20(_usdcToken);
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    // Ajouter une vault à la liste
    function addVault(address _vault) external onlyOwner {
        vaults.push(_vault);
        emit VaultAdded(_vault);
    }
    
    // Supprimer une vault de la liste
    function removeVault(address _vault) external onlyOwner {
        for (uint i = 0; i < vaults.length; i++) {
            if (vaults[i] == _vault) {
                // Déplacer le dernier élément à la place de celui à supprimer
                vaults[i] = vaults[vaults.length - 1];
                // Supprimer le dernier élément
                vaults.pop();
                emit VaultRemoved(_vault);
                break;
            }
        }
    }
    
    // Trouver la vault avec le meilleur rendement
    function findBestVault() public view returns (address) {
        if (vaults.length == 0) return address(0);
        
        address bestVault = vaults[0];
        uint256 bestRate = IERC4626(vaults[0]).convertToAssets(1e18);
        
        for (uint i = 1; i < vaults.length; i++) {
            uint256 currentRate = IERC4626(vaults[i]).convertToAssets(1e18);
            if (currentRate > bestRate) {
                bestVault = vaults[i];
                bestRate = currentRate;
            }
        }
        
        return bestVault;
    }
    
    // Déposer des USDC dans la meilleure vault
    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        require(vaults.length > 0, "No vaults available");
        
        // Trouver la meilleure vault
        address bestVault = findBestVault();
        
        // Transférer les USDC de l'utilisateur vers ce contrat
        usdcToken.transferFrom(msg.sender, address(this), amount);
        
        // Approuver la vault à utiliser les USDC
        usdcToken.approve(bestVault, amount);
        
        // Déposer dans la vault
        IERC4626(bestVault).deposit(amount, address(this));
        
        emit Deposited(msg.sender, amount, bestVault);
    }
    
    // Retirer des USDC depuis les vaults
    function withdraw(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        
        uint256 remaining = amount;
        
        // Parcourir chaque vault pour retirer les fonds
        for (uint i = 0; i < vaults.length && remaining > 0; i++) {
            IERC4626 vault = IERC4626(vaults[i]);
            
            // Vérifier combien nous pouvons retirer de cette vault
            uint256 sharesBalance = vault.balanceOf(address(this));
            if (sharesBalance > 0) {
                uint256 availableAssets = vault.convertToAssets(sharesBalance);
                uint256 toWithdraw = remaining < availableAssets ? remaining : availableAssets;
                
                if (toWithdraw > 0) {
                    // Retirer de la vault
                    vault.withdraw(toWithdraw, address(this), address(this));
                    remaining -= toWithdraw;
                }
            }
        }
        
        require(remaining == 0, "Insufficient balance");
        
        // Transférer les USDC à l'utilisateur
        usdcToken.transfer(msg.sender, amount);
        
        emit Withdrawn(msg.sender, amount);
    }
    
    // Obtenir la liste des vaults
    function getVaults() external view returns (address[] memory) {
        return vaults;
    }
    
    // Obtenir la valeur totale des actifs
    function getTotalBalance() external view returns (uint256) {
        uint256 total = 0;
        
        for (uint i = 0; i < vaults.length; i++) {
            IERC4626 vault = IERC4626(vaults[i]);
            uint256 shares = vault.balanceOf(address(this));
            if (shares > 0) {
                total += vault.convertToAssets(shares);
            }
        }
        
        // Ajouter les USDC non investis
        total += usdcToken.balanceOf(address(this));
        
        return total;
    }
}