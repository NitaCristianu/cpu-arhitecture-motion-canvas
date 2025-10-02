import { Txt, TxtProps } from "@motion-canvas/2d";
import {
  all,
  easeInBack,
  easeInCubic,
  easeInOutCubic,
  easeInSine,
  easeOutBack,
  easeOutCubic,
  easeOutSine,
  SignalValue,
} from "@motion-canvas/core";

export interface TextPresetProps extends TxtProps {
  initialVisibility?: boolean;
}

export const BASE_FONT_FAMILY = "Poppins";

type TextDefaults = Partial<TxtProps>;

function buildProps(defaults: TextDefaults, props?: TextPresetProps): TxtProps {
  const { fontFamily: defaultFamily, ...defaultRest } = defaults;
  const { fontFamily: propFamily, ...propsRest } = props ?? {};

  return {
    fontFamily: propFamily ?? defaultFamily ?? BASE_FONT_FAMILY,
    ...defaultRest,
    ...propsRest,
  } as TxtProps;
}

abstract class BasePresetText extends Txt {
  protected readonly isInitiallyVisible: boolean;

  protected constructor(defaults: TextDefaults, props?: TextPresetProps) {
    super(buildProps(defaults, props));

    this.isInitiallyVisible = props?.initialVisibility ?? true;

    if (!this.isInitiallyVisible && props?.opacity === undefined) {
      this.opacity(0);
    }

    if (!this.isInitiallyVisible && props?.scale === undefined) {
      this.scale(0);
    }
  }

  public *popIn(text?: SignalValue<string>, duration = 0.6, ease = easeOutSine) {
    this.scale(0);
    this.opacity(0);
    
    yield* all(
      this.scale(1, duration, easeOutBack),
      this.opacity(1, duration, easeOutCubic),
      this.text(text, duration, ease)
    );
  }

  public *popOut(nextText?: SignalValue<string>, duration = 0.3, ease = easeInSine) {
    yield* all(
      this.scale(0, duration, easeInBack),
      this.opacity(0, duration, easeInCubic),
      this.text(nextText || "", duration, ease)
    );

  }
}

/**
 * Glowing title used on glass panels (see src/scenes/level-1-cpu-scene-4.tsx).
 */
export class GlowPanelTitle extends BasePresetText {
  public constructor(props?: TextPresetProps) {
    super(
      {
        fontSize: 120,
        fontWeight: 600,
        fill: "white",
        shadowBlur: 50,
        shadowColor: "#fff4",
      },
      props,
    );
  }
}

/**
 * Neutral body copy for glass checklists (see src/scenes/level-1-cpu-scene-4.tsx).
 */
export class GlassBodyText extends BasePresetText {
  public constructor(props?: TextPresetProps) {
    super(
      {
        fontSize: 70,
        fontWeight: 400,
        fill: "#ededed",
      },
      props,
    );
  }
}

/**
 * Accent caption with subtle glow for footnotes (see src/scenes/level-1-cpu-scene-4.tsx).
 */
export class GlassCaption extends BasePresetText {
  public constructor(props?: TextPresetProps) {
    super(
      {
        fontSize: 50,
        fontWeight: 500,
        fill: "#fff5",
        shadowBlur: 50,
        shadowColor: "#fff4",
      },
      props,
    );
  }
}

/**
 * Compact glowing label inspired by the CPU badge (see src/scenes/level-3-cpu-scene-3.tsx).
 */
export class GlowBadge extends BasePresetText {
  public constructor(props?: TextPresetProps) {
    super(
      {
        fontSize: 120,
        fontWeight: 600,
        fill: "white",
        shadowBlur: 30,
        shadowColor: "#fff5",
      },
      props,
    );
  }
}
