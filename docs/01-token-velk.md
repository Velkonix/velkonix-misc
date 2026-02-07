# token: velk

**contract:** `src/token/VELK.sol`

## purpose

main protocol token. minting/burning is controlled by `MINTER_ROLE`.

## roles

- `DEFAULT_ADMIN_ROLE` — role admin, can change minter
- `MINTER_ROLE` — can mint / burnFrom
- `PAUSER_ROLE` — can pause/unpause transfers

## key behaviors

- `mint(to, amount)` requires `MINTER_ROLE`
- `burnFrom(from, amount)` requires `MINTER_ROLE`
- `pause/unpause` gates transfers via `_update`
- `setMinter(newMinter)` changes minter and role assignment

## parameters

- name/symbol: **VELK / VELK**
- decimals: default ERC20 (18)

## security notes

- only minter can change supply
- pause is global for transfers
- admin can rotate minter
