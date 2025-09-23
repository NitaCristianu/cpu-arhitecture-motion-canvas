Title: L2 — Bit Layout & Buses (text-only)
Hard (me): pacing, emphasis timing, final reveal (“where did those come from?”)
Soft (Agent): HUD text, segment highlights, simple wire/bus visuals
Didactic objective: Show a 32-bit layout expanding from an 8-bit layout: 8-bit opcode, 4-bit modifiers, two 10-bit operands + thicker buses = larger addresses.
Rules invoked: REG-RES-4K, REG-LAYOUT-REQUIRED, REG-POS-ANCHOR, REG-SHADER-2D, REG-LAY-GLASS-0, REG-VIS-MOBILE-001, REG-FONT-001, REG-THEME-001, REG-PACE-001, REG-COLOR-001, REG-FOCUS-001, REG-BITS-BITNUMBER-001, REG-SHADOW-001
Assets: (none)

Execution notes:
- Use ShaderBackground at low opacity (0.2–0.4) at all times.
- Use Bitnumber for all live bit visuals (8 → 32 via 8/4/10/10).
- Every Layout that does positioning must have layout={true}.
- `position` is centered; use `topLeft` for top-left anchoring (e.g., titles).
- Glass allowed for depth; don’t nest layout content inside it.

Extra rules: Use Motion Canvas waitUntil hooks for emphasis/reveal beats. Script beats are in assets/refs/script.md.

