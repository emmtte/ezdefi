require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
//import { HardhatUserConfig } from "hardhat/config";

const dotenv = require("dotenv");
dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const RPC_URL_SEPOLIA = process.env.RPC_URL_SEPOLIA || "";

module.exports = {
  solidity: "0.8.28",
  defaultNetwork: "localhost",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
   sepolia: {
     url: RPC_URL_SEPOLIA,
     chainId: 11155111,
     accounts: [`0x${PRIVATE_KEY}`]
    }
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY
    }
  },
  docgen: {
    path: './docs',
    clear: true,
    runOnCompile: true,
  }
};