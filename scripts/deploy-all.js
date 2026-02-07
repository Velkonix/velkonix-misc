require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

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
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
