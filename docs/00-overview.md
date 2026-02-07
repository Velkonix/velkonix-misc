# overview

this repo holds protocol‑adjacent contracts for velkonix:

- **velk**: main protocol token
- **xvelk**: escrow / staking token
- **staking**: lock + instant exit penalty, mints/burns xvelk
- **rewards distributor**: accounting for xvelk rewards
- **treasury**: collects aave rewards and forwards to distributor

## high‑level flow

1) user stakes **velk** → staking mints **xvelk** 1:1
2) user can **exit** after lock → burn xvelk, receive velk
3) **instant exit** before lock → burn xvelk, user receives velk minus penalty
4) penalty is minted as xvelk to rewards distributor and shared to xvelk stakers
5) treasury can **deposit rewards** (velk) → mints xvelk to distributor and notifies

## repo structure

- `src/token/velk.sol`
- `src/token/xvelk.sol`
- `src/staking/staking.sol`
- `src/staking/rewardsdistributor.sol`
- `src/treasury/treasury.sol`
- `docs/` — full documentation

## deployment artifacts

- `deployments/arbitrum-sepolia/market-deployment.json` — aave v3 batch deploy report
