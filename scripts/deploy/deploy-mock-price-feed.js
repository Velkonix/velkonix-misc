import "dotenv/config";
import { network } from "hardhat";

const { ethers } = await network.connect();

function getArg(name) {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);
  if (index === -1 || index + 1 >= process.argv.length) {
    return undefined;
  }

  return process.argv[index + 1];
}

async function main() {
  const decimals = Number(getArg("decimals") ?? process.env.MOCK_PRICE_FEED_DECIMALS ?? 8);
  const description = getArg("description") ?? process.env.MOCK_PRICE_FEED_DESCRIPTION ?? "MOCK / USD";
  const initialAnswerRaw = getArg("initial-answer") ?? process.env.MOCK_PRICE_FEED_INITIAL_ANSWER ?? "100000000";
  const initialAnswer = BigInt(initialAnswerRaw);

  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 255) {
    throw new Error(`Invalid decimals: ${decimals}`);
  }

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const MockChainlinkPriceFeed = await ethers.getContractFactory("MockChainlinkPriceFeed");

  const feed = await MockChainlinkPriceFeed.deploy(decimals, description, initialAnswer);
  await feed.waitForDeployment();

  const deployedAddress = await feed.getAddress();
  const latestRoundData = await feed.latestRoundData();

  console.log("network:", network.name, `(${network.chainId})`);
  console.log("deployer:", deployer.address);
  console.log("mockPriceFeed:", deployedAddress);
  console.log("decimals:", decimals);
  console.log("description:", description);
  console.log("initialAnswer:", initialAnswer.toString());
  console.log("latestRoundData:", {
    roundId: latestRoundData[0].toString(),
    answer: latestRoundData[1].toString(),
    startedAt: latestRoundData[2].toString(),
    updatedAt: latestRoundData[3].toString(),
    answeredInRound: latestRoundData[4].toString(),
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
