# Token: VELK

**Contract:** `src/token/VELK.sol`

## Purpose

Main protocol token. Minting/burning is controlled by `MINTER_ROLE`.

## Roles

- `DEFAULT_ADMIN_ROLE` — role admin, can change minter
- `MINTER_ROLE` — can mint / burnFrom
- `PAUSER_ROLE` — can pause/unpause transfers

## Key Behaviors

- `mint(to, amount)` requires `MINTER_ROLE`
- `burnFrom(from, amount)` requires `MINTER_ROLE`
- `pause/unpause` gates transfers via `_update`
- `setMinter(newMinter)` changes minter and role assignment

## Parameters

- Name/symbol: **VELK / VELK**
- Decimals: default ERC20 (18)

## Security Notes

- Only minter can change supply
- Pause is global for transfers
- Admin can rotate minter
