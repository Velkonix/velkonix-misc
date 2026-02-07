# token: xvelk

**contract:** `src/token/xVELK.sol`

## purpose

staking/escrow token. minted when staking velk. transfers are **restricted** by default; only whitelisted addresses can transfer.

## roles

- `DEFAULT_ADMIN_ROLE` — admin, can set minter + whitelist
- `MINTER_ROLE` — can mint / burnFrom
- `PAUSER_ROLE` — can pause/unpause transfers

## key behaviors

- **transfer restriction**: if both `from` and `to` are not whitelisted, transfer reverts (`TransfersDisabled`)
- `setTransferWhitelist(account, allowed)` managed by admin
- `mint/burnFrom` require `MINTER_ROLE`

## recommended whitelist

- staking contract
- rewards distributor
- treasury (if it needs to move xvelk)

## parameters

- name/symbol: **xVELK / xVELK**
- decimals: default ERC20 (18)
