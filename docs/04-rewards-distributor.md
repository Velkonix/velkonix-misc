# Rewards Distributor

**Contract:** `src/staking/RewardsDistributor.sol`

## Purpose

Tracks rewards for xVELK depositors. Rewards are distributed in **xVELK**.

## Model

- Users deposit xVELK
- Rewards are notified in xVELK
- Accounting uses `accRewardPerShare`

## Functions

- `setStaking(address)` — admin; only staking can call `notifyReward`
- `deposit(amount)` — user deposits xVELK
- `withdraw(amount)` — user withdraws xVELK
- `claim()` — transfers pending xVELK
- `notifyReward(amount)` — only staking, adds to rewards

## Accounting

- `accRewardPerShare` scaled by 1e18
- `pendingRewards` holds rewards when `totalDeposits == 0`
- `_distributePending()` moves pending into accRewardPerShare once deposits exist

## Role Model

- `DEFAULT_ADMIN_ROLE` — can set staking and pause
- `PAUSER_ROLE` — pause/unpause

## Notes

- Rewards are **xVELK**: users stay in escrow token unless you add a swap/redemption layer
