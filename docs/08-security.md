# Security Notes

## Transfer Restrictions

- xVELK transfers are blocked unless sender or receiver is whitelisted
- This prevents secondary market trading unless explicitly enabled

## Lock Behavior

- Every new stake updates `depositTimestamp` to **now**
- This extends lock for entire position

## Instant Exit Penalty

- Penalty minted as **xVELK** to rewards distributor
- User receives reduced **VELK** amount

## Pausable

- VELK, xVELK, staking, distributor, treasury are pausable

## Trust Assumptions

- Admin can change minters and whitelists
- Admin can pause/unpause

## Audit Checklist

- Check role assignments after deployment
- Verify whitelist is set before enabling transfers
- Verify rewards distributor set before instant exits
