import { useLogger } from "@motion-canvas/core";
import Scene3D from "../Scene";
import Object, { ObjectProps } from "./Object";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import {
  PMREMGenerator,
  Texture,
  EquirectangularReflectionMapping,
  WebGLRenderer,
  Scene,
  Material,
  MeshStandardMaterial,
  MeshPhysicalMaterial,
} from "three";

export interface EnvMapProps extends ObjectProps {
  url: string;
  applyToBackground?: boolean;
}

export default class EnvMap extends Object {
  private envMap: Texture | null = null;
  private static envCache: Map<string, Texture> = new Map();
  private static rgbeLoader = new RGBELoader();

  public constructor(private props: EnvMapProps) {
    super(props);
  }

  public override init(master: Scene3D): void {
    if (this.envMap) {
      return;  // already initialized for this instance
    }
    const renderer = master.renderer;
    const scene = master.scene;
    const logger = useLogger();

    // If this HDR environment was loaded before, reuse the existing texture
    if (EnvMap.envCache.has(this.props.url)) {
      const cachedEnv = EnvMap.envCache.get(this.props.url)!;
      scene.environment = cachedEnv;
      if (this.props.applyToBackground) {
        scene.background = cachedEnv;
      }
      // Apply envMap to all PBR materials in the scene (for reflections)
      scene.traverse((obj) => {
        const mat: Material | undefined = (obj as any).material;
        if (
          mat &&
          (mat instanceof MeshStandardMaterial || mat instanceof MeshPhysicalMaterial)
        ) {
          mat.envMap = cachedEnv;
          mat.needsUpdate = true;
        }
      });
      this.envMap = cachedEnv;
      logger.debug("♻️ Envmap reused from cache.");
      return;
    }

    logger.debug("🌄 Attempting to load environment map...");
    EnvMap.rgbeLoader.load(
      this.props.url,
      (texture) => {
        if (this.envMap) return;
        logger.debug("✅ Envmap loaded successfully!");
        texture.mapping = EquirectangularReflectionMapping;
        // Generate a PMREM (prefiltered cubemap) from the equirectangular HDR
        const pmrem = new PMREMGenerator(renderer);
        pmrem.compileEquirectangularShader();
        const envMap = pmrem.fromEquirectangular(texture).texture;
        // Set environment and background if needed
        scene.environment = envMap;
        if (this.props.applyToBackground) {
          scene.background = envMap;
        }
        // Apply environment map to all standard/physical materials for reflections
        scene.traverse((obj) => {
          const mat: Material | undefined = (obj as any).material;
          if (
            mat &&
            (mat instanceof MeshStandardMaterial || mat instanceof MeshPhysicalMaterial)
          ) {
            mat.envMap = envMap;
            mat.needsUpdate = true;
          }
        });
        this.envMap = envMap;
        EnvMap.envCache.set(this.props.url, envMap);  // cache the generated env texture
        // Clean up original HDR texture and PMREM resources
        texture.dispose();
        pmrem.dispose();
      },
      undefined,
      (error) => {
        logger.error(`❌ Failed to load EnvMap from ${this.props.url}, error: ${error}`);
      }
    );
  }
}
