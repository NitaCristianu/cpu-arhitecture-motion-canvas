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

uniform float strength;  // Control the spread of the Gaussian
uniform float opacity; // Opacity
uniform float darkness; // How dark the glassmorphic will be
uniform float blurstrength; // car wheel's diameter
uniform float borderModifier; // Controls border hue

float rand(vec2 c) {
    return fract(sin(dot(c.xy, vec2(12.9898f, 78.233f))) * 43758.5453f);
}
float gaussian(float x, float y, float sigma) {
    float r2 = x * x + y * y;
    return exp(-r2 / (2.0f * sigma * sigma)) / (2.0f * 3.141592653589793f * sigma * sigma);
}

void main() {
    vec4 color = vec4(0.f);
    float total = 0.0f;

    // Calculate the number of samples per dimension
    int grid_side = int(blurstrength); // Use total samples directly
    float scale = float(grid_side) / resolution.x; // Normalize by resolution
    // 1) Normalize your texel step once up front
    vec2 texel = 1.0f / resolution;    // one pixel in UV-space
    int R = int(blurstrength) / 2;    // half-kernel
    for(int i = -R; i <= R; ++i) {
        for(int j = -R; j <= R; ++j) {
            vec2 off = vec2(float(i), float(j)) * texel;
            float w = gaussian(float(i), float(j), strength);
            color += texture(destinationTexture, destinationUV + off) * w;
            total += w;
        }
    }

    if(total > 0.0f) {
        vec4 noiseTexture = vec4(rand(sourceUV));
        vec4 fade = smoothstep(0.0f, 2.1f, vec4(distance(sourceUV - .5f, vec2(0.f))) * resolution.x / resolution.y);
        outColor = color / (total - .01f) * (darkness + 1.f) + noiseTexture * 0.03f * (darkness + 1.f) + fade / 4.f * (darkness + 1.f + borderModifier);  // Normalize the color by total weight
        outColor.a = texture(sourceTexture, sourceUV).a * opacity;
    } else {
        outColor = texture(destinationTexture, screenUV);  // Fallback to black if no samples are accumulated
    }
}