# parameters & defaults

## configurable at deployment

- `lockDuration` (staking)
- `instantExitPenaltyBps` (staking)
- `minter` for velk / xvelk
- whitelisted xvelk transfers

## recommended initial set

- `lockDuration`: 14 days
- `instantExitPenaltyBps`: 1000 (10%)
- `velk.minter`: staking (after deployment)
- `xvelk.minter`: staking
- xvelk whitelist: staking, rewards distributor, treasury

## governance to decide

- penalty size and lock duration
- whether xvelk should be transferable or not
- whether to add redemption or vesting
