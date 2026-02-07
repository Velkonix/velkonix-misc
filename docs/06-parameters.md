# Parameters & Defaults

## Configurable At Deployment

- `lockDuration` (staking)
- `instantExitPenaltyBps` (staking)
- `minter` for VELK / xVELK
- Whitelisted xVELK transfers

## Recommended Initial Set

- `lockDuration`: 3 months
- `instantExitPenaltyBps`: 3000 (30%)
- `VELK.minter`: staking (after deployment)
- `xVELK.minter`: staking
- xVELK whitelist: staking, rewards distributor, treasury

## Governance To Decide

- Penalty size and lock duration
- Whether xVELK should be transferable or not
- Whether to add redemption or vesting
