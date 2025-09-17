export interface ShaderBackgroundProps extends RectProps {
  color0?: SignalValue<Color>;
  color1?: SignalValue<Color>;
  color2?: SignalValue<Color>;
  color3?: SignalValue<Color>;
}

const BACKGROUND_SHADER = `#version 300 es
precision highp float;

// mandatory inputs
in vec2 screenUV;
in vec2 sourceUV;
in vec2 destinationUV;
out vec4 outColor;

// mandatory uniforms
uniform float time;
uniform float deltaTime;
uniform float framerate;
uniform int frame;
uniform vec2 resolution;
uniform sampler2D sourceTexture;
uniform sampler2D destinationTexture;
uniform mat4 sourceMatrix;
uniform mat4 destinationMatrix;

// your custom color uniforms now as vec4
uniform vec4 colorYellow;
uniform vec4 colorDeepBlue;
uniform vec4 colorRed;
uniform vec4 colorBlue;

#define S(a,b,t) smoothstep(a,b,t)

mat2 Rot(float a){
  float s = sin(a), c = cos(a);
  return mat2(c, -s, s, c);
}

vec2 hash(vec2 p){
  p = vec2(dot(p, vec2(2127.1,81.17)),
           dot(p, vec2(1269.5,283.37)));
  return fract(sin(p)*43758.5453);
}

float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(
    mix(dot(-1.0+2.0*hash(i+vec2(0,0)), f-vec2(0,0)),
        dot(-1.0+2.0*hash(i+vec2(1,0)), f-vec2(1,0)), u.x),
    mix(dot(-1.0+2.0*hash(i+vec2(0,1)), f-vec2(0,1)),
        dot(-1.0+2.0*hash(i+vec2(1,1)), f-vec2(1,1)), u.x),
    u.y
  );
}

void main(){
  vec2 uv = screenUV;
  float ratio = resolution.x/resolution.y;
  vec2 tuv = uv - 0.5;
  tuv.y /= ratio;

  float degree = noise(vec2(time*0.1, tuv.x*tuv.y));
  tuv *= Rot(radians((degree-0.5)*720.0 + 180.0));
  tuv.y *= ratio;

  float freq = 5.0, amp = 30.0, spd = time*2.0;
  tuv.x += sin(tuv.y*freq + spd)/amp;
  tuv.y += sin(tuv.x*freq*1.5 + spd)/(amp*0.5);

  // extract rgb from the vec4 uniforms:
  vec3 y = colorYellow.rgb;
  vec3 db = colorDeepBlue.rgb;
  vec3 r = colorRed.rgb;
  vec3 b = colorBlue.rgb;

  vec3 layer1 = mix(y, db, S(-0.3, 0.2, (tuv*Rot(radians(-5.0))).x));
  vec3 layer2 = mix(r,  b, S(-0.3, 0.6, (tuv*Rot(radians(-5.0))).x));
  vec3 comp   = mix(layer1, layer2, S(0.5, -0.3, tuv.y));

  float dist = 1.0 - length((uv - 0.5) * vec2(ratio,1.0));
  float fade = smoothstep(0.0,1.0,dist) * 1.2;
  comp *= fade;

  outColor = vec4(comp, 1.0);
}
`;

import {
  Rect,
  RectProps,
  colorSignal,
  initial,
  signal,
} from "@motion-canvas/2d";
import { Color, ColorSignal, SignalValue } from "@motion-canvas/core";

export const PRESETS = {
  vivid:   ["#f5c38b", "#316fe9", "#e31c1c", "#5dbdf3"],
  sunset:  ["#FF6F61", "#D7263D", "#2E294E", "#1B998B"],
  ocean:   ["#00C9FF", "#92FE9D", "#0072FF", "#00B4DB"],
  ram:     ["#1F2F2F", "#2A5F6A", "#3A7E4E", "#102430"],
  ramDark: [
    "#4B2E19", // deep copper accent
    "#1F2F38", // dark bluish-slate
    "#0A2231", // navy charcoal
    "#0C3A4B", // muted teal-blue
  ],
} as const;

export interface ShaderBackgroundProps extends RectProps {
  preset?: keyof typeof PRESETS;
  color0?: SignalValue<Color>;
  color1?: SignalValue<Color>;
  color2?: SignalValue<Color>;
  color3?: SignalValue<Color>;
}


export class ShaderBackground extends Rect {
  @initial(PRESETS.ocean[0])
  @colorSignal()
  public declare readonly color0: ColorSignal<this>;

  @initial(PRESETS.ocean[1])
  @colorSignal()
  public declare readonly color1: ColorSignal<this>;

  @initial(PRESETS.ocean[2])
  @colorSignal()
  public declare readonly color2: ColorSignal<this>;

  @initial(PRESETS.ocean[3])
  @colorSignal()
  public declare readonly color3: ColorSignal<this>;

  public constructor(props: ShaderBackgroundProps = {}) {
    // pick the preset array (or default to vivid)
    const presetColors = PRESETS[props.preset ?? "vivid"];

    super({
      ...props,
      // if user didn’t override individual signals, seed them from preset
      size : '100%'
    });
    this.shaders({
      fragment: BACKGROUND_SHADER,
      uniforms: {
        colorYellow: this.color0,
        colorDeepBlue: this.color1,
        colorRed: this.color2,
        colorBlue: this.color3,
      },
    });

    // override any missing custom signals with preset
    if (props.preset) {
      // only set if user didn’t pass color0 explicitly
      this.color0(presetColors[0]);
      this.color1(presetColors[1]);
      this.color2(presetColors[2]);
      this.color3(presetColors[3]);
    }
  }
}
