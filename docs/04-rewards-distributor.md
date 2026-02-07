# rewards distributor

**contract:** `src/staking/RewardsDistributor.sol`

## purpose

tracks rewards for xvelk depositors. rewards are distributed in **xvelk**.

## model

- users deposit xvelk
- rewards are notified in xvelk
- accounting uses `accRewardPerShare`

## functions

- `setStaking(address)` — admin; only staking can call `notifyReward`
- `deposit(amount)` — user deposits xvelk
- `withdraw(amount)` — user withdraws xvelk
- `claim()` — transfers pending xvelk
- `notifyReward(amount)` — only staking, adds to rewards

## accounting

- `accRewardPerShare` scaled by 1e18
- `pendingRewards` holds rewards when `totalDeposits == 0`
- `_distributePending()` moves pending into accRewardPerShare once deposits exist

## role model

- `DEFAULT_ADMIN_ROLE` — can set staking and pause
- `PAUSER_ROLE` — pause/unpause

## notes

- rewards are **xvelk**: users stay in escrow token unless you add a swap/redemption layer
