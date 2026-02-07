# Treasury

**Contract:** `src/treasury/Treasury.sol`

## Purpose

Central contract to:

- Claim aave rewards via `IRewardsController`
- Deposit velk rewards into distributor (mints xvelk and notifies)

## Functions

- `SetRewardsController(address)` — admin only
- `SetRewardAssets(address[])` — admin only
- `ClaimAaveRewards()` — admin only; claims all rewards to treasury
- `DepositRewards(amount)` — admin only; velk → xvelk → distributor

## Role model

- `DEFAULT_ADMIN_ROLE` — governance/admin
- `PAUSER_ROLE` — pause/unpause

## Notes

- `DepositRewards` expects velk approved to treasury
- Rewards from aave are not automatically swapped into velk (manual step)
