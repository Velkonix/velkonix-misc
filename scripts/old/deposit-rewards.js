import "dotenv/config";
import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  const treasuryAddress = process.env.TREASURY;
  const velkAddress = process.env.VELK;
  const amount = process.env.AMOUNT;

  if (!treasuryAddress || !velkAddress || !amount) {
    throw new Error("missing TREASURY, VELK, or AMOUNT env");
  }

  const velk = await ethers.getContractAt("VELK", velkAddress);
  const treasury = await ethers.getContractAt("Treasury", treasuryAddress);

  const approveTx = await velk.approve(treasuryAddress, amount);
  await approveTx.wait();

  const tx = await treasury.depositRewards(amount);
  await tx.wait();
  console.log("deposited rewards into treasury");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
