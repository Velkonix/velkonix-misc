# staking

**contract:** `src/staking/Staking.sol`

## purpose

locks **velk** to mint **xvelk** 1:1. supports normal exit after lock, or instant exit with penalty.

## parameters (constructor)

- `velkToken` — velk ERC20
- `xvelkToken` — xvelk ERC20
- `lockDuration` — in seconds
- `instantExitPenaltyBps` — penalty in bps (0–10_000)

## storage

- `deposits[account] = { amount, depositTimestamp }`
- `rewardsDistributor` — optional, required for instant exit penalty distribution

## functions

- `stake(amount)`:
  - transfer velk from user
  - mint xvelk to user
  - updates deposit timestamp

- `exit()`:
  - requires lock expired
  - burn xvelk
  - transfer velk back

- `instantExit(amount)`:
  - requires lock **not** expired
  - burn xvelk
  - user receives `amount - penalty` velk
  - penalty (xvelk) minted to distributor and notified

- `setRewardsDistributor(address)` — admin only
- `pause/unpause` — pauser role

## important behaviors

- multiple stakes update `depositTimestamp` to **latest stake** (lock extends)
- instant exit requires distributor set
- penalty is minted as **xvelk**, not velk

## recommended params

- `lockDuration`: 7d–30d
- `instantExitPenaltyBps`: 500–2000 (5%–20%)
