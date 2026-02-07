# security notes

## transfer restrictions

- xvelk transfers are blocked unless sender or receiver is whitelisted
- this prevents secondary market trading unless explicitly enabled

## lock behavior

- every new stake updates `deposittimestamp` to **now**
- this extends lock for entire position

## instant exit penalty

- penalty minted as **xvelk** to rewards distributor
- user receives reduced **velk** amount

## pausable

- velk, xvelk, staking, distributor, treasury are pausable

## trust assumptions

- admin can change minters and whitelists
- admin can pause/unpause

## audit checklist

- check role assignments after deployment
- verify whitelist is set before enabling transfers
- verify rewards distributor set before instant exits
