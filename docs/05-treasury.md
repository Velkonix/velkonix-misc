# treasury

**contract:** `src/treasury/Treasury.sol`

## purpose

central contract to:

- claim aave rewards via `IRewardsController`
- deposit velk rewards into distributor (mints xvelk and notifies)

## functions

- `setRewardsController(address)` — admin only
- `setRewardAssets(address[])` — admin only
- `claimAaveRewards()` — admin only; claims all rewards to treasury
- `depositRewards(amount)` — admin only; velk → xvelk → distributor

## role model

- `DEFAULT_ADMIN_ROLE` — governance/admin
- `PAUSER_ROLE` — pause/unpause

## notes

- `depositRewards` expects velk approved to treasury
- rewards from aave are not automatically swapped into velk (manual step)
