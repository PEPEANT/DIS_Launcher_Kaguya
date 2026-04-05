# Phase 1 Implementation Checklist

Use Phase 1 to split launcher-owned UI from `Snack Rush` game-owned UI without changing ranking seasons, account linking, or admin systems.

## Purpose

- Keep the first refactor small enough to finish safely.
- Prevent launcher and game concerns from being mixed again during the split.
- Give the next coding pass a concrete checklist instead of a vague direction document.

## Phase 1 Goal

After Phase 1, the user flow should look like this:

```text
Launcher home
-> game select
-> Snack Rush entry
-> gameplay
-> result
-> return to launcher
```

The important boundary is:

- Launcher owns hub-style UI.
- `Snack Rush` owns game-specific entry, gameplay, result, and game ranking.
- Shared systems continue to serve both sides.

## Scope Lock

### In Scope

- Move `Snack Rush` guide or explanation copy into the `Snack Rush` entry screen.
- Move `Snack Rush` start CTA into the `Snack Rush` entry screen.
- Move the current `Snack Rush` visible ranking panel into the `Snack Rush` game flow.
- Separate launcher-screen logic from game-screen logic in the front-end orchestration layer.
- Keep auth, wallet, user identity, and ranking provider contracts reusable.

### Out Of Scope

- Adding a second real game.
- Rewriting ranking backend storage.
- Changing season mapping.
- Changing admin pages or payout flow.
- Building world, minimap, or UGC traversal.

## Decision Locks Before Coding

These should stay fixed during Phase 1.

- Shared chat stays launcher-owned for now.
- Shared shop stays launcher-owned for now.
- HujuPay is treated as wallet and economy data, not as a launcher ranking.
- The current visible `Snack Rush` ranking panel moves into the game module.
- Result flow stays attached to `Snack Rush`.
- `playerId -> uid` linking behavior must not change.

## Current File Starting Points

These are the current files most likely to be touched first.

- `public/index.html`
  - Currently contains intro, lobby, game, ranking, modals, and shared sections in one page shell.
- `public/game/app.js`
  - Current orchestration layer for intro, lobby, ranking, auth, chat, profile, mobile nav, and game start or return flow.
- `public/game/dom.js`
  - Current single element registry for launcher and game UI together.
- `public/game/ui.js`
  - Current screen toggles and UI rendering helpers.
- `public/game/logic.js`
  - Current gameplay logic plus ranking fetch or submit side effects.
- `public/game/state.js`
  - Current shared state object for gameplay and some lobby-visible fields.
- `public/game/ranking-service.js`
  - Current shared ranking provider boundary.

## Recommended Extraction Order

### 1. Freeze Naming

Choose the view names before moving code.

- `launcher-home`
- `snack-rush-entry`
- `snack-rush-play`
- `snack-rush-result`

Do not invent more screens during Phase 1 unless they remove real duplication.

### 2. Separate Screen Ownership

Define which UI belongs to launcher and which belongs to `Snack Rush`.

Launcher-owned:

- notices
- season summary
- game select
- shared chat
- shared shop
- account entry points

`Snack Rush`-owned:

- game guide
- game-specific ranking
- game start CTA
- gameplay
- result

### 3. Split Markup First

Before changing behavior, split the page structure in `public/index.html` into clearer containers.

Minimum target:

- launcher shell container
- `Snack Rush` entry container
- `Snack Rush` play container
- shared modals container

Do not redesign visuals in this pass unless separation requires minor layout fixes.

### 4. Split DOM Access

Refactor `public/game/dom.js` so launcher elements and `Snack Rush` elements are not registered as one flat blob forever.

Minimum target:

- launcher element group
- snack-rush element group
- shared modal element group

### 5. Extract Orchestration Out Of One File

Reduce the size of `public/game/app.js` by responsibility, not by arbitrary line count.

Suggested first split:

- launcher controller
- snack-rush entry controller
- snack-rush session controller
- shared modal or account controller

If the file split is too large for one pass, keep the modules small but move ownership boundaries first.

### 6. Move Ranking Display Ownership

The visible ranking panel used to support `Snack Rush` start flow should be controlled by the `Snack Rush` side.

Checklist:

- `Snack Rush` entry decides when its ranking is shown.
- Launcher home no longer acts like the pre-game ranking screen for `Snack Rush`.
- Ranking fetch calls still use existing provider contracts.
- Score submit behavior still updates the same ranking backend.

### 7. Keep Gameplay Logic Focused

`public/game/logic.js` should trend toward gameplay-only ownership.

Target direction for this phase:

- keep round reset, update loop, collision, finish flow
- keep score submission hook if needed for safe migration
- avoid adding more launcher or hub behavior into gameplay logic

### 8. Preserve Shared Systems

Do not duplicate these into game folders.

- auth
- wallet
- user identity
- ranking provider adapter
- account-linked reward flows

## Verification Checklist

Phase 1 is not done until all of these work.

- Launcher home renders without opening gameplay immediately.
- User can enter `Snack Rush` from launcher home.
- `Snack Rush` entry shows guide, ranking, and start CTA in the game-owned flow.
- Game starts and returns correctly.
- Result screen still appears and can return to launcher.
- Ranking still loads.
- Ranking still saves on score submit.
- Auth state still reflects correctly in launcher and game-owned UI.
- Wallet and profile-linked data still show correctly where expected.
- Mobile orientation and fullscreen flow still work during gameplay.

## Stop Conditions

Pause Phase 1 if any of these happen.

- A launcher-wide economy screen starts requiring a new competitive metric that is different from wallet data.
- Season mapping changes become necessary.
- Admin payout or reward logic needs to change.
- Shared auth or account linking breaks during module extraction.

If any stop condition happens, document it before continuing into Phase 2.

## Done Criteria

Phase 1 is complete when:

- Launcher and `Snack Rush` no longer share one ambiguous pre-game lobby role.
- `Snack Rush` entry owns game-specific ranking, guide, and start flow.
- Shared systems remain shared.
- The codebase is easier to extend with a second mini-game without expanding one monolithic controller again.

## Next Step After Phase 1

- Update `docs/system-structure.md` to reflect the actual post-split module layout.
- Decide whether launcher needs a dedicated economy or wallet section beyond basic home exposure.
- Start Phase 2 only after the `Snack Rush` split is stable.
