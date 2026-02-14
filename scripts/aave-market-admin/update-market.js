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
  readReserveState,
  runActions,
} from "./utils.js";

function printUsage() {
  console.log("Environment variables:");
  console.log(
    "  AAVE_CONFIG=arbitrum-sepolia/WETH.json AAVE_ASSET=0x... AAVE_DRY_RUN=true npx hardhat run scripts/aave-market-admin/update-market.js --network arbitrum_sepolia"
  );
  console.log("  AAVE_CONFIG=arbitrum-sepolia/WETH.json AAVE_ASSET=0x... AAVE_YES=true npx hardhat run scripts/aave-market-admin/update-market.js --network arbitrum_sepolia");
  console.log("Vars:");
  console.log("  AAVE_CONFIG             JSON config path inside scripts/aave-market-admin/configs");
  console.log("  AAVE_ASSET              Asset address (overrides config)");
  console.log("  AAVE_PRICE_FEED         Price feed address (overrides config)");
  console.log("  AAVE_DEPLOYMENT_FILE    Custom deployment JSON path");
  console.log("  AAVE_DRY_RUN            Simulate only");
  console.log("  AAVE_YES                Required for state-changing execution");
}

function buildDiff(current, config) {
  const risk = config.riskConfig || {};
  const diff = {};

  if (config.priceFeed && current.priceFeed.toLowerCase() !== config.priceFeed.toLowerCase()) {
    diff.priceFeed = { current: current.priceFeed, target: config.priceFeed };
  }
  if (risk.ltv !== undefined && current.ltv !== risk.ltv) {
    diff.ltv = { current: current.ltv, target: risk.ltv };
  }
  if (
    risk.liquidationThreshold !== undefined &&
    current.liquidationThreshold !== risk.liquidationThreshold
  ) {
    diff.liquidationThreshold = {
      current: current.liquidationThreshold,
      target: risk.liquidationThreshold,
    };
  }
  if (risk.liquidationBonus !== undefined && current.liquidationBonus !== risk.liquidationBonus) {
    diff.liquidationBonus = { current: current.liquidationBonus, target: risk.liquidationBonus };
  }
  if (risk.reserveFactor !== undefined && current.reserveFactor !== risk.reserveFactor) {
    diff.reserveFactor = { current: current.reserveFactor, target: risk.reserveFactor };
  }
  if (risk.borrowCap !== undefined && current.borrowCap !== risk.borrowCap) {
    diff.borrowCap = { current: current.borrowCap, target: risk.borrowCap };
  }
  if (risk.supplyCap !== undefined && current.supplyCap !== risk.supplyCap) {
    diff.supplyCap = { current: current.supplyCap, target: risk.supplyCap };
  }
  if (
    risk.liquidationProtocolFee !== undefined &&
    current.liquidationProtocolFee !== risk.liquidationProtocolFee
  ) {
    diff.liquidationProtocolFee = {
      current: current.liquidationProtocolFee,
      target: risk.liquidationProtocolFee,
    };
  }
  if (risk.debtCeiling !== undefined && current.debtCeiling !== risk.debtCeiling) {
    diff.debtCeiling = { current: current.debtCeiling, target: risk.debtCeiling };
  }
  if (risk.borrowingEnabled !== undefined && current.borrowingEnabled !== risk.borrowingEnabled) {
    diff.borrowingEnabled = { current: current.borrowingEnabled, target: risk.borrowingEnabled };
  }
  if (risk.flashloanEnabled !== undefined && current.flashloanEnabled !== risk.flashloanEnabled) {
    diff.flashloanEnabled = { current: current.flashloanEnabled, target: risk.flashloanEnabled };
  }
  if (risk.active !== undefined && current.isActive !== risk.active) {
    diff.active = { current: current.isActive, target: risk.active };
  }
  if (risk.frozen !== undefined && current.isFrozen !== risk.frozen) {
    diff.frozen = { current: current.isFrozen, target: risk.frozen };
  }

  return diff;
}

