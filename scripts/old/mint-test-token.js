import "dotenv/config";
import { network } from "hardhat";

const { ethers } = await network.connect();

function parseArgs(argv) {
  const args = {};

  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (!item.startsWith("--")) {
      continue;
    }

    const eqIndex = item.indexOf("=");
    if (eqIndex > -1) {
      const key = item.slice(2, eqIndex);
      const value = item.slice(eqIndex + 1);
      args[key] = value;
      continue;
    }

    const key = item.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      args[key] = next;
      i += 1;
    } else {
      args[key] = "true";
    }
  }

  return args;
}

function printUsage() {
  console.log("Usage:");
  console.log("  npx hardhat run scripts/mint-test-token.js --network arbitrum_sepolia -- --token 0x... --to 0x... --amount 30");
  console.log("  npm run hh:mint:arb-sepolia -- --token 0x... --to 0x... --amount 30");
  console.log("Optional:");
  console.log("  --decimals 18      # override token decimals");
  console.log("  --rawAmount <wei>  # mint raw units without parseUnits");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help === "true" || args.h === "true") {
    printUsage();
    return;
  }

  const token = args.token;
  const to = args.to;
  const amountInput = args.amount;
  const rawAmountInput = args.rawAmount;
  const decimalsInput = args.decimals;

  if (!token || !to || (!amountInput && !rawAmountInput)) {
    printUsage();
    throw new Error("missing required args: --token, --to, and --amount or --rawAmount");
  }

  if (!ethers.isAddress(token)) {
    throw new Error(`invalid token address: ${token}`);
  }
  if (!ethers.isAddress(to)) {
    throw new Error(`invalid recipient address: ${to}`);
  }

  const minterAbi = [
    "function mint(address to, uint256 amount) external",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function balanceOf(address account) view returns (uint256)",
  ];

  const [signer] = await ethers.getSigners();
  const contract = await ethers.getContractAt(minterAbi, token);

  let symbol = "TOKEN";
  try {
    symbol = await contract.symbol();
  } catch (_) {}

  let mintAmount;
  let decimals;

  if (rawAmountInput) {
    mintAmount = BigInt(rawAmountInput);
  } else {
    if (decimalsInput) {
      decimals = Number(decimalsInput);
    } else {
      try {
        decimals = Number(await contract.decimals());
      } catch (_) {
        decimals = 18;
      }
    }
    mintAmount = ethers.parseUnits(amountInput, decimals);
  }

  const beforeBalance = await contract.balanceOf(to);
  const tx = await contract.mint(to, mintAmount);
  console.log("mint tx:", tx.hash);
  await tx.wait();
  const afterBalance = await contract.balanceOf(to);

  console.log("minter:", await signer.getAddress());
  console.log("token:", token, symbol);
  console.log("to:", to);
  if (rawAmountInput) {
    console.log("minted raw:", mintAmount.toString());
  } else {
    console.log("minted:", amountInput, `(decimals=${decimals})`);
  }
  console.log("balance before:", beforeBalance.toString());
  console.log("balance after:", afterBalance.toString());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
