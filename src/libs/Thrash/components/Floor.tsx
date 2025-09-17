import {
  BoxGeometry,
  Color,
  MeshPhysicalMaterial,
  Object3D,
  PlaneGeometry,
  Mesh as ThreeMesh,
  Vector3,
} from "three";
import Mesh from "../objects/Mesh";
import { MeshProps } from "../objects/Mesh";
import { Reflector } from "three/examples/jsm/objects/Reflector";
import Scene3D from "../Scene";
import ObjectBase, { ObjectProps } from "../utils/Object";

export interface FloorProps extends ObjectProps {}

export default class Floor extends ObjectBase {
  private tint!: ThreeMesh; // dark glossy plane
  private mirror!: Reflector; // live reflection

  constructor(props: FloorProps = {}) {
    // keep the Automatic localPosition signal from your base class
    super({ localPosition: new Vector3(0, -0.4, 0), ...props });

    const geo = new PlaneGeometry(30, 30);

    /* 1️⃣ – tint plane (semi-gloss) */
    const tintMat = new MeshPhysicalMaterial({
      color: 0x000,
      metalness: 1,
      roughness: 0.6,
      clearcoat: 1,
      clearcoatRoughness: 0.6,
      envMapIntensity: 0.1,
    });
    this.tint = new ThreeMesh(geo, tintMat);
    this.tint.receiveShadow = true;
    this.tint.rotation.x = -Math.PI / 2;
    this.tint.renderOrder = 0;

    /* 2️⃣ – reflector plane (transparent mirror) */
    this.mirror = new Reflector(geo, {
      clipBias: 0.01,
      textureWidth: window.innerWidth * window.devicePixelRatio * 0.5, // 50% width
      textureHeight: window.innerHeight * window.devicePixelRatio * 0.5, // 50% height
      color: 0xffffff,
    }) as Reflector;
    this.mirror.receiveShadow = true;
    this.mirror.rotation.x = -Math.PI / 2;
    (this.mirror.material as any).transparent = true;
    (this.mirror.material as any).opacity = 0.3; // 30% opacity for reflection
    this.mirror.renderOrder = 1;
  }

  /** Add both planes to the scene */
  public override init(master: Scene3D, parent: Object3D): void {
    const y = this.localPosition().y;
    this.tint.position.y = y;
    this.mirror.position.y = y + 0.001; // slight offset to avoid z-fight

    const mat = this.mirror.material as any;
    mat.onBeforeCompile = (shader: any) => {
      // 1) Declare a blurAmount uniform (if you haven't already)
      shader.fragmentShader = `
#define pow2(x) (x * x)

uniform vec3 color;
uniform sampler2D tDiffuse;
uniform float blurAmount;

varying vec4 vUv;

#include <logdepthbuf_pars_fragment>

const float pi = 3.141592653589793;
const int samples = 25;
const float sigma = 5.;

float gaussian(vec2 i) {
    return 1.0 / (2.0 * pi * pow2(sigma)) * exp(-((pow2(i.x) + pow2(i.y)) / (2.0 * pow2(sigma))));
}

vec3 blur(sampler2D sp, vec2 uv, vec2 scale) {
    vec3 col = vec3(0.0);
    float accum = 0.0;

    for (int x = -samples / 2; x < samples / 2; ++x) {
        for (int y = -samples / 2; y < samples / 2; ++y) {
            vec2 offset = vec2(float(x), float(y));
            float weight = gaussian(offset);
            col += texture2D(sp, uv + scale * offset).rgb * weight;
            accum += weight;
        }
    }

    return col / accum;
}

float blendOverlay(float base, float blend) {
    return (base < 0.5)
        ? (2.0 * base * blend)
        : (1.0 - 2.0 * (1.0 - base) * (1.0 - blend));
}

vec3 blendOverlay(vec3 base, vec3 blend) {
    return vec3(
        blendOverlay(base.r, blend.r),
        blendOverlay(base.g, blend.g),
        blendOverlay(base.b, blend.b)
    );
}

void main() {
    #include <logdepthbuf_fragment>

    vec2 uv = vUv.xy / vUv.w;
    vec2 ps = vec2(blurAmount); // pixel scale

    vec3 blurred = blur(tDiffuse, uv, ps);
    vec3 blended = blendOverlay(blurred, color);

    gl_FragColor = vec4(blended, .8); // transparent reflection

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}

  `;
      shader.uniforms.blurAmount = { value: 1 / 700 };
      shader.uniforms.color = { value: new Color(0.3, 0.3, 0.3) }; // white = no tint
    };

    parent.add(this.tint);
    parent.add(this.mirror);
  }
}
