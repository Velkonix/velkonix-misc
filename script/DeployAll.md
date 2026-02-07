# deploy all (foundry)

## env

```bash
export ARBITRUM_SEPOLIA_RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"
source /home/clawd/secret.env

# optional overrides
export VELK_MINTER="0x..."                 # default: deployer
export STAKING_LOCK_DURATION=$((90*24*60*60))
export STAKING_PENALTY_BPS=3000

# fee router (optional)
export FEE_COLLECTOR="0x..."               # aave collector address
export FEE_RECEIVER="0x..."                # final receiver of fees
export FEE_CLAIMER="0x..."                 # whitelisted claimer

export DEPLOYMENT_PATH="deployments/arbitrum-sepolia/velkonix-misc-deployment.json"
```

## deploy

```bash
forge script script/DeployAll.s.sol:DeployAll \
  --rpc-url $ARBITRUM_SEPOLIA_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast -vvvv
```

## output

- writes deployment json to `DEPLOYMENT_PATH`
- sequence:
  1) VELK
  2) xVELK
  3) RewardsDistributor
  4) Staking
  5) Treasury
  6) FeeRouter (only if FEE_COLLECTOR + FEE_RECEIVER set)
  7) post‑config (minter/whitelist/rewards wiring)
