# Staking

**Contract:** `src/staking/Staking.sol`

## Purpose

Locks **VELK** to mint **xVELK** 1:1. Supports normal exit after lock, or instant exit with penalty.

## Parameters (constructor)

- `velkToken` — VELK ERC20
- `xvelkToken` — xVELK ERC20
- `lockDuration` — 3 months
- `instantExitPenaltyBps` — 3000 (30%)

## Storage

- `deposits[account] = { amount, depositTimestamp }`
- `rewardsDistributor` — optional, required for instant exit penalty distribution

## Functions

- `stake(amount)`:
  - Transfer VELK from user
  - Mint xVELK to user
  - Updates deposit timestamp

- `exit()`:
  - Requires lock expired
  - Burn xVELK
  - Transfer VELK back

- `instantExit(amount)`:
  - Requires lock **not** expired
  - Burn xVELK
  - User receives `amount - penalty` VELK
  - Penalty (xVELK) minted to distributor and notified

- `setRewardsDistributor(address)` — admin only
- `pause/unpause` — pauser role

## Important Behaviors

- Multiple stakes update `depositTimestamp` to the **latest stake**. This extends the lock for the **entire** position (lock is always at the maximum).
- xVELK balance always mirrors staked VELK 1:1 (mint on stake, burn on exit/instant exit).
- Instant exit requires distributor set.
- Penalty is minted as **xVELK**, not VELK.
