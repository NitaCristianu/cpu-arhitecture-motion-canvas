// from docs
import {
  Circle,
  Gradient,
  Node,
  NodeProps,
  Rect,
  colorSignal,
  initial,
  signal,
} from "@motion-canvas/2d";
import {
  Color,
  ColorSignal,
  PossibleColor,
  SignalValue,
  SimpleSignal,
  all,
  createRef,
  createSignal,
  easeInOutCubic,
  run,
  tween,
} from "@motion-canvas/core";
import gaussianblur from "../shaders/glassmorphic.glsl";

export interface SwitchProps extends NodeProps {
  initialState?: SignalValue<boolean>;
  accent?: SignalValue<PossibleColor>;
}

export class Switch extends Node {
  @initial(false)
  @signal()
  public declare readonly initialState: SimpleSignal<boolean, this>;

  @initial("#68ABDF")
  @colorSignal()
  public declare readonly accent: ColorSignal<this>;

  private isOn: boolean;
  private readonly indicatorPosition = createSignal(0);
  private readonly offColor = new Color("#242424");
  private readonly indicator = createRef<Circle>();
  private readonly indicator2 = createRef<Circle>();
  private readonly container = createRef<Rect>();
  private readonly container2 = createRef<Rect>();

  public constructor(props?: SwitchProps) {
    super({
      ...props,
    });

    this.isOn = this.initialState();
    this.indicatorPosition(this.isOn ? 110 : -110);

    this.add(
      <Circle
        position={() =>
          this.container().position().addX(this.indicatorPosition())
        }
        shaders={{
          fragment: gaussianblur,
          uniforms: {
            strength: 10,
            darkness: 5,
            opacity: 1,
          },
        }}
        stroke={"white"}
        lineWidth={3}
        ref={this.indicator}
        size={[180, 180]}
      />
    );
    this.add(
      <Circle
        position={() =>
          this.container().position().addX(this.indicatorPosition())
        }
        zIndex={2}
        stroke={"white"}
        lineWidth={3}
        fill={this.accent().alpha(0.2)}
        ref={this.indicator2}
        size={[180, 180]}
      />
    );
    this.add(
      <Rect
        stroke={"white"}
        zIndex={2}
        lineWidth={3}
        size={[400, 180]}
        radius={100}
        ref={this.container2}
        shadowColor={this.accent()}
      ></Rect>
    );
    this.container2().save();
    this.add(
      <Rect
        ref={this.container}
        fill={"white"}
        shaders={{
          fragment: gaussianblur,
          uniforms: {
            strength: 10,
            darkness: 0.5,
            borderModifier: -1,
          },
        }}
        size={[400, 180]}
        radius={100}
      ></Rect>
    );
  }

  public *toggle(duration: number) {
    yield* all(
      !this.isOn
        ? all(
            this.container2().fill(this.accent().alpha(0.1), 1),
            this.container2().shadowBlur(40, 1)
          )
        : this.container2().restore(1),
      tween(duration, (value) => {
        const oldColor = this.isOn ? this.accent() : this.offColor;
        const newColor = this.isOn ? this.offColor : this.accent();

        this.container().fill(
          Color.lerp(oldColor, newColor, easeInOutCubic(value))
        );
      }),

      tween(duration, (value) => {
        const currentPos = this.indicator().x();

        this.indicatorPosition(
          easeInOutCubic(value, currentPos, this.isOn ? -110 : 110)
        );
      })
    );
    this.isOn = !this.isOn;
  }
}
