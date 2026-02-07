# Treasury

**Contract:** `src/treasury/Treasury.sol`

## Purpose

Central contract to:

- Claim Aave rewards via `IRewardsController`
- Deposit VELK rewards into distributor (mints xVELK and notifies)

## Functions

- `setRewardsController(address)` — admin only
- `setRewardAssets(address[])` — admin only
- `claimAaveRewards()` — admin only; claims all rewards to treasury
- `depositRewards(amount)` — admin only; VELK → xVELK → distributor

## Role Model

- `DEFAULT_ADMIN_ROLE` — governance/admin
- `PAUSER_ROLE` — pause/unpause

## Notes

- `depositRewards` expects VELK approved to treasury
- Rewards from Aave are not automatically swapped into VELK (manual step)
