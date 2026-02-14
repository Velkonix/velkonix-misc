import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_DEPLOYMENT_FILE = "deployments/arbitrum-sepolia/market-deployment.json";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIGS_DIR = path.resolve(__dirname, "configs");

const PROVIDER_ABI = [
  "function getPool() view returns (address)",
  "function getPoolConfigurator() view returns (address)",
  "function getPriceOracle() view returns (address)",
  "function getACLManager() view returns (address)",
  "function getPoolDataProvider() view returns (address)",
];

const POOL_ABI = [
  "function getReservesList() view returns (address[])",
  "function getReservesCount() view returns (uint256)",
];

const POOL_CONFIGURATOR_ABI = [
  "function initReserves((address aTokenImpl,address variableDebtTokenImpl,address underlyingAsset,string aTokenName,string aTokenSymbol,string variableDebtTokenName,string variableDebtTokenSymbol,bytes params,bytes interestRateData)[] input) external",
  "function dropReserve(address asset) external",
  "function setReserveBorrowing(address asset, bool enabled) external",
  "function configureReserveAsCollateral(address asset, uint256 ltv, uint256 liquidationThreshold, uint256 liquidationBonus) external",
  "function setReserveFlashLoaning(address asset, bool enabled) external",
  "function setReserveActive(address asset, bool active) external",
  "function setReserveFreeze(address asset, bool freeze) external",
  "function setReserveFactor(address asset, uint256 newReserveFactor) external",
  "function setBorrowCap(address asset, uint256 newBorrowCap) external",
  "function setSupplyCap(address asset, uint256 newSupplyCap) external",
  "function setLiquidationProtocolFee(address asset, uint256 newFee) external",
  "function setDebtCeiling(address asset, uint256 newDebtCeiling) external",
];

const ORACLE_ABI = [
  "function setAssetSources(address[] assets, address[] sources) external",
  "function getSourceOfAsset(address asset) view returns (address)",
  "function getAssetPrice(address asset) view returns (uint256)",
];

const ACL_MANAGER_ABI = [
  "function isPoolAdmin(address admin) view returns (bool)",
  "function isRiskAdmin(address admin) view returns (bool)",
  "function isAssetListingAdmin(address admin) view returns (bool)",
];

const DATA_PROVIDER_ABI = [
  "function getReserveConfigurationData(address asset) view returns (uint256 decimals, uint256 ltv, uint256 liquidationThreshold, uint256 liquidationBonus, uint256 reserveFactor, bool usageAsCollateralEnabled, bool borrowingEnabled, bool stableBorrowRateEnabled, bool isActive, bool isFrozen)",
  "function getReserveCaps(address asset) view returns (uint256 borrowCap, uint256 supplyCap)",
  "function getLiquidationProtocolFee(address asset) view returns (uint256)",
  "function getFlashLoanEnabled(address asset) view returns (bool)",
  "function getDebtCeiling(address asset) view returns (uint256)",
  "function getPaused(address asset) view returns (bool)",
  "function getATokenTotalSupply(address asset) view returns (uint256)",
  "function getTotalDebt(address asset) view returns (uint256)",
  "function getReserveTokensAddresses(address asset) view returns (address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress)",
  "function getInterestRateStrategyAddress(address asset) view returns (address)",
];

function envValue(...keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return undefined;
}

