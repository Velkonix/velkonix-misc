# Rewards distributor

**Contract:** `src/staking/RewardsDistributor.sol`

## Purpose

Tracks rewards for xvelk depositors. Rewards are distributed in **xvelk**.

## Model

- Users deposit xvelk
- Rewards are notified in xvelk
- Accounting uses `accRewardPerShare`

## Functions

- `SetStaking(address)` — admin; only staking can call `notifyReward`
- `Deposit(amount)` — user deposits xvelk
- `Withdraw(amount)` — user withdraws xvelk
- `Claim()` — transfers pending xvelk
- `NotifyReward(amount)` — only staking, adds to rewards

## Accounting

- `AccRewardPerShare` scaled by 1e18
- `PendingRewards` holds rewards when `totalDeposits == 0`
- `_DistributePending()` moves pending into accRewardPerShare once deposits exist

## Role model

- `DEFAULT_ADMIN_ROLE` — can set staking and pause
- `PAUSER_ROLE` — pause/unpause

## Notes

- Rewards are **xvelk**: users stay in escrow token unless you add a swap/redemption layer
