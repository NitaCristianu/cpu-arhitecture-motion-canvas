import {
  BoxGeometry,
  BufferGeometry,
  Material,
  Object3D,
  Vector3,
  Color,
} from "three";
import Object, { ObjectProps } from "../utils/Object";
import { initial, signal } from "@motion-canvas/2d";
import {
  all,
  easeInCirc,
  easeInCubic,
  easeInOutCubic,
  easeInSine,
  easeOutCubic,
  easeOutSine,
  linear,
  loop,
  SimpleSignal,
  ThreadGenerator,
  tween,
  useLogger,
} from "@motion-canvas/core";

export function lerpVec3(from: Vector3, to: Vector3, t: number): Vector3 {
  return new Vector3(
    from.x + (to.x - from.x) * t,
    from.y + (to.y - from.y) * t,
    from.z + (to.z - from.z) * t
  );
}

export function* transformVec3(
  current: () => Vector3,
  setter: (v: Vector3) => void,
  target: Vector3,
  duration: number,
  easing = easeInOutCubic
) {
  const start = current();
  yield* tween(duration, (value) => {
    setter(lerpVec3(start, target, easing(value)));
  });
}

export interface MeshProps extends ObjectProps {
  geometry?: BufferGeometry;
  material?: Material;
  alpha?: number;
  reflective?: boolean;
  castShadow?: boolean;
  renderable?: boolean;
}

export default class Mesh extends Object {
  @initial(1) // 1 = fully opaque
  @signal()
  public declare readonly opacity: SimpleSignal<number, this>;

  @initial(new BoxGeometry())
  @signal()
  public declare readonly geometry: SimpleSignal<BufferGeometry | null, this>;

  @initial(null)
  @signal()
  public declare readonly material: SimpleSignal<Material | null, this>;

  @initial(false)
  @signal()
  public declare readonly reflective: SimpleSignal<boolean, this>;

  @initial(1)
  @signal()
  public declare readonly alpha: SimpleSignal<number, this>;

  @initial(true)
  @signal()
  public declare readonly renderable: SimpleSignal<boolean, this>;

  public *colorTo(
    to: number | Color,
    duration: number = 0.33,
    ease = easeInOutCubic
  ) {
    yield* this.#tintTo("color", to, duration, ease);
  }

  /** Tween material.emissive to a new color (if present) */
  public *emissiveTo(
    to: number | Color,
    duration: number = 0.33,
    ease = easeInOutCubic
  ) {
    yield* this.#tintTo("emissive", to, duration, ease);
  }

  /** Convenience: tween both color & emissive together */
  public *glowTo(
    to: number | Color,
    duration: number = 0.33,
    ease = easeInOutCubic
  ) {
    yield* all(
      this.colorTo(to, duration, ease),
      this.emissiveTo(to, duration, ease)
    );
  }