function envFlag(...keys) {
  const value = envValue(...keys);
  if (!value) return false;
  const normalized = value.toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function resolveInsideDir(baseDir, requestedPathOrName) {
  if (!requestedPathOrName) {
    throw new Error("missing config path (set AAVE_CONFIG)");
  }
  const candidate = path.resolve(baseDir, requestedPathOrName);
  if (!candidate.startsWith(baseDir + path.sep) && candidate !== baseDir) {
    throw new Error(`config must be inside ${baseDir}`);
  }
  if (!candidate.endsWith(".json")) {
    throw new Error("config file must have .json extension");
  }
  if (!fs.existsSync(candidate)) {
    throw new Error(`config file not found: ${candidate}`);
  }
  return candidate;
}

function loadConfigFromArchive(configArg) {
  const configPath = resolveInsideDir(CONFIGS_DIR, configArg);
  const config = readJsonFile(configPath);
  return { configPath, config };
}

function loadDeploymentFile(deploymentFileArg) {
  const deploymentPath = path.resolve(deploymentFileArg || process.env.DEPLOYMENT_PATH || DEFAULT_DEPLOYMENT_FILE);
  if (!fs.existsSync(deploymentPath)) {
    return { deploymentPath, deployment: {} };
  }
  return { deploymentPath, deployment: readJsonFile(deploymentPath) };
}

function requireAddress(ethers, label, value) {
  if (!value || !ethers.isAddress(value)) {
    throw new Error(`invalid ${label} address: ${value}`);
  }
  return value;
}

async function resolveCoreAddresses(hre, options = {}) {
  const { ethers } = hre;
  const deploymentFile = options.deploymentFile || envValue("AAVE_DEPLOYMENT_FILE", "DEPLOYMENT_PATH");
  const { deployment } = loadDeploymentFile(deploymentFile);

  const poolAddressesProvider =
    options.poolAddressesProvider ||
    envValue("AAVE_POOL_ADDRESSES_PROVIDER", "POOL_ADDRESSES_PROVIDER") ||
    deployment.poolAddressesProvider;

  const poolConfigurator =
    options.poolConfigurator ||
    envValue("AAVE_POOL_CONFIGURATOR", "POOL_CONFIGURATOR") ||
    deployment.poolConfiguratorProxy;

  const aaveOracle =
    options.aaveOracle || envValue("AAVE_AAVE_ORACLE", "AAVE_ORACLE") || deployment.aaveOracle;
  const aclManager =
    options.aclManager || envValue("AAVE_ACL_MANAGER", "ACL_MANAGER") || deployment.aclManager;
  const pool = options.pool || envValue("AAVE_POOL", "POOL") || deployment.poolProxy;
  const protocolDataProvider =
    options.protocolDataProvider ||
    envValue("AAVE_PROTOCOL_DATA_PROVIDER", "PROTOCOL_DATA_PROVIDER") ||
    deployment.protocolDataProvider;

  const resolved = {
    poolAddressesProvider,
    poolConfigurator,
    aaveOracle,
    aclManager,
    pool,
    protocolDataProvider,
  };

  if (resolved.poolAddressesProvider && ethers.isAddress(resolved.poolAddressesProvider)) {
    const provider = await ethers.getContractAt(PROVIDER_ABI, resolved.poolAddressesProvider);
    resolved.pool = resolved.pool || (await provider.getPool());
    resolved.poolConfigurator = resolved.poolConfigurator || (await provider.getPoolConfigurator());
    resolved.aaveOracle = resolved.aaveOracle || (await provider.getPriceOracle());
    resolved.aclManager = resolved.aclManager || (await provider.getACLManager());
    resolved.protocolDataProvider =
      resolved.protocolDataProvider || (await provider.getPoolDataProvider());
  }

  requireAddress(ethers, "pool", resolved.pool);
  requireAddress(ethers, "poolConfigurator", resolved.poolConfigurator);
  requireAddress(ethers, "aaveOracle", resolved.aaveOracle);
  requireAddress(ethers, "aclManager", resolved.aclManager);
  requireAddress(ethers, "protocolDataProvider", resolved.protocolDataProvider);

  return resolved;
}

async function getContracts(hre, addresses) {
  const { ethers } = hre;
  return {
    pool: await ethers.getContractAt(POOL_ABI, addresses.pool),
    poolConfigurator: await ethers.getContractAt(POOL_CONFIGURATOR_ABI, addresses.poolConfigurator),
    oracle: await ethers.getContractAt(ORACLE_ABI, addresses.aaveOracle),
    aclManager: await ethers.getContractAt(ACL_MANAGER_ABI, addresses.aclManager),
    dataProvider: await ethers.getContractAt(DATA_PROVIDER_ABI, addresses.protocolDataProvider),
  };
}

async function reserveExists(pool, asset) {
  const reserves = await pool.getReservesList();
  const target = asset.toLowerCase();
  return reserves.some((r) => r.toLowerCase() === target);
}

function parseBigIntLike(v, label) {
  if (v === undefined || v === null || v === "") {
    throw new Error(`missing numeric value for ${label}`);
  }
  try {
    return BigInt(String(v));
  } catch (err) {
    throw new Error(`invalid numeric value for ${label}: ${v}`);
  }
}

function parseOptionalBigIntLike(v, label) {
  if (v === undefined || v === null || v === "") return undefined;
  return parseBigIntLike(v, label);
}

function parseOptionalBool(v, label) {
  if (v === undefined || v === null || v === "") return undefined;
  if (typeof v === "boolean") return v;
  const normalized = String(v).toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  throw new Error(`invalid boolean for ${label}: ${v}`);
}

function normalizeMarketConfig(raw, cliAsset, cliPriceFeed) {
  const config = raw.market || raw;
  const initReserveInput = config.initReserveInput || null;
  const risk = config.riskConfig || {};

  const normalized = {
    asset: cliAsset || config.asset,
    priceFeed: cliPriceFeed || config.priceFeed,
    initReserveInput,
    riskConfig: {
      ltv: parseOptionalBigIntLike(risk.ltv, "riskConfig.ltv"),
      liquidationThreshold: parseOptionalBigIntLike(
        risk.liquidationThreshold,
        "riskConfig.liquidationThreshold"
      ),
      liquidationBonus: parseOptionalBigIntLike(
        risk.liquidationBonus,
        "riskConfig.liquidationBonus"
      ),
      reserveFactor: parseOptionalBigIntLike(risk.reserveFactor, "riskConfig.reserveFactor"),
      borrowCap: parseOptionalBigIntLike(risk.borrowCap, "riskConfig.borrowCap"),
      supplyCap: parseOptionalBigIntLike(risk.supplyCap, "riskConfig.supplyCap"),
      liquidationProtocolFee: parseOptionalBigIntLike(
        risk.liquidationProtocolFee,
        "riskConfig.liquidationProtocolFee"
      ),
      debtCeiling: parseOptionalBigIntLike(risk.debtCeiling, "riskConfig.debtCeiling"),
      borrowingEnabled: parseOptionalBool(risk.borrowingEnabled, "riskConfig.borrowingEnabled"),
      flashloanEnabled: parseOptionalBool(risk.flashloanEnabled, "riskConfig.flashloanEnabled"),
      active: parseOptionalBool(risk.active, "riskConfig.active"),
      frozen: parseOptionalBool(risk.frozen, "riskConfig.frozen"),
    },
  };

  return normalized;
}

async function readReserveState(contracts, asset) {
  const cfg = await contracts.dataProvider.getReserveConfigurationData(asset);
  const [borrowCap, supplyCap] = await contracts.dataProvider.getReserveCaps(asset);
  const liquidationProtocolFee = await contracts.dataProvider.getLiquidationProtocolFee(asset);
  const flashloanEnabled = await contracts.dataProvider.getFlashLoanEnabled(asset);
  const debtCeiling = await contracts.dataProvider.getDebtCeiling(asset);
  const currentPriceFeed = await contracts.oracle.getSourceOfAsset(asset);

  return {
    ltv: cfg.ltv,
    liquidationThreshold: cfg.liquidationThreshold,
    liquidationBonus: cfg.liquidationBonus,
    reserveFactor: cfg.reserveFactor,
    borrowingEnabled: cfg.borrowingEnabled,
    isActive: cfg.isActive,
    isFrozen: cfg.isFrozen,
    borrowCap,
    supplyCap,
    liquidationProtocolFee,
    flashloanEnabled,
    debtCeiling,
    priceFeed: currentPriceFeed,
  };
}

async function getRoleSnapshot(contracts, account) {
  return {
    isPoolAdmin: await contracts.aclManager.isPoolAdmin(account),
    isRiskAdmin: await contracts.aclManager.isRiskAdmin(account),
    isAssetListingAdmin: await contracts.aclManager.isAssetListingAdmin(account),
  };
}

async function runActions(actions, { dryRun }) {
  for (const action of actions) {
    console.log(`\n> ${action.label}`);
    await action.precheck();
    if (dryRun) {
      await action.simulate();
      console.log("  dry-run: ok");
      continue;
    }
    const tx = await action.send();
    console.log(`  tx: ${tx.hash}`);
    await tx.wait();
    if (action.postcheck) {
      await action.postcheck();
    }
    console.log("  status: done");
  }
}

function ensureConfirmed({ dryRun, yes }) {
  if (!dryRun && !yes) {
    throw new Error(
      "set AAVE_YES=true for state-changing execution, or use AAVE_DRY_RUN=true"
    );
  }
}

export {
  CONFIGS_DIR,
  envValue,
  envFlag,
  parseBigIntLike,
  loadConfigFromArchive,
  loadDeploymentFile,
  resolveCoreAddresses,
  getContracts,
  requireAddress,
  reserveExists,
  normalizeMarketConfig,
  readReserveState,
  getRoleSnapshot,
  runActions,
  ensureConfirmed,
};
