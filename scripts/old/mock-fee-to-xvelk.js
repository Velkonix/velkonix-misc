import "dotenv/config";
import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  const velkAddress = process.env.VELK;
  const treasuryAddress = process.env.TREASURY;
  const amount = process.env.AMOUNT;

  if (!velkAddress || !treasuryAddress || !amount) {
    throw new Error("missing VELK, TREASURY, or AMOUNT env");
  }

  const velk = await ethers.getContractAt("VELK", velkAddress);
  const treasury = await ethers.getContractAt("Treasury", treasuryAddress);

  const [signer] = await ethers.getSigners();
  const mintTx = await velk.mint(await signer.getAddress(), amount);
  await mintTx.wait();

  const approveTx = await velk.approve(treasuryAddress, amount);
  await approveTx.wait();

  const tx = await treasury.depositRewards(amount);
  await tx.wait();

  console.log("mocked fee conversion and deposited rewards");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
