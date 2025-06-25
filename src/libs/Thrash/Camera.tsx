import {
  Camera as ThreeCamera,
  PerspectiveCamera,
  OrthographicCamera,
  Vector3,
} from "three";
import Object, { ObjectProps } from "./utils/Object";
import { computed, initial, signal } from "@motion-canvas/2d";
import { SimpleSignal } from "@motion-canvas/core";

export interface CameraProps extends ObjectProps {
  camera?: ThreeCamera;
  zoom?: number;
  lookAt?: Vector3;
}

export default class Camera extends Object {
  @initial(new PerspectiveCamera(60, 16 / 9, 0.1, 1000))
  @signal()
  public declare readonly camera: SimpleSignal<ThreeCamera | null, this>;

  @initial(1)
  @signal()
  public declare readonly zoom: SimpleSignal<number, this>;

  @initial(new Vector3(0, 0, 0))
  @signal()
  public declare readonly lookAt: SimpleSignal<Vector3, this>;

  public constructor(props: CameraProps) {
    super({ ...props });
  }

  @computed()
  public configuredCamera(): ThreeCamera {
    const size = {
      x: this.master.size().x,
      y: this.master.size().y,
    };

    const camera = this.camera();
    const ratio = size.x / size.y;
    const scale = this.zoom() / 2;

    if (camera instanceof OrthographicCamera) {
      camera.left = -ratio * scale;
      camera.right = ratio * scale;
      camera.bottom = -scale;
      camera.top = scale;
      camera.updateProjectionMatrix();
    } else if (camera instanceof PerspectiveCamera) {
      camera.aspect = ratio;
      camera.updateProjectionMatrix();
    }

    // Apply transform
    camera.position.copy(this.localPosition());
    camera.scale.copy(this.localScale());
    // no rotation support 

    // Override direction if lookAt is explicitly set
    if (this.lookAt()) {
      camera.lookAt(this.lookAt());
    }

    return camera;
  }

  public InitCamera() {
    this.core.add(this.configuredCamera());
  }
}
