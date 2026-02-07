# e2e test plan

## цель

проверить полный поток:

1) user1 deposit
2) user2 borrow
3) сбор protocol fees с collector
4) mock‑конвертация fees → velk → xvelk rewards
5) staking xvelk и клейм
6) rewards за deposit/borrow в xvelk и клейм

## контракты

- velk, xvelk, staking, rewards distributor, treasury, fee router
- моки: mockerc20, mockatoken, mockcollector, mockpool, mockrewardscontroller

## сценарий (foundry)

- деплой core контрактов
- деплой моков
- user1/user2 получают fee токен
- mockpool.mintToTreasury(...) → fees в collector
- feeRouter.claimAll() → fees на treasury
- mock‑swap: mint velk → treasury.depositRewards() → xvelk rewards
- user1/user2 stake xvelk и claim rewards
- mockrewardscontroller accrue rewards для user1/user2
- user1/user2 claim xvelk rewards за deposit/borrow

## запуск

```bash
forge test --match-path test/E2E.t.sol
```

## примечания

- реальные swap‑скрипты будут отдельными (dex), здесь только mock.
- интеграция с реальным aave стэком может быть вынесена в отдельный интеграционный набор.
