import {
  BoxGeometry,
  BufferGeometry,
  Mesh as ThreeMesh,
  MeshStandardMaterial,
  MeshPhysicalMaterial,
  Material,
  Color,
  MeshBasicMaterial,
} from "three";
import Object, { ObjectProps } from "../utils/Object";
import { initial, signal } from "@motion-canvas/2d";
import { SimpleSignal, useLogger } from "@motion-canvas/core";

export type MaterialType = "luxury" | "blocky";

export interface MeshProps extends ObjectProps {
  geometry?: BufferGeometry;
  material?: Material;
  materialType?: MaterialType;
}

export default class Mesh extends Object {
  @initial(new BoxGeometry())
  @signal()
  public declare readonly geometry: SimpleSignal<BufferGeometry | null, this>;

  @initial(null)
  @signal()
  public declare readonly material: SimpleSignal<Material | null, this>;

  @initial("blocky")
  @signal()
  public declare readonly materialType: SimpleSignal<MaterialType, this>;

  private hasCustomMaterial = false;

  public constructor(props: MeshProps) {
    super({ ...props });

    if (props.material) {
      this.hasCustomMaterial = true;
      this.material(props.material);
    }
  }
  private resolveMaterial(): Material {
    const logger = useLogger();

    if (this.hasCustomMaterial) {
      return this.material();
    }

    const type = this.materialType();

    if (type === "luxury") {
      return new MeshPhysicalMaterial({
        color: new Color(0x111111),
        roughness: 0.05,
        metalness: 1,
        reflectivity: 1,
        clearcoat: 1,
        clearcoatRoughness: 0,
      });
    } else if (type === "blocky") {
      return new MeshStandardMaterial({
        color: new Color(0xf444ff),
        emissive: new Color(0x111155),
        roughness: 0.6,
        metalness: 0.2,
      });
    }

    return new MeshBasicMaterial({ color: new Color(0xff00ff) });
  }

  public generateMesh() {
    return new ThreeMesh(this.geometry(), this.resolveMaterial());
  }

  public InitMesh() {
    const logger = useLogger();

    this.core.add(this.generateMesh());
  }
}
