# Aave Market Admin Scripts

Hardhat scripts for Aave V3 market management in `velkonix-misc`.

Implemented operations:
- add market (`initReserves` + `setAssetSources`)
- remove market (`dropReserve`)
- update price feed (`setAssetSources`)
- update market from archived JSON config (on-chain diff + sync)
- list current market info in readable console view

## Directory layout

- scripts: `scripts/aave-market-admin/`
- config archive (mandatory source for add/update): `scripts/aave-market-admin/configs/`

Recommended archive layout by network:
- `scripts/aave-market-admin/configs/arbitrum-sepolia/*.json`
- `scripts/aave-market-admin/configs/arbitrum/*.json`

## Core safety model

- `AAVE_DRY_RUN=true` runs full preflight + `staticCall` simulations, no state changes.
- Real execution requires explicit `AAVE_YES=true`.
- Add/update scripts read config files only from `scripts/aave-market-admin/configs`.
- Scripts validate addresses and verify post-state after transactions.

## Address resolution

Scripts resolve core contract addresses in this order:
1. ENV vars
2. deployment JSON (`deployments/arbitrum-sepolia/market-deployment.json` by default)
3. fallback through `PoolAddressesProvider` (if available)

Resolved contracts:
- Pool
- PoolConfigurator
- AaveOracle
- ACLManager
- ProtocolDataProvider

You can override deployment file:

```bash
AAVE_DEPLOYMENT_FILE=deployments/arbitrum-sepolia/market-deployment.json
```

## Config archive rules

Config path must always be inside:

```bash
scripts/aave-market-admin/configs
```

Example:

```bash
AAVE_CONFIG=arbitrum-sepolia/EXAMPLE_ASSET.json
```

External paths are rejected by design.

## JSON config format

Template is available at:
- `scripts/aave-market-admin/configs/arbitrum-sepolia/EXAMPLE_ASSET.json`

Expected structure:

```json
{
  "market": {
    "asset": "0x...",
    "priceFeed": "0x...",
    "initReserveInput": {
      "aTokenImpl": "0x...",
      "variableDebtTokenImpl": "0x...",
      "underlyingAsset": "0x...",
      "aTokenName": "Aave Arbitrum Sepolia TOKEN",
      "aTokenSymbol": "aArbSepTOKEN",
      "variableDebtTokenName": "Aave Arbitrum Sepolia Variable Debt TOKEN",
      "variableDebtTokenSymbol": "variableDebtArbSepTOKEN",
      "params": "0x",
      "interestRateData": "0x..."
    },
    "riskConfig": {
      "ltv": "7500",
      "liquidationThreshold": "8000",
      "liquidationBonus": "10500",
      "reserveFactor": "1000",
      "borrowCap": "1000000",
      "supplyCap": "2000000",
      "liquidationProtocolFee": "1000",
      "debtCeiling": "0",
      "borrowingEnabled": true,
      "flashloanEnabled": true,
      "active": true,
      "frozen": false
    }
  }
}
```

Notes:
- `add-market` requires full `initReserveInput`.
- `update-market` uses `riskConfig` and `priceFeed`; fields not present are ignored.
- `AAVE_ASSET` and `AAVE_PRICE_FEED` override JSON values.

## Command reference

### 1) Add market

Preconditions:
- asset is not listed
- signer has sufficient privileges (PoolAdmin / AssetListingAdmin + oracle permissions)
- `initReserveInput` is complete

Dry run:

```bash
AAVE_CONFIG=arbitrum-sepolia/EXAMPLE_ASSET.json AAVE_ASSET=0xAsset AAVE_PRICE_FEED=0xFeed AAVE_DRY_RUN=true npx hardhat run scripts/aave-market-admin/add-market.js --network arbitrum_sepolia
```

Execute:

```bash
AAVE_CONFIG=arbitrum-sepolia/EXAMPLE_ASSET.json AAVE_ASSET=0xAsset AAVE_PRICE_FEED=0xFeed AAVE_YES=true npx hardhat run scripts/aave-market-admin/add-market.js --network arbitrum_sepolia
```

What it does:
1. Sets oracle source (`setAssetSources`)
2. Initializes reserve (`initReserves`)
3. Verifies reserve appears in `getReservesList`
4. Verifies oracle source equals target feed

### 2) Remove market

Preconditions:
- reserve exists
- total aToken supply = 0
- total debt = 0

Dry run:

```bash
AAVE_ASSET=0xAsset AAVE_DRY_RUN=true npx hardhat run scripts/aave-market-admin/remove-market.js --network arbitrum_sepolia
```

Execute:

```bash
AAVE_ASSET=0xAsset AAVE_YES=true npx hardhat run scripts/aave-market-admin/remove-market.js --network arbitrum_sepolia
```

What it does:
1. Checks supply/debt is zero
2. Calls `dropReserve`
3. Verifies reserve is removed from `getReservesList`

