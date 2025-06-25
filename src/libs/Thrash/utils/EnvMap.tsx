import Object, { ObjectProps } from "../utils/Object";
import {
  PMREMGenerator,
  Texture,
  TextureLoader,
  EquirectangularReflectionMapping,
  WebGLRenderer,
  Scene,
  Object3D,
} from "three";
import Scene3D from "../Scene";
import { useLogger } from "@motion-canvas/core";

export interface EnvMapProps extends ObjectProps {
  url: string;
  applyToBackground?: boolean;
}

export default class EnvMap extends Object {
  private envMap: Texture | null = null;

  public constructor(private props: EnvMapProps) {
    super(props);
  }

  public override async init(master: Scene3D, parent : Object3D) {
    const renderer = master.renderer;
    const scene = master.scene;

    const loader = new TextureLoader();
    const texture = await loader.loadAsync(this.props.url);
    texture.mapping = EquirectangularReflectionMapping;

    const pmrem = new PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const envMap = pmrem.fromEquirectangular(texture).texture;

    scene.environment = envMap;

    if (this.props.applyToBackground) {
      scene.background = envMap;
    }

    useLogger().debug(`Texture found! ${envMap ?? envMap.id}`);
    this.envMap = envMap;

    texture.dispose();
    pmrem.dispose();
  }
}
