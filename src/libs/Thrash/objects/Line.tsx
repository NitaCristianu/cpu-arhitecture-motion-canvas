import {
  Vector3,
  CatmullRomCurve3,
  Color,
  TubeGeometry,
  MeshBasicMaterial,
  Mesh as ThreeMesh,
  SphereGeometry,
  Vector2,
} from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";

import Mesh, { MeshProps } from "./Mesh";

import { initial, signal } from "@motion-canvas/2d";
import {
  SimpleSignal,
  tween,
  easeInOutCubic,
  useLogger,
  all,
  loop,
  sequence,
  range,
  easeInSine,
  easeInCubic,
  easeOutCubic,
  waitFor,
  easeOutBack,
  easeInOutSine,
} from "@motion-canvas/core";
import PRESET_COLOURS from "../../../utils/colors";

export type PresetKey = keyof typeof PRESET_COLOURS;

export function colourFor(k: PresetKey | number | Color): number | Color {
  if (typeof k === "string" && k in PRESET_COLOURS) {
    return PRESET_COLOURS[k as PresetKey];
  }
  return typeof k === "number" || k instanceof Color
    ? k
    : PRESET_COLOURS.default;
}

/*───────────────────────────────────────────────────────────*/
export interface LineProps extends MeshProps {
  /** Ordered list of control points. */
  points: Vector3[];
  /** Interpolate a Catmull‑Rom spline through the points. */
  smooth?: boolean;
  /** Line color (hex or THREE.Color) */
  color?: number | Color | PresetKey;
  /** Line width in pixels unless `worldUnits` is set on the material. */
  lineWidth?: number;
  /** Render as dashed line. */
  dashed?: boolean;
  /** On off Wire view */
  on?: boolean;
}

/*───────────────────────────────────────────────────────────*/
export default class Line extends Mesh {
  /** Current control points (mutable). */
  public _points: Vector3[];
  private _curve?: CatmullRomCurve3;

  /** Should we generate a spline? */
  private readonly _smooth: boolean;
  private _on: boolean = false;

  /* Signals so we can animate width / colour too if needed */
  @initial(4)
  @signal()
  public declare readonly lineWidth: SimpleSignal<number, this>;

  private _linemesh: Line2;

  /*─────────────────────────────────────────────────────────*/
  public constructor(props: LineProps) {
    super({ ...props });

    /* Store state */
    this._points = props.points.map((p) => p.clone());
    this._smooth = props.smooth ?? false;
    if (props.lineWidth !== undefined) this.lineWidth(props.lineWidth);
    /* Create material */
    this._on = !!props.on;

    const mat =
      props.material instanceof LineMaterial
        ? (props.material as LineMaterial)
        : new LineMaterial({
            color: props.color ?? 0xffffff,
            linewidth: this.lineWidth(), // px unless worldUnits true
            dashed: !!props.dashed,
            transparent: true,
            resolution: new Vector2(4096, 2048),
            depthTest: true,
            alphaToCoverage: true, // anti-alias edges better
          });

    this.material(mat);

    /* Geometry & mesh instantiation */
    const geom = this.buildGeometry(this._points);
    geom.computeBoundingSphere();
    geom.computeBoundingBox();
    this.geometry(geom);
    this.InitMesh();
    this._linemesh.frustumCulled = false;
    this.tint(props.color);

    // initial transform comes from Mesh base (copied in InitMesh)
  }

  public getPointAt(t: number): Vector3 {
    if (!this._curve) {
      this.sampleSpline(this._points);
    }
    return this._curve.getPoint(Math.max(0, Math.min(1, t)));
  }

  /** Returns the point halfway through the curve. */
  public getMiddlePoint(): Vector3 {
    return this.getPointAt(0.5);
  }

