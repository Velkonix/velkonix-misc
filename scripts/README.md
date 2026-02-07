# hardhat scripts

## env

```bash
export ARBITRUM_SEPOLIA_RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"
source /home/clawd/secret.env
```

## deploy

```bash
npx hardhat run scripts/deploy-all.js --network arbitrum_sepolia
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
