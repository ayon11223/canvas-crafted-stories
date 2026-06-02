## Goal

Make the landing page (`src/routes/index.tsx`) feel **immersive and experiential** — the kind of page where the background is doing the talking and the UI almost disappears. Not a copy of the reference; just the same *energy* (cinematic, dark, motion-led, sparse).

Frontend only. One file. No new routes or backend changes.

## Concept

Theme of the product is teaching / canvas / craft → so the hero metaphor is **"ideas becoming structure"**: a slow constellation of soft glowing nodes drifting in dark space, connecting to each other with thin lines as the cursor moves near them. It reacts to the viewer instead of just playing a loop — that's what makes it *experiential* rather than just animated.

Fallback when `prefers-reduced-motion`: static starfield, no connections, no parallax.

## What's on screen

```text
(deep navy-black canvas, drifting node web reacts to cursor)

   canvas.craft                          projects   sign in

         ─── a teaching canvas ───

         Where lessons
         take shape.

         A quiet workspace for building curricula,
         slides and ideas — together.

         [ Open a canvas → ]   browse projects

                                              v0.1 · est. 2026
```

One viewport. No scroll. No feature grid, no logos row, no "trusted by".

## Visual direction

- Background: near-black with a faint cool→warm vertical gradient (top `#06070d`, bottom `#0d0a14`). Subtle vignette.
- Foreground motion: ~120 soft nodes drifting at low velocity, wrapping at edges. Nodes within ~140px of cursor draw thin connecting lines whose opacity falls off with distance. Cursor itself attracts nearby nodes slightly (parallax / magnet). Pointer-events stay off the canvas.
- Typography: existing fonts. Headline `clamp(2.5rem, 8vw, 7rem)`, tight leading, mixed weight — "Where lessons" in `foreground`, "take shape." in muted/italic for the two-tone feel. Eyebrow + meta lines in tiny uppercase tracked-out caps.
- Entrance: headline + subhead use existing `animate-fade-in` utility (staggered via inline `animationDelay`).
- Color: page-scoped only — set on the wrapper, doesn't touch global theme tokens.

## Implementation

Single file edit: `src/routes/index.tsx`.

1. `NodeField` component — full-bleed `<canvas>`, fixed positioned behind content, DPR-aware, resizes on window resize, tracks mouse via `pointermove` on `window`. Uses `requestAnimationFrame`; cleans up listeners + frame on unmount. Short-circuits to a static render when `prefers-reduced-motion` matches.
2. `Index` layout — `relative z-10`, grid placing the eyebrow / headline / subhead / CTAs in the left two-thirds, with a thin top bar (brand mark + two text links) and a small bottom meta row.
3. CTAs are existing `@tanstack/react-router` `Link`s to `/projects` and `/login` (both already exist). No new routes.
4. Replace placeholder `Route.head()` meta with real title/description/OG for the product.

## Technical notes

- No new dependencies. Canvas 2D only.
- File stays under ~220 lines.
- Background color is applied inline on the page wrapper so it doesn't leak into other routes via the global body style.
- Uses existing animation utilities (`animate-fade-in`); no edits to `src/styles.css`.

## Out of scope

- `__root.tsx`, other routes, auth, Supabase, server functions.
- Any new `components/ui` files.
- Global theme/dark-mode changes.