### 3) Update price feed

Dry run:

```bash
AAVE_ASSET=0xAsset AAVE_PRICE_FEED=0xNewFeed AAVE_DRY_RUN=true npx hardhat run scripts/aave-market-admin/update-price-feed.js --network arbitrum_sepolia
```

Execute:

```bash
AAVE_ASSET=0xAsset AAVE_PRICE_FEED=0xNewFeed AAVE_YES=true npx hardhat run scripts/aave-market-admin/update-price-feed.js --network arbitrum_sepolia
```

What it does:
1. Compares current feed and target
2. Calls `setAssetSources` only if changed
3. Verifies source after tx

### 4) Update market from JSON (diff + sync)

This script compares current reserve settings with config values and applies only changed fields.

Dry run:

```bash
AAVE_CONFIG=arbitrum-sepolia/EXAMPLE_ASSET.json AAVE_ASSET=0xAsset AAVE_DRY_RUN=true npx hardhat run scripts/aave-market-admin/update-market.js --network arbitrum_sepolia
```

Execute:

```bash
AAVE_CONFIG=arbitrum-sepolia/EXAMPLE_ASSET.json AAVE_ASSET=0xAsset AAVE_YES=true npx hardhat run scripts/aave-market-admin/update-market.js --network arbitrum_sepolia
```

Fields currently synced (if present in config):
- priceFeed
- ltv
- liquidationThreshold
- liquidationBonus
- reserveFactor
- borrowCap
- supplyCap
- liquidationProtocolFee
- debtCeiling
- borrowingEnabled
- flashloanEnabled
- active
- frozen

If diff is empty, script exits without sending transactions.

### 5) List current markets (pretty console output)

Shows current reserves in:
- compact summary table
- optional per-market detailed blocks

Summary mode:

```bash
npx hardhat run scripts/aave-market-admin/list-markets.js --network arbitrum_sepolia
```

Detailed mode:

```bash
AAVE_VERBOSE=true npx hardhat run scripts/aave-market-admin/list-markets.js --network arbitrum_sepolia
```

Single asset:

```bash
AAVE_ASSET=0xAsset npx hardhat run scripts/aave-market-admin/list-markets.js --network arbitrum_sepolia
```

Export current on-chain markets to config JSONs (with overwrite):

```bash
AAVE_EXPORT_CONFIGS=true npx hardhat run scripts/aave-market-admin/list-markets.js --network arbitrum_sepolia
```

Scripts are env-only for compatibility with Hardhat 3 argument parsing.

Export behavior:
- writes files to `scripts/aave-market-admin/configs/<network-name>/`
- network folder uses `hardhat` network name with `_` replaced by `-`
- file naming: `<SYMBOL>-<asset-prefix>.json`
- existing files with same names are overwritten
- exported JSON is sync-oriented (`priceFeed` + `riskConfig`); `initReserveInput` is not auto-restored

Displayed fields include:
- status flags (`active`, `frozen`, `paused`, `borrowing`, `flashloan`)
- risk params (`ltv`, `liqThreshold`, `liqBonus`, `reserveFactor`)
- caps (`supplyCap`, `borrowCap`, `debtCeiling`, `liqProtocolFee`)
- oracle source, aToken/vDebt token, strategy, liquidity snapshots

## Running on fork / snapshot before real execution

Recommended pre-production process:

1. Export env:

```bash
export ARBITRUM_SEPOLIA_RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"
source /path/to/secret.env
```

2. Run dry-run against forked hardhat network:

```bash
AAVE_CONFIG=arbitrum-sepolia/EXAMPLE_ASSET.json AAVE_ASSET=0xAsset AAVE_DRY_RUN=true npx hardhat run scripts/aave-market-admin/update-market.js --network hardhat
```

3. If needed, impersonate admin inside your custom fork workflow and run with `AAVE_YES=true` on fork.

4. Validate post-state on fork:
- reserve presence/absence
- oracle source
- risk params (`ltv`, `caps`, `reserveFactor`, `liqProtocolFee`)

5. Only then execute on target real network.

## Production checklist

Before `AAVE_YES=true` on real network:
- config file is in archive folder and reviewed
- asset/feed addresses verified externally
- signer account and ACL roles verified
- dry-run passed with no reverts
- tx nonce and gas policy checked
- monitoring in place for tx receipts and final state

After execution:
- verify tx hashes
- verify post-state with read-only calls
- store final config + tx references in your ops log

## Troubleshooting

- `config must be inside .../configs`:
  - move file into archive folder, pass relative path from that root.
- `asset already listed` on add:
  - use `update-market` / `update-price-feed` instead.
- `dropReserve precheck failed`:
  - drain liquidity and debt first, then retry.
- role-related reverts:
  - signer lacks required ACL roles for target method.
