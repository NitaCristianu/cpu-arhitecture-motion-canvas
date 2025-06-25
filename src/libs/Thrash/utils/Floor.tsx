import { Color, MeshPhysicalMaterial, Vector3 } from "three";
import Box from "../objects/Box";
import { MeshProps } from "../objects/Mesh";

export const reflectiveGlassMaterial = new MeshPhysicalMaterial({
  color: new Color(0x111111),
  metalness: 0.9,
  roughness: 0.05,
  transmission: 0.95,        // Glass-like transparency
  transparent: true,
  thickness: 0.5,            // Simulates glass depth
  ior: 1.5,                  // Index of refraction
  reflectivity: 0.8,         // Makes it look like polished glass
  clearcoat: 1.0,            // Adds a smooth outer layer
  clearcoatRoughness: 0.1,
  envMapIntensity: 1.5,      // Boosts reflections from environment map
});

export interface FloorProps extends Omit<MeshProps, 'localPosition' | 'localScale'> {}

export default class Floor extends Box {
  public constructor(props: FloorProps = {}) {
    super({
      ...props,
      localScale: new Vector3(120, 1, 120),                   // wide and flat
      localPosition: new Vector3(0, -1, 0),                 // top at y = 0
      material : reflectiveGlassMaterial
    });
  }
}
