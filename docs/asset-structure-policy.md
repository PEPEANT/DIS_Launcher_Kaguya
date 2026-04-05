# Asset Structure Policy

Use a stage-first asset layout: keep editable PNGs in `source`, ship the app from `processed`, and keep reference images in `docs` only.

## Purpose

- Keep launcher and multi-game expansion from depending on ad hoc PNG paths.
- Make it clear which files are safe to edit by hand and which files should be regenerated.
- Give `Snack Rush` and `cooking` separate homes before the second game starts using real assets.

## Current Rule

- Editable PNGs belong under `assets/source/`.
- Runtime-facing PNGs belong under `public/processed-assets/`.
- Documentation captures and planning references belong under `docs/reference/`.
- Game code should load processed assets, not raw source files.

## Recommended Layout

```text
assets/
  source/
    launcher/
      home/
      ui/
      promo/
    shared/
      icons/
      currency/
    games/
      snack-rush/
        backgrounds/
        characters/
        items/
        ui/
      cooking/
        backgrounds/
        characters/
        ingredients/
        ui/

public/
  processed-assets/
    launcher/
    shared/
    games/
      snack-rush/
      cooking/

docs/
  reference/
    ui/
```

## Processing Flow

1. Edit or add the original PNG in `assets/source/...`.
2. Run the processing script to create the runtime-ready output.
3. Publish only the processed path to the game config and runtime.
4. Keep docs and screenshots out of the runtime asset path.

## Constraints

- Do not move large PNG groups until the launcher and game-module refactor is stable.
- Do not make runtime code depend on both `processed-assets/` and `public/processed-assets/` long term.
- Remove filename aliases and irregular names before the first real `cooking` asset import.
- Treat `cooking` as a reserved folder now, even if it only holds placeholders at first.

## Current Inventory Snapshot

As of April 5, 2026, the first narrow `Snack Rush` source move is complete. The PNG set is now split between the structured Snack Rush source tree, a smaller set of launcher or shared root assets, processed outputs, mirrored public files, and docs references.

- Structured Snack Rush source: `assets/source/games/snack-rush/` 41 PNG plus 1 JPG
- Remaining root PNGs: `item/` 1 PNG, `scene/` 3 PNG, `special/` 3 PNG
- Processed outputs: `processed-assets/` 40 PNG
- Public processed outputs: `public/processed-assets/` 40 PNG
- Public mirrored raw asset: `public/special/intro_figure2.png` 1 PNG
- Docs reference captures: `docs/reference/ui/` 4 PNG

This means the repo currently has three practical layers:

- moved game-owned source assets in `assets/source/games/snack-rush/`
- launcher or shared source assets still in root folders
- duplicated processed PNGs in two output trees
- reference-only PNGs in docs

## Current Ownership State

Use this ownership split as the current baseline.

- `launcher`
  - `scene/Login_Main_kr.png`
  - `scene/Login_Main_jp.png`
  - `special/intro_figure2.png`
  - `special/thumbnail_raw.png`
  - `scene/c0.png` for admin or launcher-style shell usage
- `shared`
  - `item/Fuju.png`
- `games/snack-rush`
  - source files now live under `assets/source/games/snack-rush/`
  - includes `character/*.png`
  - includes `character/skins/skin_b/*.png`
  - includes `scene/c.png`, `scene/c2.png`, `scene/c3.png`, `scene/c4.png`, `scene/c7.png`, `scene/5.png`, `scene/6.png`
  - includes `special/intro_figure.png`
  - includes gameplay items under `item/*.png` except the shared coin
- `games/cooking`
  - no real PNG ownership yet
  - reserve folders only
- `docs/reference`
  - `docs/reference/ui/*.png`

## Known Anomalies

- `processed-assets/` and `public/processed-assets/` currently contain the same 40 PNG paths.
- `special/intro_figure2.png` is mirrored as `public/special/intro_figure2.png`, and the files are currently identical.
- `item/06.1.png`, `item/08_source.png`, `item/09_source.png`, and `item/special_01.1.png.png` have been normalized to direct file names.
- The old raw `item/08.png` was a duplicate of `item/Fuju.png`, so the duplicate has been removed and the real snack source now owns `item/08.png`.
- `public/game/config/assets.js` no longer needs alias normalization for `Fuju.png`, `z1.png`, `z2.png`, and `z3.png`.
- `scripts/chroma-key.mjs` expects `special/thumbnail_mobile.png`, but the repo currently only contains processed copies of that file.
- `special/01.png` currently has no clear code reference and should be treated as an unclassified asset until verified.

## Safe Next Move Order

Now that the Snack Rush-only move is done, use this order for any further asset cleanup.

1. Verify `special/01.png` and either classify it or archive it.
2. Decide where the real source for `thumbnail_mobile` should live.
3. Move launcher and intro assets into structured source folders.
4. Move true shared assets after launcher ownership is clear.
5. Keep `cooking` as folder scaffolding until the first real game art arrives.

## Next Steps

- Verify whether `special/01.png` should be archived, moved to launcher art, or deleted after visual review.
- Decide where `special/thumbnail_mobile.png` should live as a source asset instead of only as a processed output.
- Decide whether `processed-assets/` outside `public/` is a cache, a build artifact, or removable duplication.
- Move the remaining launcher and shared root assets into `assets/source/` in small batches.
- Update the asset manifest after the folder move, not before the launcher flow is stable.
