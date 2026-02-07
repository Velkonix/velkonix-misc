# Overview

This repo holds protocol‑adjacent contracts for velkonix:

- **Velk**: main protocol token
- **Xvelk**: escrow / staking token
- **Staking**: lock + instant exit penalty, mints/burns xvelk
- **Rewards distributor**: accounting for xvelk rewards
- **Treasury**: collects aave rewards and forwards to distributor

## High‑level flow

1) User stakes **velk** → staking mints **xvelk** 1:1
2) User can **exit** after lock → burn xvelk, receive velk
3) **Instant exit** before lock → burn xvelk, user receives velk minus penalty
4) Penalty is minted as xvelk to rewards distributor and shared to xvelk stakers
5) Treasury can **deposit rewards** (velk) → mints xvelk to distributor and notifies

## Repo structure

- `Src/token/VELK.sol`
- `Src/token/xVELK.sol`
- `Src/staking/Staking.sol`
- `Src/staking/RewardsDistributor.sol`
- `Src/treasury/Treasury.sol`
- `Docs/` — full documentation

## Deployment artifacts

- `Deployments/arbitrum-sepolia/market-deployment.json` — aave v3 batch deploy report
