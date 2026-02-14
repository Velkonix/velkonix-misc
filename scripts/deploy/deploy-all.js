import "dotenv/config";
import { network } from "hardhat";

const { ethers } = await network.connect();
import fs from "node:fs";
import path from "node:path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  const VELK = await ethers.getContractFactory("VELK");
  const xVELK = await ethers.getContractFactory("xVELK");
  const RewardsDistributor = await ethers.getContractFactory("RewardsDistributor");
  const Staking = await ethers.getContractFactory("Staking");
  const Treasury = await ethers.getContractFactory("Treasury");
  const FeeRouter = await ethers.getContractFactory("FeeRouter");

  const velk = await VELK.deploy(deployer.address);
  await velk.waitForDeployment();

  const xvelk = await xVELK.deploy(deployer.address);
  await xvelk.waitForDeployment();

  const rewards = await RewardsDistributor.deploy(await xvelk.getAddress());
  await rewards.waitForDeployment();

  const staking = await Staking.deploy(
    await velk.getAddress(),
    await xvelk.getAddress(),
    process.env.STAKING_LOCK_DURATION || 90 * 24 * 60 * 60,
    process.env.STAKING_PENALTY_BPS || 3000
  );
  await staking.waitForDeployment();

  const treasury = await Treasury.deploy(
    await velk.getAddress(),
    await xvelk.getAddress(),
    await rewards.getAddress()
  );
  await treasury.waitForDeployment();

  await xvelk.setMinter(await staking.getAddress());
  await xvelk.setTransferWhitelist(await rewards.getAddress(), true);
  await xvelk.setTransferWhitelist(await staking.getAddress(), true);
  await rewards.setStaking(await staking.getAddress());
  await staking.setRewardsDistributor(await rewards.getAddress());

  let feeRouter = null;
  if (process.env.FEE_COLLECTOR && process.env.FEE_RECEIVER) {
    feeRouter = await FeeRouter.deploy(process.env.FEE_COLLECTOR, process.env.FEE_RECEIVER);
    await feeRouter.waitForDeployment();
    if (process.env.FEE_CLAIMER) {
      await feeRouter.grantRole(await feeRouter.CLAIMER_ROLE(), process.env.FEE_CLAIMER);
    }
  }

  console.log("deployer:", deployer.address);
  console.log("velk:", await velk.getAddress());
  console.log("xvelk:", await xvelk.getAddress());
  console.log("rewardsDistributor:", await rewards.getAddress());
  console.log("staking:", await staking.getAddress());
  console.log("treasury:", await treasury.getAddress());
  if (feeRouter) {
    console.log("feeRouter:", await feeRouter.getAddress());
  }

  const deploymentPath =
    process.env.DEPLOYMENT_PATH || "deployments/arbitrum-sepolia/velkonix-misc-deployment.json";

  const deployment = {
    chainId: Number(network.chainId),
    network: network.name,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    velk: await velk.getAddress(),
    xvelk: await xvelk.getAddress(),
    rewardsDistributor: await rewards.getAddress(),
    staking: await staking.getAddress(),
    treasury: await treasury.getAddress(),
    feeRouter: feeRouter ? await feeRouter.getAddress() : null,
  };

  const absolutePath = path.resolve(deploymentPath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, JSON.stringify(deployment, null, 2));
  console.log("deployment file:", absolutePath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
