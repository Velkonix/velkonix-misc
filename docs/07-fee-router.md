# fee router

## цель

централизовать сбор комиссий aave‑контрактов на один адрес и дать возможность клейма одним вызовом с whitelisted адреса.

## контракт

**FeeRouter** — промежуточный контракт, который дергает `Collector.transfer(...)` и переводит все накопленные комиссии на `treasuryReceiver`.

## как работает

1) комиссии aave копятся на `Collector` (treasury) через `mintToTreasury` в aToken.
2) whitelisted адрес вызывает `claimAll()` или `claim(tokens)` на FeeRouter.
3) FeeRouter вызывает `Collector.transfer(...)` для каждого токена и отправляет их в `treasuryReceiver` одним транзакционным вызовом.

## роли

- `DEFAULT_ADMIN_ROLE` — управление адресами, токенами и ролями.
- `CLAIMER_ROLE` — адреса, которым разрешено делать `claim*`.
- `PAUSER_ROLE` — пауза функций клейма.

## настройки

- `collector` — адрес Treasury/Collector в aave v3.
- `treasuryReceiver` — конечный адрес для получения комиссий.
- `tokens` — список токенов для массового клейма.

## функции

- `setCollector(address)` — обновить адрес Collector.
- `setTreasuryReceiver(address)` — обновить получателя комиссий.
- `setTokens(address[])` — задать список токенов для `claimAll`.
- `claimAll()` — клейм по всему списку.
- `claim(address[])` — клейм по заданному списку.

## примечания

- для успешного клейма FeeRouter должен иметь `FUNDS_ADMIN_ROLE` в Collector.
- `Collector.transfer(ETH_MOCK_ADDRESS, ...)` используется для вывода нативного ETH.
- клейм безопасен, если Collector хранит комиссии в разных токенах.
