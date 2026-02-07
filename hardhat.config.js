require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { ARBITRUM_SEPOLIA_RPC_URL, DEPLOYER_PRIVATE_KEY } = process.env;

module.exports = {
  solidity: "0.8.33",
  networks: {
    arbitrum_sepolia: {
      url: ARBITRUM_SEPOLIA_RPC_URL || "",
      accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [],
    },
  },
};
