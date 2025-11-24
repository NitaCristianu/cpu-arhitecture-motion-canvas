import { BoxGeometry, Mesh as ThreeMesh } from "three";
import Mesh, { MeshProps } from "./Mesh";

export interface BoxProps extends MeshProps {}

export default class Box extends Mesh {
  public constructor(props: MeshProps) {
    super({
      ...props,
    });

    // Optional: geometry can take width/height/depth if needed
    this.geometry(new BoxGeometry());
    if (props.material) this.material(props.material);

    this.InitMesh();

    // Apply transform after mesh creation
    if (props.localPosition) this.core.position.copy(props.localPosition);
    if (props.localScale) this.core.scale.copy(props.localScale);

    if (props.localRotation){
      const rot = props.localRotation;
      this.core.rotation.set(rot.x, rot.y, rot.z);
    }
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
