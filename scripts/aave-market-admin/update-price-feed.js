import "dotenv/config";
import { network } from "hardhat";

const connection = await network.connect();
const { ethers } = connection;
import {
  envValue,
  envFlag,
  ensureConfirmed,
  resolveCoreAddresses,
  getContracts,
  requireAddress,
  getRoleSnapshot,
  runActions,
} from "./utils.js";

function printUsage() {
  console.log("Environment variables:");
  console.log(
    "  AAVE_ASSET=0x... AAVE_PRICE_FEED=0x... AAVE_DRY_RUN=true npx hardhat run scripts/aave-market-admin/update-price-feed.js --network arbitrum_sepolia"
  );
  console.log("  AAVE_ASSET=0x... AAVE_PRICE_FEED=0x... AAVE_YES=true npx hardhat run scripts/aave-market-admin/update-price-feed.js --network arbitrum_sepolia");
  console.log("Vars:");
  console.log("  AAVE_ASSET              Asset address");
  console.log("  AAVE_PRICE_FEED         New price feed");
  console.log("  AAVE_DEPLOYMENT_FILE    Custom deployment JSON path");
  console.log("  AAVE_DRY_RUN            Simulate only");
  console.log("  AAVE_YES                Required for state-changing execution");
}

async function main() {
  if (envFlag("AAVE_HELP", "HELP")) {
    printUsage();
    return;
  }

  const dryRun = envFlag("AAVE_DRY_RUN", "DRY_RUN");
  const yes = envFlag("AAVE_YES", "YES");
  ensureConfirmed({ dryRun, yes });

  const asset = requireAddress(ethers, "asset", envValue("AAVE_ASSET", "ASSET"));
  const priceFeed = requireAddress(
    ethers,
    "priceFeed",
    envValue("AAVE_PRICE_FEED", "PRICE_FEED")
  );

  const addresses = await resolveCoreAddresses(connection);
  const contracts = await getContracts(connection, addresses);
  const [signer] = await ethers.getSigners();
  const signerAddress = await signer.getAddress();
  const roles = await getRoleSnapshot(contracts, signerAddress);
  console.log("signer:", signerAddress);
  console.log("roles:", roles);
  console.log("dryRun:", dryRun);

  const currentFeed = await contracts.oracle.getSourceOfAsset(asset);
  if (currentFeed.toLowerCase() === priceFeed.toLowerCase()) {
    console.log("price feed is already up to date:", currentFeed);
    return;
  }

  const actions = [
    {
      label: "Update oracle source",
      precheck: async () => {
        const currentPrice = await contracts.oracle.getAssetPrice(asset);
        console.log("  current feed:", currentFeed);
        console.log("  target feed:", priceFeed);
        console.log("  current asset price:", currentPrice.toString());
      },
      simulate: async () => {
        await contracts.oracle.setAssetSources.staticCall([asset], [priceFeed]);
      },
      send: async () => contracts.oracle.setAssetSources([asset], [priceFeed]),
      postcheck: async () => {
        const updated = await contracts.oracle.getSourceOfAsset(asset);
        if (updated.toLowerCase() !== priceFeed.toLowerCase()) {
          throw new Error("price feed update verification failed");
        }
      },
    },
  ];

  await runActions(actions, { dryRun });
  console.log("\nupdate-price-feed completed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
