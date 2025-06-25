import {
  BoxGeometry,
  Color,
  MeshBasicMaterial,
  MeshStandardMaterial,
} from "three";
import Mesh, { MeshProps } from "./Mesh";

export interface BoxProps extends MeshProps {}

export default class Box extends Mesh {
  public constructor(props: MeshProps) {
    super({
      ...props,
      materialType : 'blocky',
    });

    // Optional: geometry can take width/height/depth if needed
    this.geometry(new BoxGeometry());


    this.InitMesh();

    // Apply transform after mesh creation
    this.core.position.copy(this.localPosition());
    this.core.scale.copy(this.localScale());

    const degToRad = Math.PI / 180;
    const rot = this.localRotation();
    this.core.rotation.set(rot.x, rot.y, rot.z);
  }
}
