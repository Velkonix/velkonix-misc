# token: velk

**contract:** `src/token/velk.sol`

## purpose

main protocol token. minting/burning is controlled by `minter_role`.

## roles

- `default_admin_role` — role admin, can change minter
- `minter_role` — can mint / burnfrom
- `pauser_role` — can pause/unpause transfers

## key behaviors

- `mint(to, amount)` requires `minter_role`
- `burnfrom(from, amount)` requires `minter_role`
- `pause/unpause` gates transfers via `_update`
- `setminter(newminter)` changes minter and role assignment

## parameters

- name/symbol: **velk / velk**
- decimals: default erc20 (18)

## security notes

- only minter can change supply
- pause is global for transfers
- admin can rotate minter
