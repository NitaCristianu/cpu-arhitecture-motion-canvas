import { SpotLight, SpotLightHelper, Vector3, Color, Object3D } from "three";
import {
  tween,
  easeInOutCubic,
  easeOutSine,
  easeInSine,
} from "@motion-canvas/core";
import Scene3D from "../Scene";

export function addTowerSpotlight(
  scene3D: Scene3D,
  position: Vector3 = new Vector3(0, 1, 0),
  radius: number = .7
) {
  const spotlight = new SpotLight(
    0xFFD700, // color
    0, // start at 0, fade in later
    10, // shorter effective distance
    0.2 * radius, // narrower angle (was 1 → now 0.2)
    0.3, // tight penumbra for hard edge
    2 // higher decay for sharper falloff
  );
  spotlight.position.copy(position);

  const target = new Object3D();
  target.position.set(position.x, position.y - 5, position.z);
  spotlight.target = target;

  scene3D.scene.add(spotlight);
  scene3D.scene.add(spotlight.target);

  spotlight.castShadow = true;
  spotlight.shadow.mapSize.set(2048, 2048);
  spotlight.shadow.bias = -0.0005;

  // ────── Return control API ──────
  return {
    /** Moves the light source to a new position */
    *moveTo(to: Vector3, duration = 0.5, ease = easeInOutCubic) {
      const from = spotlight.position.clone();
      yield* tween(duration, (t) => {
        const p = from.clone().lerp(to, ease(t));
        spotlight.position.copy(p);
      });
    },

    /** Changes the direction of the spotlight */
    *lookAt(to: Vector3, duration = 0.5, ease = easeInOutCubic) {
      const from = target.position.clone();
      yield* tween(duration, (t) => {
        const look = from.clone().lerp(to, ease(t));
        target.position.copy(look);
      });
    },

    /** Fades the spotlight in */
    *fadeIn(duration = 0.4, ease = easeOutSine) {
      const start = spotlight.intensity;
      yield* tween(duration, (t) => {
        spotlight.intensity = start + (5 - start) * ease(t); // up to 5
      });
    },

    /** Fades the spotlight out */
    *fadeOut(duration = 0.4, ease = easeInSine) {
      const start = spotlight.intensity;
      yield* tween(duration, (t) => {
        spotlight.intensity = start * (1 - ease(t));
      });
    },
  };
}
