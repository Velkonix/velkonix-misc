# rewards distributor

**contract:** `src/staking/rewardsdistributor.sol`

## purpose

tracks rewards for xvelk depositors. rewards are distributed in **xvelk**.

## model

- users deposit xvelk
- rewards are notified in xvelk
- accounting uses `accrewardpershare`

## functions

- `setstaking(address)` — admin; only staking can call `notifyreward`
- `deposit(amount)` — user deposits xvelk
- `withdraw(amount)` — user withdraws xvelk
- `claim()` — transfers pending xvelk
- `notifyreward(amount)` — only staking, adds to rewards

## accounting

- `accrewardpershare` scaled by 1e18
- `pendingrewards` holds rewards when `totaldeposits == 0`
- `_distributepending()` moves pending into accrewardpershare once deposits exist

## role model

- `default_admin_role` — can set staking and pause
- `pauser_role` — pause/unpause

## notes

- rewards are **xvelk**: users stay in escrow token unless you add a swap/redemption layer
