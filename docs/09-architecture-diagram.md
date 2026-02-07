# Architecture Diagram (text)

```
User
  | stake VELK
  v
Staking ---------------------> xVELK (mint/burn)
  | instant exit penalty
  v
RewardsDistributor <--------- xVELK (penalty + rewards)
  ^ deposit/withdraw xVELK
  |
Treasury (optional)
  | claim Aave rewards
  | deposit VELK -> mint xVELK -> notify
```