function printDiff(diff) {
  const keys = Object.keys(diff);
  if (keys.length === 0) {
    console.log("diff: empty (already synced)");
    return;
  }
  console.log("diff:");
  for (const key of keys) {
    const row = diff[key];
    console.log(`  - ${key}: ${row.current} -> ${row.target}`);
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
  const asset = requireAddress(ethers, "asset", config.asset);
  if (config.priceFeed) {
    requireAddress(ethers, "priceFeed", config.priceFeed);
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

  if (!(await reserveExists(contracts.pool, asset))) {
    throw new Error(`asset is not listed: ${asset}`);
  }

  const current = await readReserveState(contracts, asset);
  const diff = buildDiff(current, config);
  printDiff(diff);

  if (Object.keys(diff).length === 0) {
    return;
  }

  const actions = [];

  if (diff.priceFeed) {
    actions.push({
      label: "Update price feed",
      precheck: async () => {},
      simulate: async () => {
        await contracts.oracle.setAssetSources.staticCall([asset], [config.priceFeed]);
      },
      send: async () => contracts.oracle.setAssetSources([asset], [config.priceFeed]),
    });
  }

  if (diff.active) {
    actions.push({
      label: "Set reserve active flag",
      precheck: async () => {},
      simulate: async () => {
        await contracts.poolConfigurator.setReserveActive.staticCall(asset, diff.active.target);
      },
      send: async () => contracts.poolConfigurator.setReserveActive(asset, diff.active.target),
    });
  }

  if (diff.frozen) {
    actions.push({
      label: "Set reserve frozen flag",
      precheck: async () => {},
      simulate: async () => {
        await contracts.poolConfigurator.setReserveFreeze.staticCall(asset, diff.frozen.target);
      },
      send: async () => contracts.poolConfigurator.setReserveFreeze(asset, diff.frozen.target),
    });
  }

  if (diff.borrowingEnabled) {
    actions.push({
      label: "Set reserve borrowing flag",
      precheck: async () => {},
      simulate: async () => {
        await contracts.poolConfigurator.setReserveBorrowing.staticCall(
          asset,
          diff.borrowingEnabled.target
        );
      },
      send: async () =>
        contracts.poolConfigurator.setReserveBorrowing(asset, diff.borrowingEnabled.target),
    });
  }

  if (diff.ltv || diff.liquidationThreshold || diff.liquidationBonus) {
    actions.push({
      label: "Configure collateral params",
      precheck: async () => {},
      simulate: async () => {
        await contracts.poolConfigurator.configureReserveAsCollateral.staticCall(
          asset,
          config.riskConfig.ltv !== undefined ? config.riskConfig.ltv : current.ltv,
          config.riskConfig.liquidationThreshold !== undefined
            ? config.riskConfig.liquidationThreshold
            : current.liquidationThreshold,
          config.riskConfig.liquidationBonus !== undefined
            ? config.riskConfig.liquidationBonus
            : current.liquidationBonus
        );
      },
      send: async () =>
        contracts.poolConfigurator.configureReserveAsCollateral(
          asset,
          config.riskConfig.ltv !== undefined ? config.riskConfig.ltv : current.ltv,
          config.riskConfig.liquidationThreshold !== undefined
            ? config.riskConfig.liquidationThreshold
            : current.liquidationThreshold,
          config.riskConfig.liquidationBonus !== undefined
            ? config.riskConfig.liquidationBonus
            : current.liquidationBonus
        ),
    });
  }

  if (diff.reserveFactor) {
    actions.push({
      label: "Set reserve factor",
      precheck: async () => {},
      simulate: async () => {
        await contracts.poolConfigurator.setReserveFactor.staticCall(asset, diff.reserveFactor.target);
      },
      send: async () => contracts.poolConfigurator.setReserveFactor(asset, diff.reserveFactor.target),
    });
  }

  if (diff.borrowCap) {
    actions.push({
      label: "Set borrow cap",
      precheck: async () => {},
      simulate: async () => {
        await contracts.poolConfigurator.setBorrowCap.staticCall(asset, diff.borrowCap.target);
      },
      send: async () => contracts.poolConfigurator.setBorrowCap(asset, diff.borrowCap.target),
    });
  }

  if (diff.supplyCap) {
    actions.push({
      label: "Set supply cap",
      precheck: async () => {},
      simulate: async () => {
        await contracts.poolConfigurator.setSupplyCap.staticCall(asset, diff.supplyCap.target);
      },
      send: async () => contracts.poolConfigurator.setSupplyCap(asset, diff.supplyCap.target),
    });
  }

  if (diff.liquidationProtocolFee) {
    actions.push({
      label: "Set liquidation protocol fee",
      precheck: async () => {},
      simulate: async () => {
        await contracts.poolConfigurator.setLiquidationProtocolFee.staticCall(
          asset,
          diff.liquidationProtocolFee.target
        );
      },
      send: async () =>
        contracts.poolConfigurator.setLiquidationProtocolFee(asset, diff.liquidationProtocolFee.target),
    });
  }

  if (diff.flashloanEnabled) {
    actions.push({
      label: "Set flashloan enabled flag",
      precheck: async () => {},
      simulate: async () => {
        await contracts.poolConfigurator.setReserveFlashLoaning.staticCall(
          asset,
          diff.flashloanEnabled.target
        );
      },
      send: async () =>
        contracts.poolConfigurator.setReserveFlashLoaning(asset, diff.flashloanEnabled.target),
    });
  }

  if (diff.debtCeiling) {
    actions.push({
      label: "Set debt ceiling",
      precheck: async () => {},
      simulate: async () => {
        await contracts.poolConfigurator.setDebtCeiling.staticCall(asset, diff.debtCeiling.target);
      },
      send: async () => contracts.poolConfigurator.setDebtCeiling(asset, diff.debtCeiling.target),
    });
  }

  await runActions(actions, { dryRun });

  if (dryRun) {
    console.log("\nupdate-market dry-run completed");
    return;
  }

  const after = await readReserveState(contracts, asset);
  const afterDiff = buildDiff(after, config);
  if (Object.keys(afterDiff).length > 0) {
    printDiff(afterDiff);
    throw new Error("post-check failed: market is not fully synced with config");
  }

  console.log("\nupdate-market completed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
