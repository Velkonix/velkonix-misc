require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { ARBITRUM_SEPOLIA_RPC_URL, DEPLOYER_PRIVATE_KEY } = process.env;

module.exports = {
  solidity: "0.8.33",
  paths: {
    sources: "src",
    tests: "test",
    cache: "cache",
    artifacts: "artifacts",
  },
  networks: {
    hardhat: {
      forking: ARBITRUM_SEPOLIA_RPC_URL
        ? {
            url: ARBITRUM_SEPOLIA_RPC_URL,
          }
        : undefined,
    },
    arbitrum_sepolia: {
      url: ARBITRUM_SEPOLIA_RPC_URL || "",
      accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [],
    },
  },
};
