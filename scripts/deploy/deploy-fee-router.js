import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  const collector = process.env.COLLECTOR;
  const receiver = process.env.FEE_RECEIVER;
  const claimer = process.env.FEE_CLAIMER;

  if (!collector || !receiver) {
    throw new Error("missing COLLECTOR or FEE_RECEIVER env");
  }

  const FeeRouter = await ethers.getContractFactory("FeeRouter");
  const feeRouter = await FeeRouter.deploy(collector, receiver);
  await feeRouter.waitForDeployment();

  if (claimer) {
    await feeRouter.grantRole(await feeRouter.CLAIMER_ROLE(), claimer);
  }

  const address = await feeRouter.getAddress();
  console.log("feeRouter:", address);

  const deployPath = process.env.DEPLOYMENT_PATH || "deployments/arbitrum-sepolia/velkonix-misc-deployment.json";
  const fullPath = path.join(process.cwd(), deployPath);
  let data = {};
  if (fs.existsSync(fullPath)) {
    data = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  }
  data.feeRouter = address;
  data.collector = collector;
  data.feeReceiver = receiver;
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
