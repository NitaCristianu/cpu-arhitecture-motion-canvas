import {
  BoxGeometry,
  SphereGeometry,
  Mesh as ThreeMesh,
} from "three";
import Mesh, { MeshProps } from "./Mesh";

export interface SphereProps extends MeshProps {}

export default class Sphere extends Mesh {
  public constructor(props: MeshProps) {
    super({
      ...props,
    });

    // Optional: geometry can take width/height/depth if needed
    this.geometry(new SphereGeometry());
    if (props.material) this.material(props.material);

    this.InitMesh();

    // Apply transform after mesh creation
    this.core.position.copy(this.localPosition());
    this.core.scale.copy(this.localScale());

    const rot = this.localRotation();
    this.core.rotation.set(rot.x, rot.y, rot.z);
  }

  public override InitMesh(): void {
    const geometry = this.geometry();
    const material = this.material();

    if (!geometry || !material) return;

    const mesh = new ThreeMesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    this.core.add(mesh);
  }
}
