require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
//import { HardhatUserConfig } from "hardhat/config";

const dotenv = require("dotenv");
dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const RPC_URL_SEPOLIA = process.env.RPC_URL_SEPOLIA || "";
const RPC_URL_MAINNET = process.env.RPC_URL_MAINNET || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      forking: {
        url: RPC_URL_MAINNET, // Remplacez par votre clé API Alchemy ou Infura
        //blockNumber: 19000000 // Optionnel: vous pouvez spécifier un numéro de bloc spécifique à fork
      },
      // Ces paramètres permettent d'activer l'impersonnification de compte
      mining: {
        auto: true,
        interval: 0
      },
      chainId: 1, // Pour être compatible avec Mainnet
      allowUnlimitedContractSize: true // Optionnel: permet des contrats plus grands
    }
  }
};