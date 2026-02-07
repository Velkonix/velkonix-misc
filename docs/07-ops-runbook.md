# Ops Runbook

## Deployment Order (suggested)

1) Deploy **VELK** (set minter = deployer)
2) Deploy **xVELK** (set minter = deployer)
3) Deploy **RewardsDistributor** (xVELK address)
4) Deploy **Staking** (VELK, xVELK, lockDuration, penalty)
5) Set **xVELK minter = staking**
6) Set **VELK minter = staking** (optional, if staking mints/burns)
7) Whitelist xVELK transfers: staking + distributor + treasury
8) Set staking → `setRewardsDistributor(distributor)`
9) Set distributor → `setStaking(staking)`
10) Deploy **Treasury** (VELK, xVELK, distributor)
11) Set treasury rewards controller + assets (if used)

## Common Admin Tasks

- Pause/unpause (token + staking + distributor + treasury)
- Rotate minter (VELK/xVELK)
- Update rewards controller / assets

## Testing

```bash
forge test
```

## Upgrade Path

Contracts are **not** upgradeable. Redeploy if changes required.
