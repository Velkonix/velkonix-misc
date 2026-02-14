import "dotenv/config";
import { network } from "hardhat";

const connection = await network.connect();
const { ethers } = connection;
import {
  envValue,
  envFlag,
  ensureConfirmed,
  loadConfigFromArchive,
  normalizeMarketConfig,
  resolveCoreAddresses,
  getContracts,
  requireAddress,
  reserveExists,
  getRoleSnapshot,
  runActions,
} from "./utils.js";

function printUsage() {
  console.log("Environment variables:");
  console.log(
    "  AAVE_CONFIG=arbitrum-sepolia/WETH.json AAVE_ASSET=0x... AAVE_PRICE_FEED=0x... AAVE_DRY_RUN=true npx hardhat run scripts/aave-market-admin/add-market.js --network arbitrum_sepolia"
  );
  console.log("  AAVE_YES=true npx hardhat run scripts/aave-market-admin/add-market.js --network arbitrum_sepolia");
  console.log("Vars:");
  console.log("  AAVE_CONFIG             JSON config path inside scripts/aave-market-admin/configs");
  console.log("  AAVE_ASSET              Asset address (overrides config)");
  console.log("  AAVE_PRICE_FEED         Price feed address (overrides config)");
  console.log("  AAVE_DEPLOYMENT_FILE    Custom deployment JSON path");
  console.log("  AAVE_DRY_RUN            Simulate only");
  console.log("  AAVE_YES                Required for state-changing execution");
}

function validateInitReserveInput(config) {
  if (!config.initReserveInput) {
    throw new Error("add-market requires initReserveInput in config JSON");
  }
  const i = config.initReserveInput;
  const required = [
    "aTokenImpl",
    "variableDebtTokenImpl",
    "underlyingAsset",
    "aTokenName",
    "aTokenSymbol",
    "variableDebtTokenName",
    "variableDebtTokenSymbol",
    "params",
    "interestRateData",
  ];
  for (const field of required) {
    if (i[field] === undefined || i[field] === null || i[field] === "") {
      throw new Error(`initReserveInput.${field} is required`);
    }
  }
}

async function main() {
  if (envFlag("AAVE_HELP", "HELP")) {
    printUsage();
    return;
  }

  const dryRun = envFlag("AAVE_DRY_RUN", "DRY_RUN");
  const yes = envFlag("AAVE_YES", "YES");
  ensureConfirmed({ dryRun, yes });

  const { configPath, config: rawConfig } = loadConfigFromArchive(envValue("AAVE_CONFIG", "CONFIG"));
  const config = normalizeMarketConfig(
    rawConfig,
    envValue("AAVE_ASSET", "ASSET"),
    envValue("AAVE_PRICE_FEED", "PRICE_FEED")
  );
  validateInitReserveInput(config);

  requireAddress(ethers, "asset", config.asset);
  requireAddress(ethers, "priceFeed", config.priceFeed);
  requireAddress(ethers, "initReserveInput.underlyingAsset", config.initReserveInput.underlyingAsset);

  if (config.asset.toLowerCase() !== config.initReserveInput.underlyingAsset.toLowerCase()) {
    throw new Error("asset must match initReserveInput.underlyingAsset");
  }

  const addresses = await resolveCoreAddresses(connection);
  const contracts = await getContracts(connection, addresses);
  const [signer] = await ethers.getSigners();
  const signerAddress = await signer.getAddress();
  const roles = await getRoleSnapshot(contracts, signerAddress);

  console.log("config:", configPath);
  console.log("signer:", signerAddress);
  console.log("roles:", roles);
  console.log("dryRun:", dryRun);

  if (await reserveExists(contracts.pool, config.asset)) {
    throw new Error(`asset already listed: ${config.asset}`);
  }

  const reserveInput = {
    ...config.initReserveInput,
    underlyingAsset: config.asset,
  };

  const actions = [
    {
      label: "Set price feed in AaveOracle",
      precheck: async () => {
        const currentFeed = await contracts.oracle.getSourceOfAsset(config.asset);
        console.log("  current price feed:", currentFeed);
        console.log("  target price feed:", config.priceFeed);
      },
      simulate: async () => {
        await contracts.oracle.setAssetSources.staticCall([config.asset], [config.priceFeed]);
      },
      send: async () => contracts.oracle.setAssetSources([config.asset], [config.priceFeed]),
      postcheck: async () => {
        const updated = await contracts.oracle.getSourceOfAsset(config.asset);
        if (updated.toLowerCase() !== config.priceFeed.toLowerCase()) {
          throw new Error("price feed update verification failed");
        }
      },
    },
    {
      label: "Initialize reserve in PoolConfigurator",
      precheck: async () => {
        if (await reserveExists(contracts.pool, config.asset)) {
          throw new Error("asset became listed during precheck; aborting");
        }
      },
      simulate: async () => {
        await contracts.poolConfigurator.initReserves.staticCall([reserveInput]);
      },
      send: async () => contracts.poolConfigurator.initReserves([reserveInput]),
      postcheck: async () => {
        const listed = await reserveExists(contracts.pool, config.asset);
        if (!listed) {
          throw new Error("reserve listing verification failed");
        }
      },
    },
  ];

  await runActions(actions, { dryRun });
  console.log("\nadd-market completed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
