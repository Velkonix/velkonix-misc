# Architecture diagram (text)

```
User
  | stake velk
  v
Staking ---------------------> xVELK (mint/burn)
  | instant exit penalty
  v
RewardsDistributor <--------- xVELK (penalty + rewards)
  ^ deposit/withdraw xvelk
  |
Treasury (optional)
  | claim aave rewards
  | deposit velk -> mint xvelk -> notify
```
