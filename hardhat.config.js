import { defineConfig } from "hardhat/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import hardhatMocha from "@nomicfoundation/hardhat-mocha";
import dotenv from "dotenv";

dotenv.config();

const {
  ARBITRUM_SEPOLIA_RPC_URL = "https://sepolia-rollup.arbitrum.io/rpc",
  DEPLOYER_PRIVATE_KEY,
} = process.env;

export default defineConfig({
  plugins: [hardhatEthers, hardhatMocha],
  solidity: "0.8.33",
  paths: {
    sources: "src",
    tests: "test",
    cache: "cache",
    artifacts: "artifacts",
  },
  networks: {
    hardhat: {
      type: "edr-simulated",
      forking: ARBITRUM_SEPOLIA_RPC_URL
        ? {
            url: ARBITRUM_SEPOLIA_RPC_URL,
          }
        : undefined,
    },
    arbitrum_sepolia: {
      type: "http",
      url: ARBITRUM_SEPOLIA_RPC_URL,
      accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [],
    },
  },
});
