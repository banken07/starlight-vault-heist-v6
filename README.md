# Starlight Vault — Best Heist Game

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/banken07/starlight-vault-heist-v6/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/banken07/starlight-vault-heist-v6/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

Steal the **Comet Diamond** from a midnight observatory in this original
top-down heist game. Three rooms — the Map Room, the Telescope Dome, the
Star Vault — each with its own patrols, routes and risks.

- **Guards MARA, JULES and G** patrol with amber vision cones; get seen and
  suspicion rises, then they chase (chase 2.95 vs your run 2.6 — being seen
  is a real problem).
- **Brass-eye cameras** sweep red cones. One cone per area; the vault
  camera's cone stops short of the glass case, so the diamond stays readable.
- **Paid tools, bought with stolen coins:** lockpick 10 (opens the glass
  case, reseals in 10s), smoke bomb 15 (blinds cones 6s), lens cap 8
  (blinds the nearest camera 8s). Small loot is worth 5 coins each.
- **Three routes per room:** the main floor, the balcony, and the vent.
- **Alarm meter:** CALM → UNEASY → HUNTED → ALARM, with a live timer,
  spotted count, star map and legend in the sidebar.
- **Getaway:** grab the diamond, reach the balcony anchor and ride the
  zipline out — or get caught trying.

## Play

```sh
node serve.ts
# open http://localhost:8080
```

Move with WASD / arrows, sneak with Shift, act with E, tools with 1 / 2 / 3,
click the floor to walk there. M mutes, R restarts.

Screenshots are real renders of the game's own code (`?shot=1..4`, plus
`?shot=5` caught and `?shot=6` win in `verify-shots/`).

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and
writes `dossier.json` with `buildDossier` from `vendor/makefun-game.ts`.
Node standard library only — no network, no external assets.

Built for the [make.fun best-heist-game-20261122-0559](https://make.fun/c/best-heist-game-20261122-0559) bounty.
