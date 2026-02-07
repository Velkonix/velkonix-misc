# Token: xVELK

**Contract:** `src/token/xVELK.sol`

## Purpose

Staking/escrow token. Minted when staking VELK. Transfers are **restricted** by default; only whitelisted addresses can transfer.

## Roles

- `DEFAULT_ADMIN_ROLE` — admin, can set minter + whitelist
- `MINTER_ROLE` — can mint / burnFrom
- `PAUSER_ROLE` — can pause/unpause transfers

## Key Behaviors

- **Transfer restriction**: if both `from` and `to` are not whitelisted, transfer reverts (`TransfersDisabled`)
- `setTransferWhitelist(account, allowed)` managed by admin
- `mint/burnFrom` require `MINTER_ROLE`

## Recommended Whitelist

- Staking contract
- Rewards distributor
- Treasury (if it needs to move xVELK)

## Parameters

- Name/symbol: **xVELK / xVELK**
- Decimals: default ERC20 (18)
