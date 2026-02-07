# velkonix-misc

misc repo for protocol-adjacent contracts (token/rewards/staking/etc) and deployment artifacts.

## docs

start here: `docs/readme.md`

## structure

- `src/token/velk.sol` — main token (mint/burn by minter role).
- `src/token/xvelk.sol` — escrow/staking token (transfer-restricted, whitelist).
- `src/staking/staking.sol` — staking with lock + instant exit penalty.
- `src/staking/rewardsdistributor.sol` — reward accounting for xvelk deposits.
- `src/treasury/treasury.sol` — collects aave rewards and forwards to distributor.

## deployments

- `deployments/arbitrum-sepolia/market-deployment.json` — aave v3 batch deploy (base config, no paraswap/ui/wrapped gateway).

## usage

```bash
forge build
forge test
forge fmt
```

## notes

- deployer: 0x1cfbcf19aad4f9a362749643ba1d52bb9f28d417
- rpc: https://sepolia-rollup.arbitrum.io/rpc
- report source: velkonix-contracts/reports/1770409750-market-deployment.json