  /*─────────────────────────────────────────────────────────*/
  /** Build geometry from a list of control points. */
  private buildGeometry(points: Vector3[]): LineGeometry {
    const geom = new LineGeometry();
    const positions = this._smooth
      ? this.sampleSpline(points)
      : this.flatten(points);
    geom.setPositions(positions);
    geom.computeBoundingSphere();
    geom.computeBoundingBox();
    return geom;
  }

  /** Sample a Catmull‑Rom spline through the control points. */
  private sampleSpline(ctrl: Vector3[]): number[] {
    const curve = new CatmullRomCurve3(ctrl);
    const steps = Math.max(4, ctrl.length * 12);
    const out: number[] = [];
    for (let i = 0; i <= steps; i++) {
      const p = curve.getPoint(i / steps);
      out.push(p.x, p.y, p.z);
    }
    this._curve = curve;
    return out;
  }

  /** Flatten Vector3[] into a number[] for LineGeometry. */
  private flatten(vs: Vector3[]): number[] {
    const out: number[] = [];
    vs.forEach((p) => out.push(p.x, p.y, p.z));
    return out;
  }

  /*─────────────────────────────────────────────────────────*/
  public override InitMesh(): void {
    const geometry = this.geometry();
    const material = this.material();
    if (!geometry || !material) return;

    const line = new Line2(geometry as LineGeometry, material as LineMaterial);
    line.computeLineDistances();
    this._linemesh = line;
    this.core.add(line);
  }

  private tint(tone: PresetKey | Color | number) {
    const mtl = this._linemesh.material;
    if (!mtl) return;

    const c = typeof tone === "string" ? colourFor(tone) : tone;
    (mtl as LineMaterial & { color?: Color }).color?.set(c);
  }

  /*─────────────────────────────────────────────────────────*/
  /**
   * Tween‑animate this line so its control points morph into `target`.
   * For best results the arrays should be the same length.
   */
  public *updatePoints(
    target: Vector3[],
    duration = 1,
    easing = easeInOutCubic
  ) {
    const log = useLogger();
    const from = this._points.map((p) => p.clone());
    const to = target.map((p) => p.clone());
    if (from.length !== to.length) {
      log.warn(
        "Line.updatePoints(): control‑point count mismatch; animation may be uneven."
      );
    }

    // Ensure we mutate the SAME LineGeometry instance each tick for efficiency
    const geom = this.geometry() as LineGeometry;

    yield* tween(duration, (t) => {
      const k = easing(t);
      const interp: Vector3[] = [];
      const len = Math.min(from.length, to.length);
      for (let i = 0; i < len; i++) {
        const a = from[i],
          b = to[i];
        interp.push(
          new Vector3(
            a.x + (b.x - a.x) * k,
            a.y + (b.y - a.y) * k,
            a.z + (b.z - a.z) * k
          )
        );
      }
      // Copy over remaining unmatched points (appear/disappear abruptly)
      for (let i = len; i < to.length; i++) interp.push(to[i].clone());

      const positions = this._smooth
        ? this.sampleSpline(interp)
        : this.flatten(interp);
      geom.setPositions(positions);
      // Dash distances need recalculation for dashed lines
      const obj = this.core.children[0];
      if (obj instanceof Line2) obj.computeLineDistances();
    });

    // Persist new state
    this._points = target.map((p) => p.clone());
  }

  public *colorTo(
    color: Color | number,
    duration: number = 0.33,
    ease = easeInOutCubic
  ) {
    const startColor = (this.material()! as LineMaterial).color.clone();
    const endColor = new Color(color);
    yield* tween(duration, (t) => {
      t = ease(t);
      (this.material()! as LineMaterial).color.lerpColors(
        startColor,
        endColor,
        t
      );
    });
  }

  public *widthTo(
    width: number,
    duration: number = 0.33,
    ease = easeInOutCubic
  ) {
    const startW = (this.material()! as LineMaterial).linewidth;
    yield* tween(duration, (t) => {
      t = ease(t);
      (this.material()! as LineMaterial).linewidth =
        startW + (width - startW) * t;
    });
  }

