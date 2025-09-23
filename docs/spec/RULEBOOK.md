# RULEBOOK (SOT)

## Technical
- REG-RES-4K: Scene resolution must be 4096×2048.
- REG-LAYOUT-REQUIRED: Motion Canvas `Layout` does nothing unless `layout={true}` is set. Any container that should arrange children must explicitly set this prop.
- REG-POS-ANCHOR: `position` is center-based. Use `topLeft` to anchor to the top-left corner when needed; do not treat `position` as top-left.
- REG-SHADER-2D: All 2D scenes must include `ShaderBackground` at low opacity (0.2–0.4) behind content.
- REG-LAY-GLASS-0: Do not place Layout containers or `layout={true}` content inside `Glass`. Glass is decorative only.
- REG-LAY-GLASS-1: If any element is visually inside Glass, ensure z/layering keeps interactive or animated content above it.
- REG-SAFE-AREA-2D: Define a safe area for HUD: width = `view.width()-400`, height = `view.height()-400`, centered. All HUD and legends must remain inside it.
- REG-TEXT-CLAMP-001: For titles/labels, set `maxWidth` (e.g., `view.width()-440`) and wrap where needed to prevent text exiting the screen.
- REG-VIS-MOBILE-001: HUD font size ≥ 90pt at 4K, or scaled equivalently for mobile.
- REG-FONT-001: Use the Poppins font family for all HUD text.
- REG-THEME-001: Default theme is dark.
- REG-API-CONTEXT-001: Before introducing or using APIs/components, inspect earlier scenes and utilities and reuse established patterns (e.g., `ShaderBackground`, `Glass`, `Bitnumber`, anchoring patterns).

## Components
- REG-BITS-BITNUMBER-001: Whenever showing live or changing bits, use `Bitnumber`. Do not hand-roll bit boxes/rects for dynamic bits.
- REG-GLASS-DEPTH-001: Glass plates are allowed to add depth, but must not be used as layout parents. Prefer sibling layering: Background → Shader → Glass → Main layout → Legends/Overlays.
- REG-SHADOW-001: Avoid flatness. Apply subtle shadows to HUD text and bit visuals (typical: `shadowBlur 20–40`, `shadowColor #000a`).

## CPU Logic
- REG-IMM-001: Immediate values have no `#` prefix.
- REG-FLAG-Z-001: Z = 1 if the result on n bits is exactly 0.
- REG-FLAG-V-001: V = 1 if `(signA == signB) && (signRes != signA)` (signed overflow).

## Style
- REG-PACE-001: Maximum of one visual accent every 1.2 seconds.
- REG-COLOR-001: ≤ 3 accent colors visible at the same time.
- REG-FOCUS-001: One idea per shot/frame.

## Common Pitfalls (from recent review)
- Missing `layout={true}` causes overlapping children and broken spacing.
- Treating `position` as top-left misplaces titles and legends; use `topLeft` when anchoring corners.
- Omitting `ShaderBackground` makes 2D scenes look flat; always add it at low opacity.
- Placing live bit visuals as Rects prevents dynamic updates; use `Bitnumber`.
- Parenting content under `Glass` turns it into a layout container; keep Glass decorative and underneath.
- Neglecting safe area/maxWidth allows text to fly off-screen; always clamp.

---

## Changelog
- v0.3: Add safe-area, text clamping, and context-first API rules; fix encoding artifacts.
- v0.2: Add Layout, ShaderBackground, Bitnumber, positioning, and shadow rules; fix encoding and clarity.
- v0.1: Initial ruleset.

