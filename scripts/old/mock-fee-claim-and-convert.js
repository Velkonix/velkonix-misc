import "dotenv/config";
import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  const feeRouterAddress = process.env.FEE_ROUTER;
  const feeTokens = (process.env.FEE_TOKENS || "").split(",").filter(Boolean);
  const velkAddress = process.env.VELK;
  const treasuryAddress = process.env.TREASURY;
  const amount = process.env.AMOUNT;

  if (!feeRouterAddress || feeTokens.length === 0) {
    throw new Error("missing FEE_ROUTER or FEE_TOKENS");
  }
  if (!velkAddress || !treasuryAddress || !amount) {
    throw new Error("missing VELK, TREASURY, or AMOUNT");
  }

  const feeRouter = await ethers.getContractAt("FeeRouter", feeRouterAddress);
  const velk = await ethers.getContractAt("VELK", velkAddress);
  const treasury = await ethers.getContractAt("Treasury", treasuryAddress);
  const [signer] = await ethers.getSigners();

  const claimTx = await feeRouter.claim(feeTokens);
  await claimTx.wait();

  const mintTx = await velk.mint(await signer.getAddress(), amount);
  await mintTx.wait();

  const approveTx = await velk.approve(treasuryAddress, amount);
  await approveTx.wait();

  const tx = await treasury.depositRewards(amount);
  await tx.wait();

  console.log("claimed fees and mocked conversion to xvelk rewards");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
