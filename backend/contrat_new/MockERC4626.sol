// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

contract SimpleMockERC4626 {
    address public owner;
    IERC20 public asset; // Le token USDC
    
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    
    // Taux de rendement en base 10000 (ex. 500 = 5%)
    uint256 public yieldRate;
    
    event Deposit(address indexed caller, address indexed owner, uint256 assets, uint256 shares);
    event Withdraw(address indexed caller, address indexed receiver, address indexed owner, uint256 assets, uint256 shares);
    
    constructor(address _asset, string memory _name, string memory _symbol, uint256 _initialYieldRate) {
        owner = msg.sender;
        asset = IERC20(_asset);
        name = _name;
        symbol = _symbol;
        yieldRate = _initialYieldRate;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    // Définir un nouveau taux de rendement
    function setYieldRate(uint256 _newYieldRate) external onlyOwner {
        yieldRate = _newYieldRate;
    }
    
    // Convertir des actifs en parts (simulation simplifiée)
    function convertToShares(uint256 _assets) public view returns (uint256) {
        if (totalSupply == 0) {
            return _assets;
        }
        
        // Simuler un taux de conversion basé sur le rendement
        // Dans un vrai contrat, ce calcul serait plus complexe
        uint256 totalAssetAmount = asset.balanceOf(address(this));
        return _assets * totalSupply / totalAssetAmount;
    }
    
    // Convertir des parts en actifs (simulation simplifiée)
    function convertToAssets(uint256 _shares) public view returns (uint256) {
        if (totalSupply == 0) {
            return _shares;
        }
        
        // Le taux de conversion est majoré par le rendement simulé
        uint256 totalAssetAmount = asset.balanceOf(address(this));
        
        // Simuler un rendement accumulé (très simplifié)
        uint256 yield = totalAssetAmount * yieldRate / 10000;
        uint256 adjustedAssets = totalAssetAmount + yield;
        
        return _shares * adjustedAssets / totalSupply;
    }
    
    // Déposer des actifs et recevoir des parts
    function deposit(uint256 _assets, address _receiver) public returns (uint256) {
        require(_assets > 0, "Cannot deposit 0");
        
        uint256 shares = convertToShares(_assets);
        
        // Transférer les actifs vers ce contrat
        asset.transferFrom(msg.sender, address(this), _assets);
        
        // Mint des parts pour le receiver
        _mint(_receiver, shares);
        
        emit Deposit(msg.sender, _receiver, _assets, shares);
        
        return shares;
    }
    
    // Retirer des actifs en brûlant des parts
    function withdraw(uint256 _assets, address _receiver, address _owner) public returns (uint256) {
        require(_assets > 0, "Cannot withdraw 0");
        
        uint256 shares = convertToShares(_assets);
        
        // Vérifier le solde (simplification, ne gère pas les allowances)
        require(balanceOf[_owner] >= shares, "Insufficient balance");
        
        // Brûler les parts
        _burn(_owner, shares);
        
        // Transférer les actifs
        asset.transfer(_receiver, _assets);
        
        emit Withdraw(msg.sender, _receiver, _owner, _assets, shares);
        
        return shares;
    }
    
    // Obtenir l'adresse de l'actif
    function getAsset() public view returns (address) {
        return address(asset);
    }
    
    // Fonctions internes pour gérer les parts
    function _mint(address _to, uint256 _amount) internal {
        balanceOf[_to] += _amount;
        totalSupply += _amount;
    }
    
    function _burn(address _from, uint256 _amount) internal {
        balanceOf[_from] -= _amount;
        totalSupply -= _amount;
    }
}