import {
  DirectionalLight,
  AmbientLight,
  Vector3,
  Object3D,
} from "three";
import { ObjectProps } from "./Object";
import Object from "./Object";
import { useLogger } from "@motion-canvas/core";

export interface LightsProps extends ObjectProps {
  ambientIntensity?: number;
  directionalIntensity?: number;
}

export default class Lights extends Object {
  public ambient = new AmbientLight(0xffffff, .3);
  public directional = new DirectionalLight(0xffffff, 25);

  public constructor(props: LightsProps = {}) {
    super({
      ...props,
      localPosition: props.localPosition ?? new Vector3(1, 2, 0), // light above
    });

    const logger = useLogger();

    if (props.ambientIntensity !== undefined)
      this.ambient.intensity = props.ambientIntensity;

    if (props.directionalIntensity !== undefined)
      this.directional.intensity = props.directionalIntensity;

    // Light target (downward from above)
    this.directional.target.position.set(0, 0, 0);
  }

  public InitLight() {
    const logger = useLogger();
    logger.debug("💡 Lights created");

    // Copy localPosition to light position
    this.directional.position.copy(this.localPosition());

    this.core.add(this.ambient);
    this.core.add(this.directional);
    this.core.add(this.directional.target); // REQUIRED in Three.js
  }

  public override init(master: any, parent: Object3D) {
    super.init(master, parent);
    this.InitLight();
  }
}
