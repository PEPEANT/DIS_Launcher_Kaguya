# AGENTS.md

## Purpose

This project is actively edited by multiple AI agents. Follow these rules before making any change.

## Non-Negotiable Rules

- Do not modify `public/game/seasons/s1/*` unless the user explicitly asks for a season 1 hotfix.
- Implement all new gameplay content for the next update in `public/game/seasons/s2/*`.
- Do not delete, rename, or overwrite Firestore ranking data without an explicit user request.
- Do not remove the admin auth gate in `public/admin/*`.
- Do not do a full visual redesign unless the user explicitly asks for it.

## Current Season Model

- Ranking seasons and gameplay content seasons are intentionally separate.
- Current ranking season:
  - internal id: `2`
  - user-facing role: current live season label
  - Firestore collection: `rankings_season2`
- Archived ranking season:
  - internal id: `1`
  - user-facing role: preseason archive label
  - Firestore collection: `rankings`
- Current live gameplay content:
  - content season id: `s1`
- Upcoming gameplay workspace:
  - content season id: `s2`

Do not "simplify" this mapping unless the user explicitly asks for a migration.

## Protected Paths

- `public/game/seasons/s1/`
- `public/admin/`
- `public/app-config.js`
- `servers/app-server.mjs`
- `scripts/firestore-backup.mjs`
- `data/firestore-backup-2026_04_02.json`

## Workflow Rules

- Keep changes scoped. Do not mix gameplay balance, auth, admin, and visual redesign in one pass unless the user asks for it.
- Prefer editing season-specific files over shared config wrappers.
- When changing season metadata, keep display labels, periods, and collection mappings consistent across:
  - `public/app-config.js`
  - `servers/app-server.mjs`
  - `public/game/config/runtime.js`
- When changing player identity or profile flows, preserve `playerId -> uid` linking.
- If you add a new seasonal system, document it in `docs/season-rules.md`.

## Design Guardrails

- Follow `docs/design-guardrails.md`.
- Keep the existing warm cream/orange visual language unless the user asks for a new theme.
- Do not reintroduce large guest-only account cards on the lobby.

## Safety Checks Before Season Work

- Confirm a Git snapshot exists for the archived season.
- Confirm Firestore backup exists before changing season structure or live collections.
- If unsure, stop and ask instead of modifying archived content.
