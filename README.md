# velkonix-misc

misc repo for protocol‑adjacent contracts (token/rewards/staking/etc) and deployment artifacts.

## docs

start here: `docs/README.md`

## structure

- `src/token/VELK.sol` — main token (mint/burn by minter role).
- `src/token/xVELK.sol` — escrow/staking token (transfer-restricted, whitelist).
- `src/staking/Staking.sol` — staking with lock + instant exit penalty.
- `src/staking/RewardsDistributor.sol` — reward accounting for xVELK deposits.
- `src/treasury/Treasury.sol` — collects Aave rewards and forwards to distributor.
- `src/treasury/FeeRouter.sol` — claims protocol fees from collector to a single receiver.

## deployments

- `deployments/arbitrum-sepolia/market-deployment.json` — aave v3 batch deploy (base config, no paraswap/ui/wrapped gateway).

## usage

```bash
forge build
forge test
forge fmt
```

## deploy

- script: `script/DeployAll.s.sol`
- instructions: `script/DeployAll.md`

## notes

- deployer: 0x1cfbCF19AaD4F9a362749643BA1d52bb9F28d417
- rpc: https://sepolia-rollup.arbitrum.io/rpc
- report source: velkonix-contracts/reports/1770409750-market-deployment.json
