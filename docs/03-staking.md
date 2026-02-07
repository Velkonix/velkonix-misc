# Staking

**Contract:** `src/staking/Staking.sol`

## Purpose

Locks **velk** to mint **xvelk** 1:1. Supports normal exit after lock, or instant exit with penalty.

## Parameters (constructor)

- `VelkToken` — velk ERC20
- `XvelkToken` — xvelk ERC20
- `LockDuration` — in seconds
- `InstantExitPenaltyBps` — penalty in bps (0–10_000)

## Storage

- `Deposits[account] = { amount, depositTimestamp }`
- `RewardsDistributor` — optional, required for instant exit penalty distribution

## Functions

- `Stake(amount)`:
  - Transfer velk from user
  - Mint xvelk to user
  - Updates deposit timestamp

- `Exit()`:
  - Requires lock expired
  - Burn xvelk
  - Transfer velk back

- `InstantExit(amount)`:
  - Requires lock **not** expired
  - Burn xvelk
  - User receives `amount - penalty` velk
  - Penalty (xvelk) minted to distributor and notified

- `SetRewardsDistributor(address)` — admin only
- `Pause/unpause` — pauser role

## Important behaviors

- Multiple stakes update `depositTimestamp` to **latest stake** (lock extends)
- Instant exit requires distributor set
- Penalty is minted as **xvelk**, not velk

## Recommended params

- `LockDuration`: 7d–30d
- `InstantExitPenaltyBps`: 500–2000 (5%–20%)
