# Security notes

## Transfer restrictions

- Xvelk transfers are blocked unless sender or receiver is whitelisted
- This prevents secondary market trading unless explicitly enabled

## Lock behavior

- Every new stake updates `depositTimestamp` to **now**
- This extends lock for entire position

## Instant exit penalty

- Penalty minted as **xvelk** to rewards distributor
- User receives reduced **velk** amount

## Pausable

- Velk, xvelk, staking, distributor, treasury are pausable

## Trust assumptions

- Admin can change minters and whitelists
- Admin can pause/unpause

## Audit checklist

- Check role assignments after deployment
- Verify whitelist is set before enabling transfers
- Verify rewards distributor set before instant exits