  public *highlight(
    enable: boolean,
    duration: number = 0.33,
    ease = easeInOutCubic
  ) {
    const baseWidth = (this.material()! as LineMaterial).linewidth;
    const baseColor = (this.material()! as LineMaterial).color.clone();
    if (enable) {
      // Save original values
      // Determine highlight targets (e.g. 20% thicker and 20% brighter)
      const targetWidth = baseWidth * 1.2;
      const targetColor = baseColor.clone().lerp(new Color(0xffffff), 0.2);
      // Animate both concurrently
      yield* all(
        this.widthTo(targetWidth, duration, ease),
        this.colorTo(targetColor, duration, ease)
      );
    } else {
      // Revert to stored baseWidth/baseColor
      const targetWidth = baseWidth / 1.2;
      const targetColor = baseColor.clone().lerp(new Color(0x000000), 0.2);
      yield* all(
        this.widthTo(targetWidth, duration, ease),
        this.colorTo(targetColor, duration, ease)
      );
    }
  }

  public *pulse(duration = 0.3) {
    const color = this._linemesh.material.color.clone();
    const width = this.lineWidth();
    yield* all(
      this.colorTo(
        color.clone().lerp(new Color(0xffffff), 0.4),
        duration / 2,
        easeOutBack
      ),
      this.widthTo(width * 1.2, duration / 2, easeOutBack)
    );
    yield* all(
      this.colorTo(color, duration / 2, easeInOutSine),
      this.widthTo(width, duration / 2, easeInOutSine)
    );
  }

  public *toggle(on: boolean = true, duration = 0.6, ease = easeInOutSine) {
    const material = this.material() as LineMaterial;
    const base = material.color.clone();
    const target = base.clone().multiplyScalar(on ? 1 : 0.4);

    yield* this.colorTo(target, duration, ease);
  }

