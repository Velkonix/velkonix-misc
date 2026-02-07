# velkonix-misc

misc repo for protocol-adjacent contracts (token/rewards/staking/etc) and deployment artifacts.

## structure

- `src/token/VELK.sol` — main token (mint/burn by minter role).
- `src/token/xVELK.sol` — escrow/staking token (transfer-restricted, whitelist).
- `src/staking/Staking.sol` — staking with lock + instant exit penalty.
- `src/staking/RewardsDistributor.sol` — reward accounting for xVELK deposits.
- `src/treasury/Treasury.sol` — collects aave rewards and forwards to distributor.

## deployments

- `deployments/arbitrum-sepolia/market-deployment.json` — aave v3 batch deploy (base config, no paraswap/ui/wrapped gateway).

## usage

```bash
forge build
forge test
forge fmt
```

## notes

- deployer: 0x1cfbCF19AaD4F9a362749643BA1d52bb9F28d417
- rpc: https://sepolia-rollup.arbitrum.io/rpc
- report source: velkonix-contracts/reports/1770409750-market-deployment.json
