# Parameters & defaults

## Configurable at deployment

- `LockDuration` (staking)
- `InstantExitPenaltyBps` (staking)
- `Minter` for velk / xvelk
- Whitelisted xvelk transfers

## Recommended initial set

- `LockDuration`: 14 days
- `InstantExitPenaltyBps`: 1000 (10%)
- `Velk.minter`: staking (after deployment)
- `Xvelk.minter`: staking
- Xvelk whitelist: staking, rewards distributor, treasury

## Governance to decide

- Penalty size and lock duration
- Whether xvelk should be transferable or not
- Whether to add redemption or vesting
