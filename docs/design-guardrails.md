# Design Guardrails

## Goal

Keep the game's UI consistent even when multiple AI agents are contributing.

## Visual Direction

- Preserve the current warm, soft, light theme.
- Primary accents should stay in the orange family unless the user asks for a new palette.
- Favor rounded cards, gentle shadows, and readable spacing over sharp or overly futuristic styling.
- Avoid dark-mode redesigns, purple-heavy palettes, or neon visual language unless explicitly requested.

## Layout Rules

- Do not move core gameplay controls without a user request.
- Keep lobby actions simple:
  - guest play stays lightweight
  - login stays available without taking over the screen
- Keep ranking UX compact:
  - summary first
  - detail on demand
- Avoid adding extra explanation blocks that make the lobby feel heavier.

## Typography And Copy

- Use short Korean-first UI copy for player-facing text.
- Prefer familiar, plain labels for login, signup, password help, and profile actions.
- Avoid stacking multiple helper sentences that say similar things.
- If a message exists only to reassure the player, keep it to one line.

## Seasonal UI Rules

- The preseason label should read as archive/history.
- The current live season label should read as active content.
- Do not visually present archived seasons as if they are still live.
- Preserve the distinction between archived rankings and the current profile nickname.

## Things Agents Must Not Change Casually

- Full theme palette
- Main lobby structure
- Ranking modal interaction model
- Auth flow placement
- Admin dashboard styling direction

## Review Checklist

Before finalizing UI work, confirm:

- desktop and mobile both still load cleanly
- primary buttons remain easy to find
- season labels are still correct
- guest flow still feels faster than login flow
- new visuals match the existing game tone
