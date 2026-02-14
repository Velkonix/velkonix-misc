import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { network } from "hardhat";

const connection = await network.connect();
const { ethers } = connection;
import {
  CONFIGS_DIR,
  envValue,
  envFlag,
  resolveCoreAddresses,
  getContracts,
  requireAddress,
  reserveExists,
  readReserveState,
} from "./utils.js";

const ERC20_ABI = [
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function decimals() view returns (uint8)",
];

function printUsage() {
  console.log("Environment variables:");
  console.log(
    "  AAVE_ASSET=0x... npx hardhat run scripts/aave-market-admin/list-markets.js --network arbitrum_sepolia"
  );
  console.log(
    "  AAVE_EXPORT_CONFIGS=true npx hardhat run scripts/aave-market-admin/list-markets.js --network arbitrum_sepolia"
  );
  console.log("Vars:");
  console.log("  AAVE_ASSET              Optional filter by one asset");
  console.log("  AAVE_DEPLOYMENT_FILE    Custom deployment JSON path");
  console.log("  AAVE_VERBOSE            Show detailed blocks per market");
  console.log("  AAVE_EXPORT_CONFIGS     Export current markets to JSON configs (overwrite)");
}

function shortAddr(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatBool(value) {
  return value ? "yes" : "no";
}

function toStringSafe(v) {
  if (v === undefined || v === null) return "-";
  return typeof v === "bigint" ? v.toString() : String(v);
}

function normalizeNetworkFolder(networkName) {
  return String(networkName || "unknown").replaceAll("_", "-");
}

function sanitizeFilePart(input) {
  const out = String(input || "UNKNOWN").replace(/[^a-zA-Z0-9_-]/g, "_");
  return out.length > 0 ? out : "UNKNOWN";
}

function buildExportPayload(detail) {
  return {
    market: {
      asset: detail.asset,
      priceFeed: detail.priceFeed,
      riskConfig: {
        ltv: detail.ltv,
        liquidationThreshold: detail.liquidationThreshold,
        liquidationBonus: detail.liquidationBonus,
        reserveFactor: detail.reserveFactor,
        borrowCap: detail.borrowCap,
        supplyCap: detail.supplyCap,
        liquidationProtocolFee: detail.liquidationProtocolFee,
        debtCeiling: detail.debtCeiling,
        borrowingEnabled: detail.borrowingEnabled === "yes",
        flashloanEnabled: detail.flashloanEnabled === "yes",
        active: detail.active === "yes",
        frozen: detail.frozen === "yes",
      },
    },
    metadata: {
      exportedAt: new Date().toISOString(),
      symbol: detail.symbol,
      name: detail.name,
      decimals: detail.decimals,
      asset: detail.asset,
      network: connection.networkName,
      source: "scripts/aave-market-admin/list-markets.js",
      note:
        "This export contains sync-oriented market params. For add-market listing, initReserveInput must be added manually.",
    },
  };
}

function exportConfigsToFiles(details, networkName) {
  const networkFolder = normalizeNetworkFolder(networkName);
  const targetDir = path.join(CONFIGS_DIR, networkFolder);
  fs.mkdirSync(targetDir, { recursive: true });

  const exported = [];
  for (const detail of details) {
    const fileName = `${sanitizeFilePart(detail.symbol)}-${detail.asset.toLowerCase().slice(2, 10)}.json`;
    const fullPath = path.join(targetDir, fileName);
    const payload = buildExportPayload(detail);
    fs.writeFileSync(fullPath, JSON.stringify(payload, null, 2) + "\n");
    exported.push(fullPath);
  }
  return exported;
}

async function tokenMeta(asset) {
  const token = await ethers.getContractAt(ERC20_ABI, asset);
  let symbol = "UNKNOWN";
  let name = "UNKNOWN";
  let decimals = "?";
  try {
    symbol = await token.symbol();
  } catch (_) {}
  try {
    name = await token.name();
  } catch (_) {}
  try {
    decimals = String(await token.decimals());
  } catch (_) {}
  return { symbol, name, decimals };
}

function printSummaryTable(rows) {
  console.log("\n=== Aave Markets Summary ===");
  console.table(rows);
}

function printDetail(market) {
  console.log(`\n--- ${market.symbol} (${market.asset}) ---`);
  console.log(`name: ${market.name}`);
  console.log(`decimals: ${market.decimals}`);
  console.log(`priceFeed: ${market.priceFeed}`);
  console.log(`aToken: ${market.aToken}`);
  console.log(`variableDebtToken: ${market.variableDebtToken}`);
  console.log(`rateStrategy: ${market.rateStrategy}`);
  console.log(
    `flags: active=${market.active}, frozen=${market.frozen}, paused=${market.paused}, borrow=${market.borrowingEnabled}, flashloan=${market.flashloanEnabled}`
  );
  console.log(
    `risk: ltv=${market.ltv}, liqThreshold=${market.liquidationThreshold}, liqBonus=${market.liquidationBonus}, reserveFactor=${market.reserveFactor}`
  );
  console.log(
    `caps: supplyCap=${market.supplyCap}, borrowCap=${market.borrowCap}, debtCeiling=${market.debtCeiling}, liqProtocolFee=${market.liquidationProtocolFee}`
  );
  console.log(`liquidity: totalAToken=${market.totalAToken}, totalDebt=${market.totalDebt}`);
}

async function main() {
  if (envFlag("AAVE_HELP", "HELP")) {
    printUsage();
    return;
  }
  const verbose =
    envFlag("AAVE_VERBOSE", "VERBOSE", "LIST_MARKETS_VERBOSE");
  const shouldExportConfigs =
    envFlag("AAVE_EXPORT_CONFIGS", "EXPORT_CONFIGS", "EXPORT_MARKET_CONFIGS");

  const addresses = await resolveCoreAddresses(connection);
  const contracts = await getContracts(connection, addresses);

  let assets = await contracts.pool.getReservesList();
  const singleAsset = envValue("AAVE_ASSET", "ASSET");
  if (singleAsset) {
    const asset = requireAddress(ethers, "asset", singleAsset);
    const listed = await reserveExists(contracts.pool, asset);
    if (!listed) {
      throw new Error(`asset is not listed: ${asset}`);
    }
    assets = [asset];
  }

  console.log("market count:", assets.length);
  console.log("pool:", addresses.pool);
  console.log("poolConfigurator:", addresses.poolConfigurator);
  console.log("aaveOracle:", addresses.aaveOracle);
  console.log("protocolDataProvider:", addresses.protocolDataProvider);

  const rows = [];
  const details = [];
  for (const asset of assets) {
    const [state, meta, tokenAddresses, rateStrategy, paused] = await Promise.all([
      readReserveState(contracts, asset),
      tokenMeta(asset),
      contracts.dataProvider.getReserveTokensAddresses(asset),
      contracts.dataProvider.getInterestRateStrategyAddress(asset),
      contracts.dataProvider.getPaused(asset),
    ]);

    const detail = {
      asset,
      symbol: meta.symbol,
      name: meta.name,
      decimals: meta.decimals,
      priceFeed: state.priceFeed,
      aToken: tokenAddresses.aTokenAddress,
      variableDebtToken: tokenAddresses.variableDebtTokenAddress,
      rateStrategy,
      active: formatBool(state.isActive),
      frozen: formatBool(state.isFrozen),
      paused: formatBool(paused),
      borrowingEnabled: formatBool(state.borrowingEnabled),
      flashloanEnabled: formatBool(state.flashloanEnabled),
      ltv: toStringSafe(state.ltv),
      liquidationThreshold: toStringSafe(state.liquidationThreshold),
      liquidationBonus: toStringSafe(state.liquidationBonus),
      reserveFactor: toStringSafe(state.reserveFactor),
      supplyCap: toStringSafe(state.supplyCap),
      borrowCap: toStringSafe(state.borrowCap),
      debtCeiling: toStringSafe(state.debtCeiling),
      liquidationProtocolFee: toStringSafe(state.liquidationProtocolFee),
      totalAToken: toStringSafe(await contracts.dataProvider.getATokenTotalSupply(asset)),
      totalDebt: toStringSafe(await contracts.dataProvider.getTotalDebt(asset)),
    };

    rows.push({
      symbol: detail.symbol,
      asset: shortAddr(detail.asset),
      active: detail.active,
      frozen: detail.frozen,
      paused: detail.paused,
      borrow: detail.borrowingEnabled,
      flashloan: detail.flashloanEnabled,
      ltv: detail.ltv,
      liqThreshold: detail.liquidationThreshold,
      reserveFactor: detail.reserveFactor,
      supplyCap: detail.supplyCap,
      borrowCap: detail.borrowCap,
      feed: shortAddr(detail.priceFeed),
    });
    details.push(detail);
  }

  printSummaryTable(rows);
  if (verbose || singleAsset) {
    for (const detail of details) {
      printDetail(detail);
    }
  } else {
    console.log("\nTip: set AAVE_VERBOSE=true for full per-market details.");
  }

  if (shouldExportConfigs) {
    const exported = exportConfigsToFiles(details, connection.networkName);
    console.log(`\nExported ${exported.length} config file(s) with overwrite:`);
    for (const filePath of exported) {
      console.log(`- ${filePath}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
