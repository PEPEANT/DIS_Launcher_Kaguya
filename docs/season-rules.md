# Season Rules

## Purpose

This project uses separate concepts for ranking seasons and gameplay content seasons. Keep them distinct.

## Current Mapping

### Ranking Seasons

- Internal season `2`
  - user-facing role: current live season label
  - status: current
  - period: `2026.04.01 - 2026.05.01`
  - Firestore collection: `rankings_season2`
- Internal season `1`
  - user-facing role: preseason archive label
  - status: archived
  - period: `2026.03.31`
  - Firestore collection: `rankings`

### Gameplay Content Seasons

- `s1`
  - current live gameplay snapshot
- `s2`
  - upcoming gameplay workspace

## Archived Content Rule

- `public/game/seasons/s1/*` is archived gameplay content.
- Do not overwrite `s1` when preparing season 2.
- If a bug must be fixed in the live game, make the smallest possible change and keep `s1` readable as a stable snapshot.

## Active Workspace Rule

All new gameplay work for the next season should go here:

- `public/game/seasons/s2/items.js`
- `public/game/seasons/s2/progression.js`
- `public/game/seasons/s2/assets.js`

## S2 Pre-Boss Rule

- Season 2 reserves a score-gated pre-boss phase for harder difficulty experiments.
  - Current s2 pre-boss trigger:
    - score threshold: `10000`
    - bonus time on trigger: `+60s`
    - background: `scene/c7.png`
    - music: `public/audio/ost02.mp3`
    - danger-item spawns use a balanced lane spread during the `10000+` phase to reduce one-side clustering while keeping edge pressure active
    - music-synced background cues after trigger:
    - `25s`: one screen flash
    - `28s`: one stronger screen flash
    - `35s`: particles + screen flash highlight
    - `46s`: particles + screen flash highlight
    - `58s`: one large-particle burst
    - `1m10s`: particles + screen flash highlight
    - `1m20s`: one screen flash + one large-particle burst
    - `1m30s - 1m40s`: sustained small-particle trail
  - moon on `scene/c7.png` should be visually masked once the pre-boss phase starts
- Keep this phase isolated to `s2` until the live season is explicitly switched.

Shared runtime wrappers should only route to the correct season content. They should not become a dump for season-specific logic.

## Season Change Checklist

Before changing live season behavior:

1. Create or confirm a Git snapshot of the current live state.
2. Back up Firestore data.
3. Update season metadata in:
   - `public/app-config.js`
   - `servers/app-server.mjs`
   - `public/game/config/runtime.js` if needed
4. Verify ranking labels and periods in the UI.
5. Verify gameplay content points to the intended `s1` or `s2` set.

## Rollback Guidance

If season 2 content is rejected and the game must return to the previous live gameplay:

- point `gameContent.currentSeasonId` back to `s1`
- keep archived ranking collections untouched unless the user explicitly wants ranking rollback too
- do not delete `s2`; keep it as a workspace for future revisions

## Backups Already Taken

Firestore backup completed on `2026-04-02` with collections copied into:

- `backup_2026_04_02_rankings`
- `backup_2026_04_02_rankings_season2`
- `backup_2026_04_02_users`
- `backup_2026_04_02_identityLinks`
- `backup_2026_04_02_presence`
- `backup_2026_04_02_presenceSessions`

Related local files:

- `scripts/firestore-backup.mjs`
- `data/firestore-backup-2026_04_02.json`
