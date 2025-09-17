import { Vector3 } from "three";
import COLORS  from "./colors";
import Line from "../../libs/Thrash/objects/Line";

/**
 * Create a smooth “bus” between two 3-D points.
 *
 * @param from   world-space start
 * @param to     world-space end
 * @param role   semantic colour key from COLORS
 * @param width  visible width after animation (defaults to 4)
 */
export function connectBus(
  from: Vector3,
  to: Vector3,
  role: keyof typeof COLORS,
  width = 4,
) {
  // Two symmetrical Bézier control points give a nice S-curve
  const ctrl1 = from.clone().lerp(to, 0.35).add(new Vector3(0, 0.04, 0.01));
  const ctrl2 = to.clone().lerp(from, 0.35).add(new Vector3(0, 0.04, 0.01));

  const line = (
    <Line
      points={[from, ctrl1, ctrl2, to]}
      lineWidth={0}          // start invisible
      color={role}
      smooth
    />
  ) as Line;

  // helper methods

  return line;
}
