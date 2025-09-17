const COLORS = {
  /* semantic roles */
  busData: 0x4da4e7, // bright cyan
  busAddr: 0x1f6db2, // deep blue
  bus: 0x0077aa, // Deep Cyan (data/control lines)
  alu: 0xff6a00, // Burnt Orange (active logic heat)
  fpu: 0x4b0082, // Dark Indigo (complex float logic)
  vpu: 0x228b22, // Forest Green (visual unit, perceptual)
  register: 0x006400, // Dark Green (fast-access, core-local)
  memory: 0x8b008b, // Dark Magenta (dense and mysterious)
  io: 0xb8860b, // Bronze (external interface)
  decoder: 0x2f4f4f, // Dark Slate Gray (low-level control)
  control: 0x444444, // Graphite (shadow logic)
  cache: 0x191970, // Midnight Blue (hidden, fast)
  background: 0x0d0d0d, // Very dark gray (subtle but not true black)
  default: 0xe0e0e0, // Soft white/gray (fallback)
  good: 0x4caf50,
  warn: 0xffa000,
  error: 0xf44336,
} as const;

export default COLORS;

/** Helper – returns CSS hex `#rrggbb` for 2-D components. */
export const css = (key: keyof typeof COLORS) =>
  `#${COLORS[key].toString(16).padStart(6, "0")}`;
