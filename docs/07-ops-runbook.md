# ops runbook

## deployment order (suggested)

1) deploy **velk** (set minter = deployer)
2) deploy **xvelk** (set minter = deployer)
3) deploy **rewardsdistributor** (xvelk address)
4) deploy **staking** (velk, xvelk, lockduration, penalty)
5) set **xvelk minter = staking**
6) set **velk minter = staking** (optional, if staking mints/burns)
7) whitelist xvelk transfers: staking + distributor + treasury
8) set staking → `setrewardsdistributor(distributor)`
9) set distributor → `setstaking(staking)`
10) deploy **treasury** (velk, xvelk, distributor)
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