  public *currentFlow(duration: number = 2, ease = easeInSine, density = 10) {
    if (!this._curve) {
      this.sampleSpline(this._points);
    }
    const curve = this._curve;

    const radius = 0.002;
    const baseMaterial = new MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1,
      depthTest: false,
    });

    const amount = Math.floor(duration * density);

    yield* sequence(
      duration / amount,
      ...range(amount).map(() =>
        function* () {
          const geo = new SphereGeometry(radius, 16, 16);
          const dot = new ThreeMesh(geo, baseMaterial.clone());
          dot.renderOrder = 999;
          dot.visible = true;
          this.core.add(dot);

          yield* tween(duration, (t) => {
            t = ease(t);
            const u = Math.min(1, Math.max(0, t));
            const p = curve.getPointAt(u);
            dot.position.copy(p);

            // Fade in/out with easing
            const fadeIn = easeOutCubic(Math.min(1, u * 5)); // first 20%
            const fadeOut = easeInCubic(Math.min(1, (1 - u) * 5)); // last 20%
            const opacity = Math.min(fadeIn, fadeOut);
            (dot.material as MeshBasicMaterial).opacity = opacity;
          });

          this.master.scene.remove(dot);
          geo.dispose();
          dot.material.dispose();
        }.bind(this)()
      )
    );
  }

  public *reverseFlow(duration: number = 2, ease = easeInSine, density = 10) {
    if (!this._curve) {
      this.sampleSpline(this._points);
    }
    const curve = this._curve;

    const radius = 0.002;
    const baseMaterial = new MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1,
      depthTest: false,
    });

    const amount = Math.floor(duration * density);

    yield* sequence(
      duration / amount,
      ...range(amount).map(() =>
        function* () {
          const geo = new SphereGeometry(radius, 16, 16);
          const dot = new ThreeMesh(geo, baseMaterial.clone());
          dot.renderOrder = 999;
          dot.visible = true;
          this.core.add(dot);

          yield* tween(duration, (t) => {
            t = ease(t);
            const u = Math.min(1, Math.max(0, 1 - t)); // 🔁 reversed
            const p = curve.getPointAt(u);
            dot.position.copy(p);

            // Fade in/out with easing
            const fadeIn = easeOutCubic(Math.min(1, (1 - u) * 5)); // reverse fade
            const fadeOut = easeInCubic(Math.min(1, u * 5));
            const opacity = Math.min(fadeIn, fadeOut);
            (dot.material as MeshBasicMaterial).opacity = opacity;
          });

          this.master.scene.remove(dot);
          geo.dispose();
          dot.material.dispose();
        }.bind(this)()
      )
    );
  }

  public *popInDraw(duration = 0.8, ease = easeInOutSine) {
    // Ensure we have a curve and up-to-date line distances
    if (!this._curve) this.sampleSpline(this._points);
    this._linemesh.computeLineDistances();

    // Total length along the path
    const length =
      this._smooth && this._curve
        ? this._curve.getLength()
        : this._points.reduce(
            (L, p, i, arr) => (i ? L + arr[i - 1].distanceTo(p) : 0),
            0
          );

    const mat = this.material() as LineMaterial;

    // Stash original dashed settings (TS defs don’t expose these -> cast)
    const m = mat as unknown as {
      dashed: boolean;
      dashSize: number;
      gapSize: number;
      dashOffset: number;
      needsUpdate: boolean;
    };
    const prev = {
      dashed: m.dashed,
      dashSize: m.dashSize ?? 1,
      gapSize: m.gapSize ?? 1,
      dashOffset: m.dashOffset ?? 0,
    };

    // Use a single “dash” that grows from 0 to full length
    m.dashed = true;
    m.dashOffset = 0;
    m.dashSize = 1e-4; // start with nothing visible
    m.gapSize = Math.max(1e-4, length);

    yield* tween(duration, (t) => {
      t = ease(t);
      const shown = Math.max(1e-4, length * t);
      m.dashSize = shown;
      m.gapSize = Math.max(1e-4, length - shown);
      m.needsUpdate = true;
    });

    // Restore original material state
    m.dashed = prev.dashed;
    m.dashSize = prev.dashSize;
    m.gapSize = prev.gapSize;
    m.dashOffset = prev.dashOffset;
    m.needsUpdate = true;
  }

  public *popOutDraw(duration = 0.8, ease = easeInOutSine) {
    // Ensure we have a curve and up-to-date line distances
    if (!this._curve) this.sampleSpline(this._points);
    this._linemesh.computeLineDistances();

    // Total length along the path
    const length =
      this._smooth && this._curve
        ? this._curve.getLength()
        : this._points.reduce(
            (L, p, i, arr) => (i ? L + arr[i - 1].distanceTo(p) : 0),
            0
          );

    const mat = this.material() as LineMaterial;

    // Stash original dashed settings (TS defs don’t expose these -> cast)
    const m = mat as unknown as {
      dashed: boolean;
      dashSize: number;
      gapSize: number;
      dashOffset: number;
      needsUpdate: boolean;
    };
    const prev = {
      dashed: m.dashed,
      dashSize: m.dashSize ?? 1,
      gapSize: m.gapSize ?? 1,
      dashOffset: m.dashOffset ?? 0,
    };

    // Use a single “dash” that grows from 0 to full length
    m.dashed = true;
    m.dashOffset = 0;
    m.dashSize = 1e-4; // start with nothing visible
    m.gapSize = Math.max(1e-4, length);

    yield* tween(duration, (t) => {
      t = 1 - ease(t);
      const shown = Math.max(1e-4, length * t);
      m.dashSize = shown;
      m.gapSize = Math.max(1e-4, length - shown);
      m.needsUpdate = true;
    });

    // Restore original material state
    m.dashed = prev.dashed;
    m.dashSize = prev.dashSize;
    m.gapSize = prev.gapSize;
    m.dashOffset = prev.dashOffset;
    m.needsUpdate = true;
  }
}
