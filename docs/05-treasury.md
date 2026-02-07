# treasury

**contract:** `src/treasury/treasury.sol`

## purpose

central contract to:

- claim aave rewards via `irewardscontroller`
- deposit velk rewards into distributor (mints xvelk and notifies)

## functions

- `setrewardscontroller(address)` — admin only
- `setrewardassets(address[])` — admin only
- `claimaaverewards()` — admin only; claims all rewards to treasury
- `depositrewards(amount)` — admin only; velk → xvelk → distributor

## role model

- `default_admin_role` — governance/admin
- `pauser_role` — pause/unpause

## notes

- `depositrewards` expects velk approved to treasury
- rewards from aave are not automatically swapped into velk (manual step)
