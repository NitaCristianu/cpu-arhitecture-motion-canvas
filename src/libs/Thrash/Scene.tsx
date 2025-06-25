import { Layout, LayoutProps } from "@motion-canvas/2d/lib/components";
import { computed, initial, signal } from "@motion-canvas/2d/lib/decorators";
import {
  Camera,
  Color,
  OrthographicCamera,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";
import CameraThrash from "./Camera";
import { SimpleSignal } from "@motion-canvas/core/lib/signals";
import { useLogger } from "@motion-canvas/core";
import Object from "./utils/Object";

interface RenderCallback {
  (renderer: WebGLRenderer, scene: Scene, camera: Camera): void;
}

export interface SceneProps extends LayoutProps {
  scene?: Scene;
  camera?: Camera;
  quality?: number;
  background?: string;
  zoom?: number;
  onRender?: RenderCallback;
}

export default class Scene3D extends Layout {
  @initial(null)
  @signal()
  public declare readonly camera: SimpleSignal<Camera | null, this>;

  public scene = new Scene();

  @initial(1)
  @signal()
  public declare readonly zoom: SimpleSignal<number, this>;

  public readonly renderer: WebGLRenderer;
  private readonly context: WebGLRenderingContext;
  private readonly pixelSample = new Uint8Array(4);
  public onRender: RenderCallback;

  public constructor({ onRender, ...props }: SceneProps) {
    super({ size: "100%", ...props });
    this.renderer = borrow();
    this.context = this.renderer.getContext();
    this.onRender =
      onRender ?? ((renderer, scene, camera) => renderer.render(scene, camera));
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
      this.onRender(
        renderer,
        scene,
        this.configuredCameraInstance()
      );
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

  @computed()
  private configuredRenderer(): WebGLRenderer {
    const size = this.computedSize();

    this.renderer.setSize(size.width, size.height);
    return this.renderer;
  }

  public dispose() {
    dispose(this.renderer);
  }
}

const pool: WebGLRenderer[] = [];
function borrow() {
  if (pool.length) {
    return pool.pop();
  } else {
    return new WebGLRenderer({
      canvas: document.createElement("canvas"),
      // antialias: true,
      alpha: true,
      stencil: true,
    });
  }
}
function dispose(renderer: WebGLRenderer) {
  pool.push(renderer);
}
