import { tween } from "@motion-canvas/core";
import {
  Color,
  IcosahedronGeometry,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  Vector3,
} from "three";
import Scene3D from "../Scene";
import ObjectBase, { ObjectProps } from "../utils/Object";

export interface ConfettiBurstProps extends ObjectProps {
  /** Number of individual particles. */
  count?: number;
  /** Lifetime of the burst in seconds. */
  duration?: number;
  /** Overall speed / spread of the burst. */
  spread?: number;
  /** Per-particle color palette. */
  colors?: Array<number | string | Color>;
  /** Size of each spark. */
  size?: number;
}

const randomRange = (min: number, max: number) =>
  min + Math.random() * (max - min);

export default class ConfettiBurst extends ObjectBase {
  private instanced: InstancedMesh<IcosahedronGeometry, MeshStandardMaterial>;
  private startOffsets: Vector3[] = [];
  private velocities: Vector3[] = [];
  private spins: Vector3[] = [];
  private readonly duration: number;
  private readonly tmp = new Object3D();

  public constructor({
    count = 120,
    duration = 1,
    spread = 0.4,
    colors = [0xff5c5c, 0xffd166, 0x37e1ff, 0x7cf29c, 0xe6e6e6],
    size = 0.025,
    localPosition,
    localRotation,
    localScale,
    ...rest
  }: ConfettiBurstProps = {}) {
    super({ localPosition, localRotation, localScale, ...rest });
    this.duration = duration;

    const geometry = new IcosahedronGeometry(size, 0);
    const material = new MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.15,
      metalness: 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      emissive: new Color(0xffffff).multiplyScalar(0.3),
      emissiveIntensity: 0.6,
    });

    this.instanced = new InstancedMesh(geometry, material, count);
    this.instanced.castShadow = false;
    this.instanced.receiveShadow = false;

    const palette = colors.map((c) => (c instanceof Color ? c : new Color(c)));
    for (let i = 0; i < count; i++) {
      const dir = new Vector3(
        randomRange(-1, 1),
        Math.abs(randomRange(0.4, 1.2)), // bias upward for fireworks arc
        randomRange(-1, 1)
      ).normalize();
      const speed = randomRange(spread * 0.6, spread * 1.2);
      this.velocities.push(dir.multiplyScalar(speed));

      this.startOffsets.push(
        new Vector3(
          randomRange(-0.05, 0.05),
          randomRange(-0.02, 0.02),
          randomRange(-0.05, 0.05)
        )
      );

      this.spins.push(
        new Vector3(
          randomRange(-Math.PI, Math.PI),
          randomRange(-Math.PI, Math.PI),
          randomRange(-Math.PI, Math.PI)
        )
      );
      this.setInstance(i, this.startOffsets[i], new Vector3());
      this.instanced.setColorAt(i, palette[i % palette.length]);
    }

    if (this.instanced.instanceColor) {
      this.instanced.instanceColor.needsUpdate = true;
    }
    this.instanced.instanceMatrix.needsUpdate = true;

    if (localPosition) this.core.position.copy(localPosition);
    if (localScale) this.core.scale.copy(localScale);
    if (localRotation)
      this.core.rotation.set(localRotation.x, localRotation.y, localRotation.z);

    this.core.add(this.instanced);
  }

  private setInstance(index: number, position: Vector3, rotation: Vector3) {
    this.tmp.position.copy(position);
    this.tmp.rotation.set(rotation.x, rotation.y, rotation.z);
    this.tmp.updateMatrix();
    this.instanced.setMatrixAt(index, this.tmp.matrix);
  }

  /** Runs the one-second burst and disposes itself afterward. */
  public *burst() {
    const mesh = this.instanced;
    const gravity = -1.1;

    yield* tween(this.duration, (t) => {
      const travel = Math.sin(t * Math.PI * 0.5); // quick burst then glide
      const verticalDrop = 0.5 * gravity * t * t; // parabolic fall
      mesh.material.opacity = 1 - t * 0.9;
      mesh.material.emissiveIntensity = 0.6 * (1 - t * 0.7);

      for (let i = 0; i < mesh.count; i++) {
        const start = this.startOffsets[i];
        const vel = this.velocities[i];
        const spin = this.spins[i];
        const pos = start
          .clone()
          .add(vel.clone().multiplyScalar(travel))
          .add(new Vector3(0, verticalDrop, 0));
        const rot = spin.clone().multiplyScalar(t * 2.4);
        this.setInstance(i, pos, rot);
      }
      mesh.instanceMatrix.needsUpdate = true;
    });

    this.dispose();
  }

  public override dispose(): void {
    this.core.parent?.remove(this.core);
    this.instanced.geometry.dispose();
    this.instanced.material.dispose();
    super.dispose();
  }
}

/** Convenience helper to attach a confetti burst at a world position. */
export function triggerConfetti(
  scene: Scene3D,
  position: Vector3,
  options: Omit<ConfettiBurstProps, "localPosition"> = {}
) {
  const burst = new ConfettiBurst({
    ...options,
    localPosition: position.clone(),
  });
  scene.add(burst);
  if (!burst.initialized) {
    burst.init(scene, scene.scene);
  }
  return burst;
}
