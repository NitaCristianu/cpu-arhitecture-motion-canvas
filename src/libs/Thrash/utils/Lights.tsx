import {
  DirectionalLight,
  HemisphereLight,
  AmbientLight,
  Scene,
  FogExp2,
  Color,
  Mesh as ThreeMesh,
  SphereGeometry,
  MeshBasicMaterial,
  WebGLRenderer,
  Camera,
  PCFSoftShadowMap,
  Vector2,
} from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { SAOPass } from "three/examples/jsm/postprocessing/SAOPass";
import Object, { ObjectProps } from "./Object";

export interface LightsProps extends ObjectProps {}

export default class Lights extends Object {
  // Three-point lights
  public keyLight = new DirectionalLight(0xffe0dd, 2.0);
  public hemiLight = new HemisphereLight(0x406080, 0x202020, 0.3);
  public ambientLight = new AmbientLight(0x404040, 0.2);  
  public rimLight = new DirectionalLight(0x233099, 2.5);

  // Volumetric/fog & god rays
  private sunMesh!: ThreeMesh;
  private composer!: EffectComposer;

  public constructor(props: LightsProps = {}) {
    super(props);
  }

  public InitLight() {
    // Key light – warm, soft shadows
    this.keyLight.position.set(5, 10, 5);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(2048, 2048);
    this.keyLight.shadow.camera.near = 1;
    this.keyLight.shadow.camera.far = 50;
    this.keyLight.shadow.bias = -0.0001;
    this.core.add(this.keyLight);

    // Hemisphere fill for subtle ambient
    this.core.add(this.hemiLight);
    this.core.add(this.ambientLight);

    // Rim light – cool kicker from behind
    this.rimLight.position.set(-8, 6, -4);
    this.rimLight.castShadow = false;
    this.core.add(this.rimLight);
  }

  private initFogAndEffects(
    scene: Scene,
    camera: Camera,
    renderer: WebGLRenderer
  ) {
    // Soft exponential fog
    scene.fog = new FogExp2(0x000010, 0.2);

    // Ensure soft shadows on renderer
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;

    // Sun mesh for god-rays origin (invisible)
    this.sunMesh = new ThreeMesh(
      new SphereGeometry(0.6, 32, 32),
      new MeshBasicMaterial({ color: 0xffffcc })
    );
    this.sunMesh.position.set(0, 10, -5);
    scene.add(this.sunMesh);

    // Post-processing chain
    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(scene, camera));

    // Bloom (soft glow)
    const bloom = new UnrealBloomPass(
      new Vector2(renderer.domElement.width, renderer.domElement.height),
      0.5, // strength
      0.4, // radius
      0.8  // threshold
    );
    bloom.threshold = 0.85;
    this.composer.addPass(bloom);

    // SSAO (ambient occlusion)
    const sao = new SAOPass(scene, camera);
    sao.params.saoIntensity = 1.6;
    sao.params.saoBlurRadius = 8;
    sao.params.saoKernelRadius = 12;
    this.composer.addPass(sao);

    // God Rays (commented: enable if desired)
    /*
    const godrays = new GodRaysPass(scene, camera, this.sunMesh, {
      density: 0.9,
      decay: 0.95,
      weight: 0.6,
      samples: 60,
    });
    this.composer.addPass(godrays);
    */
  }

  public override init(master: any, parent: any) {
    super.init(master, parent);
    this.InitLight();

    const scene: Scene = master.scene;
    const camera: Camera = master.camera();
    const renderer: WebGLRenderer = master.renderer;
    if (scene && camera && renderer) {
      this.initFogAndEffects(scene, camera, renderer);

      // Hook into the render loop
      const originalRender = master.onRender;
      master.onRender = (r: any, s: any, c :any) => {
        originalRender(r, s, c);
        this.composer.render();
      };
    }
  }
}
