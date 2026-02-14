import "dotenv/config";
import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  const rewardsDistributorAddress = process.env.REWARDS_DISTRIBUTOR;
  const xvelkAddress = process.env.XVELK;
  const amount = process.env.AMOUNT;

  if (!rewardsDistributorAddress || !xvelkAddress || !amount) {
    throw new Error("missing REWARDS_DISTRIBUTOR, XVELK, or AMOUNT env");
  }

  const xvelk = await ethers.getContractAt("xVELK", xvelkAddress);
  const rewards = await ethers.getContractAt("RewardsDistributor", rewardsDistributorAddress);

  const mintTx = await xvelk.mint(rewardsDistributorAddress, amount);
  await mintTx.wait();

  const tx = await rewards.notifyReward(amount);
  await tx.wait();
  console.log("notified staking rewards");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
