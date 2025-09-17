import { Group as ThreeGroup, Object3D } from "three";
import Mesh, { MeshProps } from "./Mesh";

/**
 * Group is a non-renderable container whose core is a THREE.Group
 */
export interface GroupProps
  extends Omit<
    MeshProps,
    "geometry" | "material" | "alpha" | "reflective" | "castShadow"
  > {
 
}

export default class Group extends Mesh {
  public constructor(props: GroupProps = {}) {
    super({ ...props, renderable: false });

    this.core = new ThreeGroup();
    if (props.localPosition){
      this.core.position.copy(props.localPosition.clone());
    }
    if (props.localScale){
      this.core.scale.copy(props.localScale.clone());
    }
  }

  public remove(...objects: Object3D[]): this {
    this.core.remove(...objects);
    return this;
  }

  public clear(): this {
    this.core.clear();
    return this;
  }
}
