# parameters & defaults

## configurable at deployment

- `lockduration` (staking)
- `instantexitpenaltybps` (staking)
- `minter` for velk / xvelk
- whitelisted xvelk transfers

## recommended initial set

- `lockduration`: 14 days
- `instantexitpenaltybps`: 1000 (10%)
- `velk.minter`: staking (after deployment)
- `xvelk.minter`: staking
- xvelk whitelist: staking, rewards distributor, treasury

## governance to decide

- penalty size and lock duration
- whether xvelk should be transferable or not
- whether to add redemption or vesting
