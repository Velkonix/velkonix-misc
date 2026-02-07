# Velkonix-misc

Misc repo for protocol-adjacent contracts (token/rewards/staking/etc) and deployment artifacts.

## Docs

Start here: `docs/README.md`

## Structure

- `Src/token/VELK.sol` — main token (mint/burn by minter role).
- `Src/token/xVELK.sol` — escrow/staking token (transfer-restricted, whitelist).
- `Src/staking/Staking.sol` — staking with lock + instant exit penalty.
- `Src/staking/RewardsDistributor.sol` — reward accounting for xVELK deposits.
- `Src/treasury/Treasury.sol` — collects aave rewards and forwards to distributor.

## Deployments

- `Deployments/arbitrum-sepolia/market-deployment.json` — aave v3 batch deploy (base config, no paraswap/ui/wrapped gateway).

## Usage

```bash
forge build
forge test
forge fmt
```

## Notes

- Deployer: 0x1cfbCF19AaD4F9a362749643BA1d52bb9F28d417
- Rpc: https://sepolia-rollup.arbitrum.io/rpc
- Report source: velkonix-contracts/reports/1770409750-market-deployment.json
