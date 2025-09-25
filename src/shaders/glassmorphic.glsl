#version 300 es
precision highp float;

in vec2 screenUV;
in vec2 sourceUV;
in vec2 destinationUV;

out vec4 outColor;

uniform float time;
uniform float deltaTime;
uniform float framerate;
uniform int frame;
uniform vec2 resolution;
uniform sampler2D sourceTexture;
uniform sampler2D destinationTexture;
uniform mat4 sourceMatrix;
uniform mat4 destinationMatrix;

uniform float strength;  // legacy, kept for compatibility
uniform float opacity;   // Opacity
uniform float darkness;  // How dark the glassmorphic panel will be
uniform float blurstrength; // Controls blur radius similar to CSS backdrop blur
uniform float borderModifier; // Controls rim intensity

const int POISSON_COUNT = 16;
const vec2 POISSON[POISSON_COUNT] = vec2[](
  vec2(-0.94201624, -0.39906216),
  vec2(0.94558609, -0.76890725),
  vec2(-0.09418410, -0.92938870),
  vec2(0.34495938, 0.29387760),
  vec2(-0.91588580, 0.45771432),
  vec2(-0.81544232, -0.87912464),
  vec2(-0.38277543, 0.27676845),
  vec2(0.97484398, 0.75648379),
  vec2(0.44323325, -0.97511554),
  vec2(0.53742981, -0.47373420),
  vec2(-0.26496911, -0.41893023),
  vec2(0.79197514, 0.19090188),
  vec2(-0.24188840, 0.99706507),
  vec2(-0.81409955, 0.91437590),
  vec2(0.19984126, -0.78641367),
  vec2(0.14383161, -0.14100790)
);

const int RING_COUNT = 4;
const float RING_RADII[RING_COUNT] = float[](0.35, 0.75, 1.25, 1.75);
const float RING_WEIGHTS[RING_COUNT] = float[](0.10, 0.09, 0.08, 0.07);

float rand(vec2 c) {
  return fract(sin(dot(c.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

mat2 rot(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}

void main() {
  vec2 safeResolution = max(resolution, vec2(1.0));
  vec2 texel = 1.0 / safeResolution;

  // Map blurstrength to a very wide radius so even mid values produce dramatic blur.
  float pixelRadius = clamp(blurstrength * 12.0 + 60.0, 60.0, 1200.0);

  // Rotate the Poisson disk each frame to avoid directional bias.
  float jitter = rand(vec2(float(frame % 1024), sourceUV.x + sourceUV.y));
  mat2 rotation = rot(jitter * 6.28318530718);

  float centreWeight = 0.12;
  vec3 accum = texture(destinationTexture, destinationUV).rgb * centreWeight;
  float weightSum = centreWeight;

  for (int ring = 0; ring < RING_COUNT; ++ring) {
    float ringRadius = pixelRadius * RING_RADII[ring];
    float ringWeight = RING_WEIGHTS[ring];
    for (int i = 0; i < POISSON_COUNT; ++i) {
      vec2 offset = rotation * (POISSON[i] * ringRadius) * texel;
      vec3 sampleColor = texture(destinationTexture, destinationUV + offset).rgb;
      accum += sampleColor * ringWeight;
      weightSum += ringWeight;
    }
  }

  vec3 baseColor = accum / max(weightSum, 1e-4);

  // Compress highlights so white backgrounds remain soft and neutral.
  float luma = dot(baseColor, vec3(0.299, 0.587, 0.114));
  float highlight = smoothstep(0.48, 0.88, luma);
  vec3 neutralized = mix(vec3(luma), baseColor, 0.38);
  vec3 compressed = mix(neutralized, vec3(0.94, 0.98, 1.05), highlight * 0.64);

  // Gentle cool tint reminiscent of Apple glass.
  vec3 tint = vec3(0.9, 0.97, 1.08);
  vec3 tinted = mix(compressed, compressed * tint + vec3(0.012, 0.024, 0.052), 0.35);

  // Edge lighting and global shading cues.
  float inset = min(min(destinationUV.x, 1.0 - destinationUV.x),
                    min(destinationUV.y, 1.0 - destinationUV.y));
  float rim = (1.0 - smoothstep(0.0, 0.055, inset)) * (0.14 + borderModifier * 0.12);
  float topGlow = smoothstep(0.0, 0.65, 1.0 - destinationUV.y) * 0.24;
  float bottomShade = smoothstep(0.25, 1.1, destinationUV.y) * 0.09;

  // Subtle moving grain keeps the blur lively.
  vec2 grainBase = sourceUV * safeResolution * 0.95;
  vec3 grain = vec3(
      rand(grainBase + vec2(time * 1.3, -time * 0.7)),
      rand(grainBase + vec2(-time * 1.1, time * 0.5)),
      rand(grainBase + vec2(time * 0.6, time * 1.4))
    ) - 0.5;
  float grainPulse = 0.02 + 0.012 * abs(sin(time * 0.6));
  vec3 grainColor = grain * grainPulse;

  vec3 glass = tinted;
  glass += rim * vec3(0.8, 0.86, 1.0);
  glass += topGlow * vec3(0.38, 0.45, 0.66);
  glass -= bottomShade * vec3(0.08, 0.1, 0.18);
  glass += grainColor;

  float lightBoost = max(0.25, 1.0 + darkness * 0.8);
  glass *= lightBoost;
  glass = clamp(glass, 0.0, 1.0);

  float alpha = texture(sourceTexture, sourceUV).a * opacity;
  outColor = vec4(glass, alpha);
}


