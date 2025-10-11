import { useLogger, easeInOutCubic } from "@motion-canvas/core";
import {
  Box3,
  Material,
  Mesh as ThreeMesh,
  Object3D,
  Vector3,
} from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import Mesh, { MeshProps } from "./Mesh";

export interface ModelProps extends MeshProps {
  /** Path or URL to the GLB/GLTF model file */
  src: string;
  /** Optional rotation (in radians) to apply directly to the loaded GLTF scene */
  sceneRotation?: Vector3;
  /** When true, recenters the GLTF so its pivot is at the geometric center */
  recenter?: boolean;
  /**
   * Normalize the GLTF so each axis measures 1 unit before this object's
   * localScale is applied. This keeps legacy layout math (that relies on
   * localScale) behaving as before the switch from primitive boxes.
   */
  normalize?: boolean;
}

export default class Model extends Mesh {
  private materials: Material[] = [];
  private scaleCompensation = new Vector3(1, 1, 1);
  private static readonly DEFAULT_SCENE_ROTATION = new Vector3(0, 0, 0);

  public constructor(props: ModelProps) {
    super(props);
    const logger = useLogger();
    const loader = new GLTFLoader();

    // Ensure core matches initial transforms before the asset loads
    this.core.position.copy(this.localPosition());
    this.applyScale(this.localScale());
    const rot = this.localRotation();
    this.core.rotation.set(rot.x, rot.y, rot.z);

    // Start loading the GLB model
    loader.load(
      props.src,
      (gltf: GLTF) => {
        // On successful load, add the model's scene to this object's core
        const scene = gltf.scene;

        const recenter = props.recenter ?? true;
        const normalize = props.normalize ?? true;

        scene.updateMatrixWorld(true);

        if (recenter) {
          const initialBox = new Box3().setFromObject(scene);
          const center = initialBox.getCenter(new Vector3());
          scene.position.sub(center);
        }

        const rotationSource = props.sceneRotation ?? Model.DEFAULT_SCENE_ROTATION;
        const rotationVector =
          rotationSource instanceof Vector3
            ? rotationSource
            : new Vector3(
                (rotationSource as any)?.x ?? 0,
                (rotationSource as any)?.y ?? 0,
                (rotationSource as any)?.z ?? 0
              );
        scene.rotation.set(rotationVector.x, rotationVector.y, rotationVector.z);

        scene.updateMatrixWorld(true);

        if (normalize) {
          // Ensure localScale continues to match the logical dimensions that
          // the layout + wiring math expect.
          const orientedBox = new Box3().setFromObject(scene);
          const size = orientedBox.getSize(new Vector3());
          const safe = new Vector3(
            size.x === 0 ? 1 : size.x,
            size.y === 0 ? 1 : size.y,
            size.z === 0 ? 1 : size.z
          );
          const maxDim = Math.max(safe.x, safe.y, safe.z, 1);
          const sceneScale = 1 / maxDim;
          scene.scale.setScalar(sceneScale);
          this.scaleCompensation.set(
            maxDim / safe.x,
            maxDim / safe.y,
            maxDim / safe.z
          );
          this.applyScale(this.localScale());
        }

        scene.updateMatrixWorld(true);

        this.collectMaterials(scene);
        this.material(this.materials[0] ?? null);
        this.core.add(scene);
        this.syncOpacity(this.opacity());
        // Log that the model has been loaded (with its file path)
        logger.info(`GLB loaded: ${props.src}`);
      },
      undefined,
      (error) => {
        // Log an error if the model fails to load
        logger.error(`Failed to load GLB: ${props.src}` + error);
      }
    );
  }

  private collectMaterials(root: Object3D) {
    root.traverse((child) => {
      if ((child as ThreeMesh).isMesh) {
        const mesh = child as ThreeMesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const material = mesh.material;
        if (Array.isArray(material)) {
          this.materials.push(...material);
        } else if (material) {
          this.materials.push(material);
        }
      }
    });
  }

  private syncOpacity(opacity: number) {
    this.materials.forEach((material) => {
      material.transparent = true;
      material.opacity = opacity;
    });
  }

  protected override applyScale(v: Vector3) {
    const adjusted = v.clone().multiply(this.scaleCompensation);
    this.core.scale.copy(adjusted);
  }

  public override *opacityTo(
    value: number,
    duration: number = 0.4,
    ease = easeInOutCubic
  ) {
    yield* super.opacityTo(value, duration, ease);
    this.syncOpacity(value);
  }
}
