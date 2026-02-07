# Staking

**Contract:** `src/staking/Staking.sol`

## Purpose

Locks **VELK** to mint **xVELK** 1:1. Supports normal exit after lock, or instant exit with penalty.

## Parameters (constructor)

- `velkToken` — VELK ERC20
- `xvelkToken` — xVELK ERC20
- `lockDuration` — in seconds
- `instantExitPenaltyBps` — penalty in bps (0–10_000)

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

- Multiple stakes update `depositTimestamp` to **latest stake** (lock extends)
- Instant exit requires distributor set
- Penalty is minted as **xVELK**, not VELK

## Recommended Params

- `lockDuration`: 7d–30d
- `instantExitPenaltyBps`: 500–2000 (5%–20%)
