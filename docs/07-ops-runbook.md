# ops runbook

## deployment order (suggested)

1) deploy **VELK** (set minter = deployer)
2) deploy **xVELK** (set minter = deployer)
3) deploy **RewardsDistributor** (xvelk address)
4) deploy **Staking** (velk, xvelk, lockDuration, penalty)
5) set **xvelk minter = staking**
6) set **velk minter = staking** (optional, if staking mints/burns)
7) whitelist xvelk transfers: staking + distributor + treasury
8) set staking → `setRewardsDistributor(distributor)`
9) set distributor → `setStaking(staking)`
10) deploy **Treasury** (velk, xvelk, distributor)
11) set treasury rewards controller + assets (if used)

## common admin tasks

- pause/unpause (token + staking + distributor + treasury)
- rotate minter (velk/xvelk)
- update rewards controller / assets

## testing

```bash
forge test
```

## upgrade path

contracts are **not** upgradeable. redeploy if changes required.
