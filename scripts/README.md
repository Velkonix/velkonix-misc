# hardhat scripts

## env

```bash
export ARBITRUM_SEPOLIA_RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"
source /home/clawd/secret.env
```

## deploy

```bash
npx hardhat run scripts/deploy-all.js --network arbitrum_sepolia
# or
npm run hh:deploy:arb-sepolia
```

By default deployment addresses are saved to:
`deployments/arbitrum-sepolia/velkonix-misc-deployment.json`

Optional custom path:

```bash
export DEPLOYMENT_PATH="deployments/arbitrum-sepolia/my-deployment.json"
```

## deploy mock chainlink price feed

```bash
# local hardhat network (defaults: decimals=8, description="MOCK / USD", initial-answer=100000000)
npx hardhat run scripts/deploy-mock-price-feed.js

# arbitrum sepolia
npx hardhat run scripts/deploy-mock-price-feed.js --network arbitrum_sepolia

# with custom params
npx hardhat run scripts/deploy-mock-price-feed.js --network arbitrum_sepolia --decimals 8 --description "WBTC / USD" --initial-answer 9650000000000
```

Environment variable alternatives:

```bash
export MOCK_PRICE_FEED_DECIMALS="8"
export MOCK_PRICE_FEED_DESCRIPTION="WBTC / USD"
export MOCK_PRICE_FEED_INITIAL_ANSWER="9650000000000"
```

## mint test token

```bash
# amount in whole tokens (uses token decimals())
npm run hh:mint:arb-sepolia -- --token 0xToken --to 0xRecipient --amount 30

# raw amount in wei/base units
npm run hh:mint:arb-sepolia -- --token 0xToken --to 0xRecipient --raw-amount 30000000000000000000
```

## fee claim

```bash
export FEE_ROUTER="0x..."
export FEE_TOKENS="0xTokenA,0xTokenB"

npx hardhat run scripts/fee-claim.js --network arbitrum_sepolia
```

## mock fee -> xvelk rewards

```bash
export VELK="0x..."
export TREASURY="0x..."
export AMOUNT="1000000000000000000"

npx hardhat run scripts/mock-fee-to-xvelk.js --network arbitrum_sepolia
```

## mock fee claim + convert

```bash
export FEE_ROUTER="0x..."
export FEE_TOKENS="0xTokenA,0xTokenB"
export VELK="0x..."
export TREASURY="0x..."
export AMOUNT="1000000000000000000"

npx hardhat run scripts/mock-fee-claim-and-convert.js --network arbitrum_sepolia
```

## staking reward notify

```bash
export REWARDS_DISTRIBUTOR="0x..."
export XVELK="0x..."
export AMOUNT="1000000000000000000"

npx hardhat run scripts/staking-reward-notify.js --network arbitrum_sepolia
```

## e2e onchain flow

```bash
export POOL="0x..."
export COLLECTOR="0x..."
export FEE_ROUTER="0x..."
export FEE_TOKENS="0xTokenA,0xTokenB"
export VELK="0x..."
export XVELK="0x..."
export TREASURY="0x..."
export STAKING="0x..."
export REWARDS_DISTRIBUTOR="0x..."
export REWARDS_CONTROLLER="0x..."
export USER1="0x..."
export USER2="0x..."
export ATOKEN="0x..."        # optional
export DEBT_TOKEN="0x..."     # optional
export AMOUNT="1000000000000000000"
export REWARD_AMOUNT="1000000000000000000"

npx hardhat run scripts/e2e-onchain.js --network arbitrum_sepolia
```

## aave market admin

Detailed docs:
`scripts/aave-market-admin/README.md`

Examples:

```bash
# add market (dry-run)
AAVE_CONFIG=arbitrum-sepolia/EXAMPLE_ASSET.json AAVE_ASSET=0xAsset AAVE_PRICE_FEED=0xFeed AAVE_DRY_RUN=true npm run hh:aave:add-market:arb-sepolia

# update market from config (execute)
AAVE_CONFIG=arbitrum-sepolia/EXAMPLE_ASSET.json AAVE_ASSET=0xAsset AAVE_YES=true npm run hh:aave:update-market:arb-sepolia

# update only price feed
AAVE_ASSET=0xAsset AAVE_PRICE_FEED=0xNewFeed AAVE_DRY_RUN=true npm run hh:aave:update-price-feed:arb-sepolia

# remove market
AAVE_ASSET=0xAsset AAVE_DRY_RUN=true npm run hh:aave:remove-market:arb-sepolia

# list markets
npm run hh:aave:list-markets:arb-sepolia
AAVE_VERBOSE=true npm run hh:aave:list-markets:arb-sepolia
AAVE_EXPORT_CONFIGS=true npm run hh:aave:list-markets:arb-sepolia
```
