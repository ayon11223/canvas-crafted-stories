## Goal

Add a real "smart equation" pipeline to the MCQ editor: tap into a slot, tap a panel button, the math template inserts at that slot (or nests inside the current slot). Then expand the equation library with fractions, roots, exponents, and derivatives rendered via KaTeX.

The current canvas has no slot abstraction — it has flat `CanvasItem`s with plain inputs. So Phase 1 is really "introduce the slot primitive," not "patch an existing one."

## Phase 1 — Slot primitive + nesting

### Store (`src/lib/mcq-store.ts`)
- Add `activeSlot: { itemId: string; slotKey: string } | null` plus `setActiveSlot()`.
- Extend `CanvasItem` with optional `slots?: Record<string, SlotNode[]>` where
  `SlotNode = { id: string; kind: "text" | "equation" | "shape" | ...; value?: string; slots?: Record<string, SlotNode[]> }`.
  Legacy `label`/`data` fields stay untouched.
- Recursive helpers: `findSlotNode(itemId, nodeId)`, `updateSlotNode`, `insertIntoSlot(parentNodeId | itemId, slotKey, node)`. Skip the existing absolute-position transform for nested nodes.

### New component `src/components/mcq/EditableSlot.tsx`
- A `contentEditable` span that:
  - Calls `setActiveSlot` on focus, clears on blur (with a small grace window so panel taps still see it).
  - Renders `slotChildren` inline between text via a recursive `<SlotRenderer />`.
  - Shows a subtle ring/underline when it's the active slot (UI hint).
  - Handles arrow-key boundary navigation: at caret start/end, query `canvas-root [contenteditable="true"]` in document order and focus prev/next.

### Canvas wiring (`QuestionCanvas.tsx`)
- Wrap canvas in a `data-canvas-root` div.
- Add arrow-key nudging on selected `CanvasItem` (1px / 10px with Shift), clamped to bounds. Same clamp applied in the existing drag handler.
- Insertion routing: when a panel item is tapped, if `activeSlot` is set → `insertIntoSlot`; else → existing top-level `addItem`.

### Component refactor
- Split `Shape` and the new `Equation` body JSX from their styled wrappers so the same inner JSX renders at top-level (absolute-positioned) or inline (inside a slot) without duplication.

## Phase 2 — KaTeX equations

- Add dep: `katex` + `@types/katex`. Import `katex/dist/katex.min.css` in `src/styles.css`.
- New `src/components/mcq/Equation.tsx`: takes a `template` (`"fraction" | "sqrt" | "nthroot" | "power" | "derivative"`) and `slots` map. Renders the static math glyphs via KaTeX (`renderToString` on the non-editable parts: fraction bar, √ radical, integral sign, `d/dx`) and overlays positioned `EditableSlot`s for the user-fillable holes (numerator, denominator, radicand, index, base, exponent, expression).
  - This is the only way to get KaTeX typography while keeping holes editable — KaTeX itself is read-only.
- Extend `EquationsPicker` with the four new templates. Each inserts an `Equation` node into the active slot or a new top-level canvas item if none.

## Phase 3 — Shape library expansion

Using the existing `RightTriangle` pattern in `Shape.tsx`, add: `equilateral-triangle`, `isosceles-triangle`, `scalene-triangle`, `rhombus` (rectangle + square already exist — reuse). Add picker entries in `ShapePicker.tsx`.

## Out of scope (explicit)

- No backend/schema changes.
- No migration of existing canvas items into the new slot model — old items keep working as-is; slots are additive.
- No drag-resize for inline slot children (they flow with text).

## Risk notes

- KaTeX + editable overlays is the trickiest piece; if positioning the editable holes over KaTeX glyphs proves fragile on mobile, fallback is a CSS-only fraction/root renderer (no KaTeX) — I'll flag this if it happens during implementation rather than ripping KaTeX out silently.
- `contentEditable` + Framer Motion `AnimatePresence` on the question swipe can fight each other; I'll disable swipe gestures while a slot is focused (`data-no-swipe` already exists in `editor.tsx`).
