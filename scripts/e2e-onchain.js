require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const cfg = {
    pool: process.env.POOL,
    collector: process.env.COLLECTOR,
    feeRouter: process.env.FEE_ROUTER,
    feeTokens: (process.env.FEE_TOKENS || "").split(",").filter(Boolean),
    velk: process.env.VELK,
    xvelk: process.env.XVELK,
    treasury: process.env.TREASURY,
    staking: process.env.STAKING,
    rewardsDistributor: process.env.REWARDS_DISTRIBUTOR,
    aToken: process.env.ATOKEN,
    debtToken: process.env.DEBT_TOKEN,
    rewardsController: process.env.REWARDS_CONTROLLER,
    user1: process.env.USER1,
    user2: process.env.USER2,
    amount: process.env.AMOUNT || "1000000000000000000",
    rewardAmount: process.env.REWARD_AMOUNT || "1000000000000000000",
  };

  const required = [
    "pool",
    "collector",
    "feeRouter",
    "velk",
    "xvelk",
    "treasury",
    "staking",
    "rewardsDistributor",
    "rewardsController",
    "user1",
    "user2",
  ];
  for (const key of required) {
    if (!cfg[key]) {
      throw new Error(`missing env ${key.toUpperCase()}`);
    }
  }

  const pool = await ethers.getContractAt(
    ["function mintToTreasury(address[] calldata assets) external"],
    cfg.pool
  );
  const feeRouter = await ethers.getContractAt("FeeRouter", cfg.feeRouter);
  const velk = await ethers.getContractAt("VELK", cfg.velk);
  const treasury = await ethers.getContractAt("Treasury", cfg.treasury);
  const staking = await ethers.getContractAt("Staking", cfg.staking);
  const rewards = await ethers.getContractAt("RewardsDistributor", cfg.rewardsDistributor);
  const rewardsController = await ethers.getContractAt(
    ["function claimAllRewards(address[] calldata assets, address to) external returns (address[] memory, uint256[] memory)"],
    cfg.rewardsController
  );

  const [signer] = await ethers.getSigners();
  const user1 = await ethers.getSigner(cfg.user1);
  const user2 = await ethers.getSigner(cfg.user2);

  // 1) mint to treasury (protocol fees)
  if (cfg.feeTokens.length > 0) {
    const tx1 = await pool.mintToTreasury(cfg.feeTokens);
    await tx1.wait();
  }

  // 2) claim fees from collector to treasury
  if (cfg.feeTokens.length > 0) {
    const tx2 = await feeRouter.claim(cfg.feeTokens);
    await tx2.wait();
  }

  // 3) mock convert fees -> velk -> xvelk rewards
  const mintTx = await velk.mint(await signer.getAddress(), cfg.rewardAmount);
  await mintTx.wait();
  const approveTx = await velk.approve(cfg.treasury, cfg.rewardAmount);
  await approveTx.wait();
  const depTx = await treasury.depositRewards(cfg.rewardAmount);
  await depTx.wait();

  // 4) users stake velk -> xvelk
  const u1Approve = await velk.connect(user1).approve(cfg.staking, cfg.amount);
  await u1Approve.wait();
  const u1Stake = await staking.connect(user1).stake(cfg.amount);
  await u1Stake.wait();

  const u2Approve = await velk.connect(user2).approve(cfg.staking, cfg.amount);
  await u2Approve.wait();
  const u2Stake = await staking.connect(user2).stake(cfg.amount);
  await u2Stake.wait();

  const u1XApprove = await ethers.getContractAt("xVELK", cfg.xvelk);
  await (await u1XApprove.connect(user1).approve(cfg.rewardsDistributor, cfg.amount)).wait();
  await (await rewards.connect(user1).deposit(cfg.amount)).wait();

  await (await u1XApprove.connect(user2).approve(cfg.rewardsDistributor, cfg.amount)).wait();
  await (await rewards.connect(user2).deposit(cfg.amount)).wait();

  // 5) claim staking rewards
  await (await rewards.connect(user1).claim()).wait();
  await (await rewards.connect(user2).claim()).wait();

  // 6) claim rewards for deposit/borrow (xvelk reward configured in rewardsController)
  const assets = [];
  if (cfg.aToken) assets.push(cfg.aToken);
  if (cfg.debtToken) assets.push(cfg.debtToken);
  if (assets.length > 0) {
    await (await rewardsController.connect(user1).claimAllRewards(assets, cfg.user1)).wait();
    await (await rewardsController.connect(user2).claimAllRewards(assets, cfg.user2)).wait();
  }

  console.log("e2e onchain flow completed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
