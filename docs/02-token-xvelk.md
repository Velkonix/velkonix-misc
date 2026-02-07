# Token: xvelk

**Contract:** `src/token/xVELK.sol`

## Purpose

Staking/escrow token. Minted when staking velk. Transfers are **restricted** by default; only whitelisted addresses can transfer.

## Roles

- `DEFAULT_ADMIN_ROLE` — admin, can set minter + whitelist
- `MINTER_ROLE` — can mint / burnFrom
- `PAUSER_ROLE` — can pause/unpause transfers

## Key behaviors

- **Transfer restriction**: if both `from` and `to` are not whitelisted, transfer reverts (`TransfersDisabled`)
- `SetTransferWhitelist(account, allowed)` managed by admin
- `Mint/burnFrom` require `MINTER_ROLE`

## Recommended whitelist

- Staking contract
- Rewards distributor
- Treasury (if it needs to move xvelk)

## Parameters

- Name/symbol: **xVELK / xVELK**
- Decimals: default ERC20 (18)