  /** Internal tint helper */
  *#tintTo(
    channel: "color" | "emissive",
    to: number | Color,
    duration: number,
    ease: (t: number) => number
  ) {
    const mat = this.material() as any;
    if (!mat || !(mat[channel] instanceof Color)) return;

    const start = (mat[channel] as Color).clone();
    const end = to instanceof Color ? to.clone() : new Color(to);

    yield* tween(duration, (t) => {
      const k = ease(t);
      (mat[channel] as Color).copy(start).lerp(end, k);
    });
  }

  public constructor(props: MeshProps) {
    super({ ...props });

    if (props.material) {
      this.material(props.material);
    }
    if (this.material()) {
      const m = this.material()!;
      m.transparent = true;
      m.opacity = this.alpha();
    }
    if (props.castShadow === true) {
      this.core.castShadow = true;
    }
  }

  private *lerpNumber(
    from: number,
    set: SimpleSignal<number, this>,
    to: number,
    duration: number,
    easing = easeInOutCubic
  ) {
    yield* tween(duration, (t) => {
      const v = from + (to - from) * easing(t);
      set(v);
      switch (set) {
        case this.alpha:
          if (this.material()) {
            this.material()!.opacity = v;
            break;
          }
      }
    });
  }

  public *opacityTo(
    value: number,
    duration: number = 0.4,
    ease = easeInOutCubic
  ) {
    yield* this.lerpNumber(this.opacity(), this.opacity, value, duration, ease);

    // Also update the material's transparency if needed
    if (this.material()) {
      const m = this.material()!;
      m.transparent = true;
      m.opacity = value;
    }
  }

  public *expand(to = 1.1, t = 0.33, ease = easeInOutCubic) {
    yield* this.scaleTo(this.localScale().clone().multiplyScalar(to), t, ease);
  }
  public *shrink(to = 1 / 1.1, t = 0.33, ease = easeInOutCubic) {
    yield* this.expand(to, t, ease);
  }
  public* pulse(to = 1.1, t = 0.33, ease1 = easeOutCubic, ease2 = easeInCubic){
    yield* this.expand(to, t, ease1);
    yield* this.shrink(1/to, t, ease2);
  }

  private *lerpVec3(
    from: Vector3,
    set: SimpleSignal<Vector3, this>,
    to: Vector3,
    duration: number,
    easing = easeInOutCubic
  ) {
    yield* tween(duration, (t) => {
      const v = new Vector3(
        from.x + (to.x - from.x) * easing(t),
        from.y + (to.y - from.y) * easing(t),
        from.z + (to.z - from.z) * easing(t)
      );
      set(v);
      // 👇 Infer which signal you're updating, then update the Three.js transform
      switch (set) {
        case this.localPosition:
          this.core.position.copy(v);
          break;
        case this.localRotation:
          this.core.rotation.set(v.x, v.y, v.z);
          break;
        case this.localScale:
          this.core.scale.copy(v);
          break;
      }
    });
  }

  public *fadeTo(alpha: number, duration = 0.4, ease = easeInOutCubic) {
    yield* this.lerpNumber(this.alpha(), this.alpha, alpha, duration, ease);
  }

  public *fadeIn(duration = 0.4, ease = easeOutSine) {
    yield* this.fadeTo(1, duration, ease);
  }
  public *fadeOut(duration = 0.4, ease = easeInSine) {
    yield* this.fadeTo(0, duration, ease);
  }

  public *popIn(
    duration = 0.4,
    endScale = new Vector3(1, 1, 1),
    ease = easeOutSine
  ) {
    const finalRot = this.localRotation();
    const startRot = new Vector3(finalRot.x, finalRot.y + 1, finalRot.z); // small Y spin

    // Set start rotation instantly
    this.localRotation(startRot);
    this.core.rotation.set(startRot.x, startRot.y, startRot.z);

    yield* all(
      this.lerpVec3(
        this.localScale(),
        this.localScale,
        endScale,
        duration,
        ease
      ),
      this.lerpVec3(startRot, this.localRotation, finalRot, duration, ease)
    );
  }

  public *popOut(duration = 0.4, ease = easeInSine) {
    const startRot = this.localRotation();
    const endRot = new Vector3(startRot.x, startRot.y + 1, startRot.z); // spin on exit

    yield* all(
      this.lerpVec3(
        this.localScale(),
        this.localScale,
        new Vector3(0, 0, 0),
        duration,
        ease
      ),
      this.lerpVec3(startRot, this.localRotation, endRot, duration, ease)
    );
  }

  public *reposition(target: Vector3, duration = 0.5, ease = easeInOutCubic) {
    yield* this.lerpVec3(
      this.localPosition(),
      this.localPosition,
      target,
      duration,
      ease
    );
  }

  public *rotateTo(target: Vector3, duration = 0.5, ease = easeInOutCubic) {
    yield* this.lerpVec3(
      this.localRotation(),
      this.localRotation,
      target,
      duration,
      ease
    );
  }

  public *scaleTo(target: Vector3, duration = 0.5, ease = easeInOutCubic) {
    yield* this.lerpVec3(
      this.localScale(),
      this.localScale,
      target,
      duration,
      ease
    );
  }

  // ── Relative position helpers ───
  public *moveRight(amount = 1, d = 0.5, e = easeInOutCubic) {
    const p = this.localPosition().clone().add(new Vector3(amount, 0, 0));
    yield* this.reposition(p, d, e);
  }
  public *moveLeft(amount = 1, d = 0.5, e = easeInOutCubic) {
    const p = this.localPosition().clone().add(new Vector3(-amount, 0, 0));
    yield* this.reposition(p, d, e);
  }
  public *moveUP(amount = 1, d = 0.5, e = easeInOutCubic) {
    const p = this.localPosition().clone().add(new Vector3(0, amount, 0));
    yield* this.reposition(p, d, e);
  }
  public *moveDOWN(amount = 1, d = 0.5, e = easeInOutCubic) {
    const p = this.localPosition().clone().add(new Vector3(0, -amount, 0));
    yield* this.reposition(p, d, e);
  }
  public *moveForward(amount = 1, d = 0.5, e = easeInOutCubic) {
    const p = this.localPosition().clone().add(new Vector3(0, 0, -amount));
    yield* this.reposition(p, d, e);
  }
  public *moveBack(amount = 1, d = 0.5, e = easeInOutCubic) {
    const p = this.localPosition().clone().add(new Vector3(0, 0, amount));
    yield* this.reposition(p, d, e);
  }

  public *startIdleRotation(axes: ("x" | "y" | "z")[] = ["y"], speed = 10) {
    const self = this;

    yield loop(function () {
      if (self.localScale().lengthSq() < 1e-6) return;

      const cur = self.localRotation().clone();
      const next = cur.clone();

      // Apply 180° (π) rotation to specified axes
      for (const axis of axes) {
        switch (axis) {
          case "x":
            next.x += Math.PI;
            break;
          case "y":
            next.y += Math.PI;
            break;
          case "z":
            next.z += Math.PI;
            break;
        }
      }

      return self.rotateTo(next, speed, linear);
    });
  }

  public InitMesh(): void {
    let object: Object3D;

    this.core.add(object);
  }
}
