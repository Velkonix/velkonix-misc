# Ops runbook

## Deployment order (suggested)

1) Deploy **VELK** (set minter = deployer)
2) Deploy **xVELK** (set minter = deployer)
3) Deploy **RewardsDistributor** (xvelk address)
4) Deploy **Staking** (velk, xvelk, lockDuration, penalty)
5) Set **xvelk minter = staking**
6) Set **velk minter = staking** (optional, if staking mints/burns)
7) Whitelist xvelk transfers: staking + distributor + treasury
8) Set staking → `setRewardsDistributor(distributor)`
9) Set distributor → `setStaking(staking)`
10) Deploy **Treasury** (velk, xvelk, distributor)
11) Set treasury rewards controller + assets (if used)

## Common admin tasks

- Pause/unpause (token + staking + distributor + treasury)
- Rotate minter (velk/xvelk)
- Update rewards controller / assets

## Testing

```bash
forge test
```

## Upgrade path

Contracts are **not** upgradeable. Redeploy if changes required.
