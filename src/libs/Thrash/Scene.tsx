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
  FogExp2,
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
  public composer: EffectComposer | null = null;

  @initial(0x000)
  @signal()
  public declare readonly background: SimpleSignal<Color, this>;

  public readonly renderer: WebGLRenderer;
  private readonly context: WebGLRenderingContext;
  public onRender: RenderCallback;
  private composerInitialized = false;
  private static sharedRenderer: WebGLRenderer | null = null;
  private static sharedContext: WebGLRenderingContext | null = null;
  private static rendererUsers = 0;


  public projectToScreen(point3D: Vector3): Vector2 {
    const cameraNode: CameraThrash = this.findFirst(
      (child) => child instanceof CameraThrash
    ) as any;
    if (!cameraNode) return Vector2.zero;

    const camera = cameraNode.configuredCamera();
    const projected = point3D.clone().project(camera); // NDC [-1,1]

    const size = this.computedSize();
    const width = size.width || 4096;
    const height = size.height || 2048;
    const yOffset = height * (475 / 2048);

    return new Vector2(
      projected.x * 0.5 * width, // range: [-width/2, width/2]
      -projected.y * 0.5 * height + yOffset // flip Y to match screen space
    );
  }

  public constructor({ onRender, ...props }: SceneProps) {
    super({ size: "100%", ...props });
    if (Scene3D.sharedRenderer) {
      this.renderer = Scene3D.sharedRenderer;
      this.context = Scene3D.sharedContext!;
    } else {
      this.renderer = new WebGLRenderer({
        canvas: document.createElement("canvas"),
        antialias: true,
        alpha: true,
        stencil: true,
      });
      this.context = this.renderer.getContext() as WebGLRenderingContext;
      Scene3D.sharedRenderer = this.renderer;
      Scene3D.sharedContext = this.context;
    }
    Scene3D.rendererUsers += 1;

    const fogColor = new Color(0x05060a);
    this.scene.fog = new FogExp2(fogColor, 0.02);
    this.scene.background = fogColor.clone();
    this.onRender =
      onRender ??
      ((renderer, scene, camera) => {
        if (!this.composerInitialized) {
          this.initComposer(scene, camera, renderer);
          this.composerInitialized = true;
        }
        this.composer?.render();
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
      const sourceWidth = renderer.domElement.width || width;
      const sourceHeight = renderer.domElement.height || height;
      context.drawImage(
        renderer.domElement,
        0,
        0,
        sourceWidth,
        sourceHeight,
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

    const renderSize = renderer.getSize(new ThreeVector2());
    composer.addPass(
      new UnrealBloomPass(
        renderSize.clone(),
        0.6,
        0.8,
        0.4
      )
    );
    const fxaaPass = new ShaderPass(FXAAShader);
    const fxaaResolution = fxaaPass.material.uniforms["resolution"].value;
    fxaaResolution.set(
      1 / Math.max(renderSize.x, 1),
      1 / Math.max(renderSize.y, 1)
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

    const fallbackWidth =
      typeof window !== "undefined" && window.innerWidth
        ? Math.min(window.innerWidth, 1920)
        : 1920;
    const fallbackHeight =
      typeof window !== "undefined" && window.innerHeight
        ? Math.min(window.innerHeight, 1080)
        : 1080;

    const targetWidth = Math.max(1, Math.round(size.width || fallbackWidth));
    const targetHeight = Math.max(1, Math.round(size.height || fallbackHeight));

    renderer.setSize(targetWidth, targetHeight);
    const deviceRatio =
      typeof window !== "undefined" && window.devicePixelRatio
        ? window.devicePixelRatio
        : 1;
    const pixelRatio = Math.min(deviceRatio, 2);
    renderer.setPixelRatio(pixelRatio);

    return renderer;
  }

  public getCameraClass(): ThrashCamera {
    return this.findFirst((child) => child instanceof ThrashCamera) as any;
  }

  public override dispose(): void {
    if (this.composer) {
      this.composer.passes?.forEach((pass: any) => pass?.dispose?.());
      this.composer.dispose?.();
      this.composer = null;
      this.composerInitialized = false;
    }

    if (Scene3D.rendererUsers > 0) {
      Scene3D.rendererUsers -= 1;
    }

    if (Scene3D.rendererUsers === 0 && Scene3D.sharedRenderer) {
      Scene3D.sharedRenderer.dispose();
      const gl = Scene3D.sharedContext;
      const loseContext = gl
        ? (gl.getExtension("WEBGL_lose_context") as
            | { loseContext?: () => void }
            | null)
        : null;
      loseContext?.loseContext?.();
      Scene3D.sharedRenderer = null;
      Scene3D.sharedContext = null;
    }

    super.dispose();
  }
}
