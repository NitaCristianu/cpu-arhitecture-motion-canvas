import { Gradient, initial, Rect, RectProps, signal } from "@motion-canvas/2d";
import gaussianblur from "../shaders/glassmorphic.glsl";
import { Color, createRef, SignalValue, SimpleSignal, Vector2 } from "@motion-canvas/core";

export interface GlassProps extends RectProps {
  translucency?: SignalValue<number>;
  lightness?: SignalValue<number>;
  borderModifier?: SignalValue<number>;
  blurstrength?: SignalValue<number>;
  removeShadow?: SignalValue<number>;
  disableShader?: SignalValue<boolean>;
}

export class Glass extends Rect {
  @initial(0.9)
  @signal()
  public declare readonly translucency: SimpleSignal<number, this>;

  @initial(50)
  @signal()
  public declare readonly blurstrength: SimpleSignal<number, this>;

  @initial(0.2)
  @signal()
  public declare readonly lightness: SimpleSignal<number, this>;

  @initial(0)
  @signal()
  public declare readonly borderModifier: SimpleSignal<number, this>;

  @initial(1)
  @signal()
  public declare readonly removeShadow: SimpleSignal<number, this>;

  @initial(false)
  @signal()
  public declare readonly disableShader: SimpleSignal<boolean, this>;

  public shaderRect = createRef<Rect>();
  public strokeRect = createRef<Rect>();

  public constructor(props?: GlassProps) {
    super({
      radius: 32,
      shadowColor: "#fffa",
      ...props,
    });

    if (!this.disableShader()) {
      const inShadowBlurRaw = props ? props.shadowBlur : undefined;
      const inShadowBlur =
        typeof inShadowBlurRaw == "function" ? inShadowBlurRaw() : 0;
      this.add(
        <Rect
          fill="white"
          size={this.size}
          radius={this.radius}
          ref={this.shaderRect}
          shadowBlur={() =>
            inShadowBlur == 0
              ? this.removeShadow()
              : this.shadowBlur() * this.removeShadow()
          }
          shadowColor={this.shadowColor}
          shaders={{
            fragment: gaussianblur,
            uniforms: {
              strength: 10,
              opacity: this.translucency,
              darkness: this.lightness,
              borderModifier: this.borderModifier,
              blurstrength: this.blurstrength,
            },
          }}
        />
      );
      this.add(
        <Rect
          size={this.size}
          radius={this.radius}
          ref={this.strokeRect}
          stroke={
            new Gradient({
              from: new Vector2(1, 2),
              to: new Vector2(0, 0),
              stops: [
                {
                  offset: 0,
                  color: this.shadowColor().alpha(
                    this.shadowColor().alpha() - 0.5
                  ),
                },
                {
                  offset: 1,
                  color: this.shadowColor().alpha(
                    this.shadowColor().alpha() - 0.3
                  ),
                },
              ],
            })
          }
          lineWidth={2}
        />
      );
    }
  }
}
