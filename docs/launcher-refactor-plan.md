# Launcher Refactor Plan

Split the current single-flow site into `launcher`, `games`, and `shared`, and move `Snack Rush` pre-game UX into the game module before expanding to multiple mini-games.

## Purpose

- Reduce the amount of launcher-style UI currently mixed into one lobby flow.
- Make `Snack Rush` easier to maintain as an independent game module.
- Prepare the project to add more mini-games without reworking auth, wallet, and user systems each time.
- Create a clean first step toward a later world or UGC-style hub structure.

## Current Situation

As of April 4, 2026, the project already has visual separation between intro, lobby, and gameplay, but the user flow is still effectively a single product funnel.

Current flow:

```text
Intro / nickname
-> notice / season context
-> ranking check
-> game start
-> gameplay
-> result
```

Current pain points:

- The lobby is carrying too many roles at once: notice, season context, ranking, chat, account, shop, and game entry.
- `Snack Rush` pre-game information is not clearly separated from launcher-like UI.
- Adding a second mini-game would force more logic into the same orchestration layer unless the split happens first.

## Target Structure

This is the target direction, not the current implementation.

```text
launcher/
|-- hub-home/         # main home, notices, season summary, game selection
|-- economy/          # HujuPay balance, reward guide, and wallet-facing UI
|-- lobby/            # launcher-level social or entry space
|-- chat/             # shared chat entry points
|-- shop/             # shared shop entry points
`-- notices/          # event and season announcements

games/
|-- snack-rush/
|   |-- entry/         # game-specific intro, guide, start CTA, game ranking
|   |-- gameplay/      # active play
|   |-- results/       # result and return flow
|   `-- ranking/       # Snack Rush leaderboard views
`-- cooking/
    |-- entry/
    |-- gameplay/
    |-- results/
    `-- ranking/

shared/
|-- auth/             # login and auth
|-- wallet/           # HujuPay
|-- user/             # user data and identity
|-- ranking-core/     # shared ranking API contracts and storage helpers
`-- ui/               # common modal, layout, and utility UI
```

## Ranking And Economy Model

The refactor should keep economy and ranking as separate concepts.

- HujuPay is wallet and economy data, not a leaderboard metric.
- Game ranking is a per-game leaderboard shown inside each game flow, such as `Snack Rush`.
- Launcher can show wallet, reward, and season information without presenting HujuPay as a rank.
- If a cross-game competitive feature is needed later, it should use a separate metric instead of wallet balance.

This distinction matters because multiple mini-games will eventually need their own ranking context even when they share account and wallet systems.

## Current Economy Rule

As of April 5, 2026, the working product rule is:

- Game score is for game-specific fun and leaderboard competition only.
- HujuPay is event, operator, or promotional wallet currency.
- Launcher should not treat HujuPay as a competitive ladder.
- If the platform later needs cross-game competition, add a separate season-point style metric instead of reusing score or HujuPay.

Operationally, this also means admin tools should move toward event messaging, operator grants, and exception handling instead of acting like the main payout path for everyday gameplay.

## Current Admin Operation Rule

As of April 5, 2026, the current admin direction is:

- Daily operations should prefer lobby notices, targeted inbox messages, and operator or event HujuPay grants.
- Manual wallet adjustment is an event or exception tool, not a gameplay-score payout path.
- The season payout center is now treated as a legacy settlement and recovery tool for older seasons or missing payouts.
- Operator-facing labels should present that page as a legacy settlement center and present wallet adjustment as an operator/event grant or correction flow.
- Game score and game ranking should stay inside each game flow and should not automatically create wallet rewards.

## Planned Flow

### Current

```text
Single game site
-> lobby carries ranking, guide, chat, shop, and start
-> gameplay
-> result
```

### Phase 1

```text
Launcher home
-> game select
-> Snack Rush entry screen
-> gameplay
-> result
-> return to launcher
```

### Phase 2

```text
Launcher home
-> multiple games
-> each game owns entry, play, result, and game ranking
-> shared auth, wallet, and user systems stay outside game modules
```

### Phase 3

```text
Launcher hub
-> world or minimap style navigation
-> independent spaces and mini-games
-> early UGC-ready content layout
```

## First Implementation Scope

This document defines the recommended first pass.

- Move `Snack Rush` ranking display into the `Snack Rush` game flow.
- Move `Snack Rush` guide or explanation copy into the game entry screen.
- Move `Snack Rush` start CTA into the game entry screen.
- Keep auth, wallet, user data, and ranking provider contracts in shared areas.
- Do not treat HujuPay as a central ranking in launcher UI.
- Keep launcher-level chat, shop, and notices outside the game module.
- Reserve a place for other games such as `cooking`, but do not implement them yet.

## Out Of Scope For The First Pass

- Rewriting the ranking backend.
- Migrating season data.
- Changing admin tools.
- Reworking archived season content.
- Implementing world traversal or minimap systems.

## Risks And Constraints

- The current app orchestration is still broad, so file-level separation should happen before behavior-level expansion.
- Ranking seasons and gameplay content seasons are intentionally separate and should stay separate during this refactor.
- The existing `playerId -> uid` link must be preserved.
- Shared systems should not be copied into each game module.

## Recommended Next Docs

- Update `docs/system-structure.md` after the first real file moves happen.
- Add a module ownership doc once `launcher`, `games`, and `shared` directories or modules start to exist.
- Add an economy ownership note if wallet UI and payout history become a larger launcher feature.
