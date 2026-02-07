# staking

**contract:** `src/staking/staking.sol`

## purpose

locks **velk** to mint **xvelk** 1:1. supports normal exit after lock, or instant exit with penalty.

## parameters (constructor)

- `velktoken` — velk erc20
- `xvelktoken` — xvelk erc20
- `lockduration` — in seconds
- `instantexitpenaltybps` — penalty in bps (0–10_000)

## storage

- `deposits[account] = { amount, deposittimestamp }`
- `rewardsdistributor` — optional, required for instant exit penalty distribution

## functions

- `stake(amount)`:
  - transfer velk from user
  - mint xvelk to user
  - updates deposit timestamp

- `exit()`:
  - requires lock expired
  - burn xvelk
  - transfer velk back

- `instantexit(amount)`:
  - requires lock **not** expired
  - burn xvelk
  - user receives `amount - penalty` velk
  - penalty (xvelk) minted to distributor and notified

- `setrewardsdistributor(address)` — admin only
- `pause/unpause` — pauser role

## important behaviors

- multiple stakes update `deposittimestamp` to **latest stake** (lock extends)
- instant exit requires distributor set
- penalty is minted as **xvelk**, not velk

## recommended params

- `lockduration`: 7d–30d
- `instantexitpenaltybps`: 500–2000 (5%–20%)
