import "dotenv/config";
import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  const feeRouterAddress = process.env.FEE_ROUTER;
  const tokens = (process.env.FEE_TOKENS || "").split(",").filter(Boolean);

  if (!feeRouterAddress) {
    throw new Error("missing FEE_ROUTER env");
  }
  if (tokens.length === 0) {
    throw new Error("missing FEE_TOKENS env (comma-separated)");
  }

  const feeRouter = await ethers.getContractAt("FeeRouter", feeRouterAddress);
  const tx = await feeRouter.claim(tokens);
  await tx.wait();
  console.log("claimed fees via fee router");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
