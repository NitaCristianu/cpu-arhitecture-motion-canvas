import { Layout, LayoutProps } from "@motion-canvas/2d/lib/components";
import { computed, initial, signal } from "@motion-canvas/2d/lib/decorators";
import {
  ACESFilmicToneMapping,
  Camera,
  Color,
  OrthographicCamera,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
  Vector2 as ThreeVector2,
} from "three";
import CameraThrash from "./Camera";
import { SimpleSignal } from "@motion-canvas/core/lib/signals";
import ThrashCamera from "../Thrash/Camera";
import Object from "./utils/Object";
import { Vector2 } from "@motion-canvas/core";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";

interface RenderCallback {
  (renderer: WebGLRenderer, scene: Scene, camera: Camera): void;
}

export interface SceneProps extends LayoutProps {
  scene?: Scene;
  camera?: Camera;
  background?: string;
  onRender?: RenderCallback;
}

export default class Scene3D extends Layout {
  @initial(null)
  @signal()
  public declare readonly camera: SimpleSignal<Camera | null, this>;

  public scene = new Scene();
  public composer: EffectComposer;

  @initial(0x000)
  @signal()
  public declare readonly background: SimpleSignal<Color, this>;

  public readonly renderer: WebGLRenderer;
  private readonly context: WebGLRenderingContext;
  public onRender: RenderCallback;
  private composerInitialized = false;

  public projectToScreen(point3D: Vector3): Vector2 {
    const cameraNode: CameraThrash = this.findFirst(
      (child) => child instanceof CameraThrash
    ) as any;
    if (!cameraNode) return Vector2.zero;

    const camera = cameraNode.configuredCamera();
    const projected = point3D.clone().project(camera); // NDC [-1,1]

    const { width, height } = this.computedSize();

    return new Vector2(
      projected.x * 0.5 * width, // range: [-width/2, width/2]
      -projected.y * 0.5 * height + 475 // flip Y to match screen space
    );
  }

  public constructor({ onRender, ...props }: SceneProps) {
    super({ size: "100%", ...props });
    this.renderer = new WebGLRenderer({
      canvas: document.createElement("canvas"),
      antialias: true,
      alpha: true,
      stencil: true,
    });

    this.context = this.renderer.getContext();
    this.onRender =
      onRender ??
      ((renderer, scene, camera) => {
        if (!this.composerInitialized) {
          this.initComposer(scene, camera, renderer);
          this.composerInitialized = true;
        }
        this.composer.render();
      });
      // this.scene.background = new Color(this.background());
  }

  public init() {
    this.children().forEach((child) => {
      if (child instanceof Object) {
        child.init(this, this.scene);
      }
    });
  }

  protected override draw(context: CanvasRenderingContext2D) {
    const { width, height } = this.computedSize();
    const scene = this.scene;
    const renderer = this.configuredRenderer();

    if (width > 0 && height > 0) {
      this.onRender(renderer, scene, this.configuredCameraInstance());
      // context.imageSmoothingEnabled = false;
      context.drawImage(
        renderer.domElement,
        0,
        0,
        width,
        height,
        width / -2,
        height / -2,
        width,
        height
      );
    }

    super.draw(context);
  }

  private configuredCameraInstance(): Camera {
    const camNode = this.findFirst((child) => child instanceof CameraThrash);
    if (camNode instanceof CameraThrash) {
      return camNode["configuredCamera"](); // force computed access
    }
    return new PerspectiveCamera(); // fallback
  }

  private initComposer(scene: Scene, camera: Camera, renderer: WebGLRenderer) {
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    composer.addPass(
      new UnrealBloomPass(
        new ThreeVector2(this.width(), this.height()),
        0.6,
        0.8,
        0.4
      )
    );
    const fxaaPass = new ShaderPass(FXAAShader);
    fxaaPass.material.uniforms["resolution"].value.set(
      1 / window.innerWidth,
      1 / window.innerHeight
    );
    composer.addPass(fxaaPass);

    const outputPass = new OutputPass();
    composer.addPass(outputPass);
    this.composer = composer;
    this.composerInitialized = true;
  }

  @computed()
  private configuredRenderer(): WebGLRenderer {
    const size = this.computedSize();

    const renderer = this.renderer;

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = SRGBColorSpace;

    renderer.setSize(size.width, size.height);
    renderer.setPixelRatio(window.devicePixelRatio);

    return renderer;
  }

  public getCameraClass(): ThrashCamera {
    return this.findFirst((child) => child instanceof ThrashCamera) as any;
  }
}
