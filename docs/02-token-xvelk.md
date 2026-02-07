# token: xvelk

**contract:** `src/token/xvelk.sol`

## purpose

staking/escrow token. minted when staking velk. transfers are **restricted** by default; only whitelisted addresses can transfer.

## roles

- `default_admin_role` — admin, can set minter + whitelist
- `minter_role` — can mint / burnfrom
- `pauser_role` — can pause/unpause transfers

## key behaviors

- **transfer restriction**: if both `from` and `to` are not whitelisted, transfer reverts (`transfersdisabled`)
- `settransferwhitelist(account, allowed)` managed by admin
- `mint/burnfrom` require `minter_role`

## recommended whitelist

- staking contract
- rewards distributor
- treasury (if it needs to move xvelk)

## parameters

- name/symbol: **xvelk / xvelk**
- decimals: default erc20 (18)
