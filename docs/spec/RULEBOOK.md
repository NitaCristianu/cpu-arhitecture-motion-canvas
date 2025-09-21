# RULEBOOK (SOT)

## Technical
- **REG-RES-4K**: Scene resolution must be 4096×2048.
- **REG-LAY-GLASS-0**: Do not use the `Glass` layout property.
- **REG-LAY-GLASS-1**: Elements inside a glass container must have `z >= 1`.
- **REG-VIS-MOBILE-001**: HUD font size ≥ 90pt or properly scaled for mobile.
- **REG-FONT-001**: Use the **Poppins** font family for all text.
- **REG-THEME-001**: Default video theme is **dark mode**.

## CPU Logic
- **REG-IMM-001**: Immediate values have no prefix `#`.
- **REG-FLAG-Z-001**: Z = 1 if the result on *n* bits is exactly 0.
- **REG-FLAG-V-001**: V = 1 if `(signA == signB) && (signRes ≠ signA)` (signed overflow).

## Style
- **REG-PACE-001**: Maximum of 1 visual accent every 1.2 seconds.
- **REG-COLOR-001**: ≤ 3 accent colors visible at the same time.
- **REG-FOCUS-001**: One idea per shot/frame.

---

## Changelog
- **v0.1**: Initial ruleset.
