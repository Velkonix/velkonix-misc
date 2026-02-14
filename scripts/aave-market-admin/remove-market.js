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
  reserveExists,
  getRoleSnapshot,
  runActions,
} from "./utils.js";

function printUsage() {
  console.log("Environment variables:");
  console.log(
    "  AAVE_ASSET=0x... AAVE_DRY_RUN=true npx hardhat run scripts/aave-market-admin/remove-market.js --network arbitrum_sepolia"
  );
  console.log("  AAVE_ASSET=0x... AAVE_YES=true npx hardhat run scripts/aave-market-admin/remove-market.js --network arbitrum_sepolia");
  console.log("Vars:");
  console.log("  AAVE_ASSET              Asset address to remove");
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
  const addresses = await resolveCoreAddresses(connection);
  const contracts = await getContracts(connection, addresses);
  const [signer] = await ethers.getSigners();
  const signerAddress = await signer.getAddress();
  const roles = await getRoleSnapshot(contracts, signerAddress);

  console.log("signer:", signerAddress);
  console.log("roles:", roles);
  console.log("dryRun:", dryRun);

  const listed = await reserveExists(contracts.pool, asset);
  if (!listed) {
    throw new Error(`asset is not listed: ${asset}`);
  }

  const actions = [
    {
      label: "Drop reserve",
      precheck: async () => {
        const totalAToken = await contracts.dataProvider.getATokenTotalSupply(asset);
        const totalDebt = await contracts.dataProvider.getTotalDebt(asset);
        console.log("  aToken total supply:", totalAToken.toString());
        console.log("  total debt:", totalDebt.toString());
        if (totalAToken > 0n || totalDebt > 0n) {
          throw new Error(
            "dropReserve precheck failed: reserve has non-zero supply/debt; drain market first"
          );
        }
      },
      simulate: async () => {
        await contracts.poolConfigurator.dropReserve.staticCall(asset);
      },
      send: async () => contracts.poolConfigurator.dropReserve(asset),
      postcheck: async () => {
        if (await reserveExists(contracts.pool, asset)) {
          throw new Error("reserve drop verification failed");
        }
      },
    },
  ];

  await runActions(actions, { dryRun });
  console.log("\nremove-market completed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
