import { initial, signal } from "@motion-canvas/2d/lib/decorators";
import { SimpleSignal, useLogger } from "@motion-canvas/core";
import { MeshProps } from "./Mesh";  // Base ObjectProps interface
import Mesh from "./Mesh";           // Base Object class
import { Object3D } from "three";
import { GLTFLoader, GLTF } from "three/examples/jsm/loaders/GLTFLoader";

export interface ModelProps extends MeshProps {
  /** Path or URL to the GLB/GLTF model file */
  src: string;
}

export default class Model extends Mesh {
  public constructor(props: ModelProps) {
    super(props);
    const logger = useLogger();
    const loader = new GLTFLoader();

    // Start loading the GLB model
    loader.load(
      props.src,
      (gltf: GLTF) => {
        // On successful load, add the model's scene to this object's core
        this.core.add(gltf.scene);

        // If a local rotation was provided in props, apply it to the core
        if (props.localRotation) {
          this.core.rotation.set(
            props.localRotation.x,
            props.localRotation.y,
            props.localRotation.z
          );
        }
        this.core.position.set(
          props.localPosition.x,
          props.localPosition.y,
          props.localPosition.z

        )
        this.core.scale.set(
          props.localScale.x,
          props.localScale.y,
          props.localScale.z

        )

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
}
