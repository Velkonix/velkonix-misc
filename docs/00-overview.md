# Overview

This repo holds protocol‑adjacent contracts for Velkonix:

- **VELK**: main protocol token
- **xVELK**: escrow / staking token
- **Staking**: lock + instant exit penalty, mints/burns xVELK
- **Rewards distributor**: accounting for xVELK rewards
- **Treasury**: collects Aave rewards and forwards to distributor

## High‑level Flow

1) User stakes **VELK** → staking mints **xVELK** 1:1
2) User can **exit** after lock → burn xVELK, receive VELK
3) **Instant exit** before lock → burn xVELK, user receives VELK minus penalty
4) Penalty is minted as xVELK to rewards distributor and shared to xVELK stakers
5) Treasury can **deposit rewards** (VELK) → mints xVELK to distributor and notifies

## Repo Structure

- `Src/token/VELK.sol`
- `Src/token/xVELK.sol`
- `Src/staking/Staking.sol`
- `Src/staking/RewardsDistributor.sol`
- `Src/treasury/Treasury.sol`
- `Docs/` — full documentation

## Deployment Artifacts

- `Deployments/arbitrum-sepolia/market-deployment.json` — Aave V3 batch deploy report
