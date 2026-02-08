require("dotenv").config();
const fs = require("fs");
const path = require("path");
const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const deploymentPath = process.env.DEPLOYMENT_PATH || "deployments/arbitrum-sepolia/velkonix-misc-deployment.json";
  const deployment = fs.existsSync(deploymentPath)
    ? JSON.parse(fs.readFileSync(deploymentPath, "utf8"))
    : {};

  const cfg = {
    pool: process.env.POOL || "0x2102E2F0eCa7E293a0BacD343bd001a91e8fa177",
    collector: process.env.COLLECTOR || deployment.collector || "0xD4aB0313C451961dfE2a77337367DA44b2629993",
    feeRouter: process.env.FEE_ROUTER || deployment.feeRouter,
    feeTokens: (process.env.FEE_TOKENS || "").split(",").filter(Boolean),
    velk: process.env.VELK || deployment.velk,
    xvelk: process.env.XVELK || deployment.xvelk,
    treasury: process.env.TREASURY || deployment.treasury,
    staking: process.env.STAKING || deployment.staking,
    rewardsDistributor: process.env.REWARDS_DISTRIBUTOR || deployment.rewardsDistributor,
    rewardsController: process.env.REWARDS_CONTROLLER || "0x7D178C702DF8f1A8493d9FF959D570D3f8142D52",
    aToken: process.env.ATOKEN,
    debtToken: process.env.DEBT_TOKEN,
    amount: process.env.AMOUNT || "1000000000000000000",
    rewardAmount: process.env.REWARD_AMOUNT || "1000000000000000000",
  };

  const required = ["feeRouter", "velk", "xvelk", "treasury", "staking", "rewardsDistributor"];
  for (const key of required) {
    if (!cfg[key]) {
      throw new Error(`missing ${key}`);
    }
  }

  const pool = await ethers.getContractAt(
    ["function mintToTreasury(address[] calldata assets) external"],
    cfg.pool
  );
  const feeRouter = await ethers.getContractAt("FeeRouter", cfg.feeRouter);
  const velk = await ethers.getContractAt("VELK", cfg.velk);
  const xvelk = await ethers.getContractAt("xVELK", cfg.xvelk);
  const treasury = await ethers.getContractAt("Treasury", cfg.treasury);
  const staking = await ethers.getContractAt("Staking", cfg.staking);
  const rewards = await ethers.getContractAt("RewardsDistributor", cfg.rewardsDistributor);
  const rewardsController = await ethers.getContractAt(
    ["function claimAllRewards(address[] calldata assets, address to) external returns (address[] memory, uint256[] memory)"],
    cfg.rewardsController
  );

  const [signer] = await ethers.getSigners();
  const user1 = ethers.Wallet.createRandom().connect(ethers.provider);
  const user2 = ethers.Wallet.createRandom().connect(ethers.provider);

  // fork-only: impersonate velk minter (deployer) to mint
  if (hre.network.name === "hardhat") {
    const minter = deployment.deployer;
    if (!minter) {
      throw new Error("missing deployer in deployment file for fork minter impersonation");
    }
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [minter],
    });
    await hre.network.provider.send("hardhat_setBalance", [minter, "0x3635C9ADC5DEA00000"]); // 1000 ETH
    const minterSigner = await ethers.getSigner(minter);

    cfg._velkMinterSigner = minterSigner;
    cfg._adminSigner = minterSigner;
  }

  // fund users with eth for gas
  await (await signer.sendTransaction({ to: user1.address, value: ethers.parseEther("0.01") })).wait();
  await (await signer.sendTransaction({ to: user2.address, value: ethers.parseEther("0.01") })).wait();

  // optional: mint to treasury (protocol fees)
  if (cfg.feeTokens.length > 0) {
    await (await pool.mintToTreasury(cfg.feeTokens)).wait();
    await (await feeRouter.claim(cfg.feeTokens)).wait();
  }

  // fork-only: allow treasury and admin to mint xvelk and act as staking for rewards
  if (cfg._adminSigner) {
    await (await xvelk.connect(cfg._adminSigner).addMinter(cfg.treasury)).wait();
    await (await rewards.connect(cfg._adminSigner).setStaking(cfg.treasury)).wait();
  }

  // mock convert fees -> velk -> xvelk rewards
  const velkMinter = cfg._velkMinterSigner ? velk.connect(cfg._velkMinterSigner) : velk;
  const adminSigner = cfg._adminSigner || signer;
  await (await velkMinter.mint(await adminSigner.getAddress(), cfg.rewardAmount)).wait();
  await (await velk.connect(adminSigner).approve(cfg.treasury, cfg.rewardAmount)).wait();
  await (await treasury.connect(adminSigner).depositRewards(cfg.rewardAmount)).wait();

  // mint velk for users and stake
  await (await velkMinter.mint(user1.address, cfg.amount)).wait();
  await (await velkMinter.mint(user2.address, cfg.amount)).wait();

  await (await velk.connect(user1).approve(cfg.staking, cfg.amount)).wait();
  await (await staking.connect(user1).stake(cfg.amount)).wait();

  await (await velk.connect(user2).approve(cfg.staking, cfg.amount)).wait();
  await (await staking.connect(user2).stake(cfg.amount)).wait();

  await (await xvelk.connect(user1).approve(cfg.rewardsDistributor, cfg.amount)).wait();
  await (await rewards.connect(user1).deposit(cfg.amount)).wait();

  await (await xvelk.connect(user2).approve(cfg.rewardsDistributor, cfg.amount)).wait();
  await (await rewards.connect(user2).deposit(cfg.amount)).wait();

  // notify rewards so claims succeed
  if (cfg._adminSigner) {
    const rewardMintAmount = (BigInt(cfg.amount) * 2n).toString();
    await (await xvelk.connect(cfg._adminSigner).addMinter(await cfg._adminSigner.getAddress())).wait();
    await (await rewards.connect(cfg._adminSigner).setStaking(await cfg._adminSigner.getAddress())).wait();
    await (await xvelk.connect(cfg._adminSigner).mint(cfg.rewardsDistributor, rewardMintAmount)).wait();
    await (await rewards.connect(cfg._adminSigner).notifyReward(rewardMintAmount)).wait();
  }

  await (await rewards.connect(user1).claim()).wait();
  await (await rewards.connect(user2).claim()).wait();

  const assets = [];
  if (cfg.aToken) assets.push(cfg.aToken);
  if (cfg.debtToken) assets.push(cfg.debtToken);
  if (assets.length > 0) {
    await (await rewardsController.connect(user1).claimAllRewards(assets, user1.address)).wait();
    await (await rewardsController.connect(user2).claimAllRewards(assets, user2.address)).wait();
  }

  console.log("e2e onchain flow completed");
  console.log("user1:", user1.address);
  console.log("user2:", user2.address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
