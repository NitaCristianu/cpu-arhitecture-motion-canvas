import { Code, Gradient, Icon, makeScene2D, Node, Ray, Rect, Txt } from "@motion-canvas/2d";
import {
  all,
  chain,
  Color,
  createRefArray,
  createSignal,
  easeInCubic,
  easeInOutBack,
  easeOutBack,
  easeOutCubic,
  loop,
  PossibleColor,
  PossibleVector2,
  range,
  run,
  sequence,
  useRandom,
  Vector2,
  waitFor,
  waitUntil,
} from "@motion-canvas/core";
import { ShaderBackground } from "../components/background";
import { Bitnumber } from "../utils/bitnumber";
import { Glass } from "../components/GlassRect";
import { AsmHighlighter } from "../utils/AsmHighlighter";
export default makeScene2D(function* (view) {

  view.fill("#010a1b");

  view.fontFamily("Poppins");

  const title = (

    <Txt

      fill={"#fff"}

      shadowBlur={30}

      shadowColor={"#fffa"}

      fontWeight={200}

      opacity={0.5}

      y={-1500}

      fontFamily={"Poppins"}

      fontSize={120}

    />

  ) as Txt;

  view.add(title);

  const container = (<Node scale={0.9} zIndex={1} />) as Node;

  view.add(container);

  const bgr = <ShaderBackground opacity={0.4} />;

  view.add(bgr);

  yield* waitUntil("begin");

  const generator = useRandom(0);

  const layoutCells = createRefArray<Rect>();

  const OldlayoutPalette = range(32).map((index) => {

    if (index < 4) return "#facc15";

    if (index < 8) return "#c738ffff";

    return "#60a5fa";

  });

  const NewlayoutPalette = range(32).map((index) => {

    if (index < 8) return "#ff3864";

    if (index < 12) return "#facc15";

    if (index < 22) return "#2dd4bf";

    return "#60a5fa";

  });

  const bitslayouttext = createSignal<string>("8-bit Instruction Layout");

  const bitLayout = (

    <Rect

      layout

      direction={"row"}

      alignItems={"center"}

      justifyContent={"center"}

      padding={24}

      radius={30}

      y={900}

      scale={0.9}

      opacity={0}

      fill={"#010a1b55"}

      shadowBlur={36}

      shadowColor={"#0009"}

      zIndex={0}

      lineWidth={2}

      stroke={

        new Gradient({

          from: new Vector2(1000, 200),

          to: new Vector2(0, 0),

          stops: [

            {

              offset: 0,

              color: "#fffa",

            },

            {

              offset: 1,

              color: "#fff2",

            },

          ],

        })

      }

    >

      <Txt

        fill={"white"}

        text={bitslayouttext}

        marginRight={30}

        opacity={0.8}

      ></Txt>

      {OldlayoutPalette.map((hex, i) => {

        const color = new Color(hex);

        return (

          <Rect

            ref={layoutCells}

            margin={i < 8 ? 5 : 0}

            width={i < 8 ? 28 : 0}

            height={i < 8 ? 28 : 0}

            radius={6}

            fill={hex}

            opacity={0.25}

            shadowBlur={0}

            shadowColor={color.alpha(0.7)}

          />

        );

      })}

    </Rect>

  ) as Rect;

  view.add(bitLayout);

  const opcode = (<Bitnumber bits={4} y={50} x={-700} />) as Bitnumber;

  const operand = (<Bitnumber bits={4} y={50} x={700} />) as Bitnumber;

  container.add(opcode);

  container.add(operand);

  yield all(

    title.y(-800, 1),

    title.text("Instruction Register (IR) Decoding", 1)

  );

  yield* sequence(0.4, opcode.pop(), operand.pop());

  yield* sequence(0.4, opcode.scale(2, 1), operand.scale(2, 1));

  const byte_titles = createRefArray<Txt>();

  const highlightByte = function* (

    bitgroups: Bitnumber[],

    tag: string,

    color: PossibleColor,

    reverse: boolean = true

  ) {

    const C = new Color(color);

    const ref = bitgroups[0];

    const title = (

      <Txt

        fill={C.brighten(3)}

        shadowBlur={30}

        shadowColor={C.alpha(0.7).darken(0.5)}

        position={() => ref.position().add([100, -200])}

        fontFamily={"Poppins"}

        opacity={0}

        zIndex={2}

        text={tag}

        fontSize={120}

        ref={byte_titles}

      />

    ) as Txt;

    container.add(title);

    const baseStates = bitgroups.map((group) => ({

      blur: group.shadowBlur(),

      boxes: group.boxes.map((box) => ({

        box,

        opacity: box.opacity(),

      })),

    }));

    yield* all(

      title.opacity(1, 0.5, easeOutCubic),

      ...bitgroups.map((group) =>

        all(

          group.shadowBlur(100, 0.5, easeOutCubic),

          ...group.boxes.map((box) => box.opacity(1, 0.5, easeOutCubic))

        )

      )

    );

    if (!reverse) {

      return;

    }

    yield* waitFor(0.4);

    yield* all(

      title.opacity(0, 0.3, easeInCubic),

      ...bitgroups.map((group, gi) =>

        all(

          group.shadowBlur(baseStates[gi]["blur"], 0.3, easeInCubic),

          ...group.boxes.map((box, bi) =>

            box.opacity(baseStates[gi]["boxes"][bi]["opacity"], 0.3, easeInCubic)

          )

        )

      )

    );

    title.remove();

  };

  const bit_titles = createRefArray<Txt>();

  const highlightBit = function* (

    bitgroup: Bitnumber,

    bitIndex: number,

    label: string,

    color: PossibleColor,

    reverse: boolean = true

  ) {

    const bitRect = bitgroup.boxes[bitIndex];

    if (!bitRect) return;

    const highlightColor = new Color(color);

    const baseFill = bitRect.fill();

    const baseShadowBlur = bitRect.shadowBlur();

    const baseShadowColor = bitRect.shadowColor();

    const baseOpacity = bitRect.opacity();

    const otherBoxes = bitgroup.boxes.filter((_, index) => index !== bitIndex);

    const otherOpacities = otherBoxes.map((box) => box.opacity());

    const fadedOpacity = 0.2;

    const callout = (

      <Txt

        text={label}

        fontFamily={"Poppins"}

        fontSize={70}

        fontWeight={500}

        fill={highlightColor.brighten(1).alpha(0.9)}

        shadowBlur={40}

        opacity={0}

        shadowColor={highlightColor.alpha(0.5)}

        zIndex={5}

        ref={bit_titles}

      />

    ) as Txt;

    callout.absolutePosition(() =>

      bitRect.absolutePosition().addY(bitIndex % 2 == 0 ? 300 : -300)

    );

    view.add(callout);

    yield* all(

      bitRect.fill(highlightColor.alpha(0.3), 0.4, easeOutCubic),

      bitRect.shadowBlur(90, 0.4, easeOutCubic),

      bitRect.shadowColor(highlightColor.alpha(0.9), 0.4, easeOutCubic),

      bitRect.opacity(1, 0.4, easeOutCubic),

      callout.opacity(1, 0.4, easeOutCubic),

      ...otherBoxes.map((box, idx) =>

        box.opacity(

          Math.min(otherOpacities[idx] ?? 1, fadedOpacity),

          0.4,

          easeOutCubic

        )

      )

    );

    const cleanup = function* () {

      yield* waitFor(0.2);

      yield* all(

        bitRect.fill(baseFill ?? highlightColor.alpha(0), 0.3, easeInCubic),

        bitRect.shadowBlur(baseShadowBlur ?? 0, 0.3, easeInCubic),

        bitRect.shadowColor(

          baseShadowColor ?? highlightColor.alpha(0),

          0.3,

          easeInCubic

        ),

        bitRect.opacity(baseOpacity ?? 1, 0.3, easeInCubic),

        callout.opacity(0, 0.3, easeInCubic),

        ...otherBoxes.map((box, idx) =>

          box.opacity(otherOpacities[idx] ?? 1, 0.3, easeInCubic)

        )

      );

      callout.remove();

    };

    if (!reverse) {

      return cleanup;

    }

    yield* cleanup();

    return undefined;

  };

  const bitgroups = createRefArray<Bitnumber>();

  bitgroups.push(opcode);

  bitgroups.push(operand);

  const remaining = [4, 10, 10];

  range(remaining.length).map((i) => {

    const bitg = (

      <Bitnumber initialVisibility scaleX={0} bits={remaining[i]} />

    ) as Bitnumber;

    bitgroups.push(bitg);

    container.add(bitg);

    return bitg;

  });

  operand.load(0);

  opcode.load(0);

  const positions = [

    [-1150, -500], // opcode (high nibble)

    [-50, -500], // opcode (low nibble)

    [1150, -500], // modifier flags

    [0, 0], // operand A

    [0, 500], // operand B

  ] as PossibleVector2[];

  const opcodeHigh = bitgroups[0]!;

  const opcodeLow = bitgroups[1]!;

  const modifiers = bitgroups[2]!;

  const operandA32 = bitgroups[3]!;

  const operandB32 = bitgroups[4]!;

  yield* all(

    sequence(

      0.1,

      ...bitgroups.map((bitgroup, i) =>

        all(bitgroup.position(positions[i], 1), bitgroup.scale(1.6, 1))

      )

    )

  );

  yield* waitUntil("opcode");

  yield highlightByte([opcodeHigh, opcodeLow], "opcode (8 bits)", "#ff3864");

  yield* waitUntil("operand");

  yield highlightByte([operandA32], "operand A", "#2dd4bf");

  yield* waitUntil("operand-b");

  yield highlightByte([operandB32], "operand B", "#60a5fa");

  yield* waitUntil("modifier-intro");

  yield highlightByte([modifiers], "modifier flags", "#facc15");

  yield* waitUntil("larger");

  yield all(

    opcode.opacity(0.2, 1),

    operand.opacity(0.2, 1),

    bitLayout.y(bitLayout.y() + 300, 1),

    operandA32.showDecimal(1, 1),

    operandB32.showDecimal(1, 1)

  );

  yield* loop(4, () =>

    run(function* () {

      operandA32.load(generator.nextInt(0, Math.pow(2, 10) - 1));

      operandB32.load(generator.nextInt(0, Math.pow(2, 10) - 1));

      yield* waitFor(1);

    })

  );

  operandA32.load(Math.pow(2, 10) - 1);

  operandB32.load(Math.pow(2, 10) - 1);

  yield* waitUntil("modifier-focus");

  const otherGroups = [opcodeHigh, opcodeLow, operandA32, operandB32];

  yield* all(

    modifiers.position([-1050, 0], 1, easeInOutBack),

    modifiers.scale(3, 1, easeInOutBack),

    ...otherGroups.map((group) => group.opacity(0.1, 0.8))

  );

  const subtitle = (

    <Txt

      opacity={0}

      scale={0.5}

      fill={"#fff"}

      shadowBlur={30}

      shadowColor={"#fffa"}

      fontSize={80}

      fontFamily={"Poppins"}

      width={1500}

      textWrap

      x={-100}

    ></Txt>

  ) as Txt;

  const info_icon = (

    <Icon

      size={160}

      color={"white"}

      icon={"material-symbols:info"}

      x={800}

      shadowBlur={50}

      shadowColor={"#fffa"}

      scale={0}

    />

  ) as Icon;

  const glass_info = (

    <Glass width={1900} radius={64} height={400} y={700} x={-3000} />

  );

  glass_info.add(subtitle);

  glass_info.add(info_icon);

  view.add(glass_info);

  let infoShown = false;
  const codeBase = new Vector2(1011, -5);

  const presentModifier = function* (options: {
    index: number;
    color: string;
    name: string;
    description: string;
    examples: { code: string; offset: [number, number] }[];
  }) {
    const { index, color, name, description, examples } = options;
    const cleanup = (yield* highlightBit(modifiers, index, name, color, false))!;
    const bitRect = modifiers.boxes[index];

    if (!infoShown) {
      yield chain(glass_info.x(-1000, 1), info_icon.scale(1, 0.7, easeOutBack));
      infoShown = true;
    }

    yield* all(
      subtitle.opacity(0, 0.3, easeOutCubic),
      subtitle.text(description, 0),
      subtitle.opacity(1, 0.3, easeInCubic),
      subtitle.scale(1, 0.3, easeInCubic)
    );

    const panes = examples.map((example) => {
      const offset = new Vector2(example.offset[0], example.offset[1]);
      const pane = (
        <Glass
          zIndex={5}
          size={[1550, 220]}
          position={() => new Vector2(codeBase.x + offset.x, codeBase.y + offset.y)}
          scale={0}
          translucency={1}
          borderModifier={-1}
        >
          <Code
            zIndex={1}
            fontSize={80}
            width={1550}
            textAlign={'left'}
            height={600}
            highlighter={new AsmHighlighter()}
            code={example.code}
          ></Code>
        </Glass>
      ) as Glass;
      view.add(pane);
      return pane;
    });

    yield sequence(
      0.2,
      ...panes.map((pane) => pane.scale(1, 0.8, easeOutBack))
    );

    yield* waitFor(2);

    yield* all(
      ...panes.map((pane) => pane.scale(0, 0.4, easeInCubic))
    );

    panes.forEach((pane) => pane.remove());

    yield* cleanup();
  };

  yield* waitUntil("modifier-m");

  yield* presentModifier({

    index: 0,

    color: "#fb923c",

    name: "Immediate Mode (M)",

    description:

      "Immediate Mode (M): Treat operand two as an immediate value instead of a register.",

    examples: [

      { code: `\
; add register R1
ADD R0, R1`, offset: [0, -140] },

      { code: `\
; add literal 1
ADD R0, #1`, offset: [0, 140] },

    ],

  });

  yield* waitUntil("modifier-destination");

  yield* presentModifier({

    index: 1,

    color: "#38bdf8",

    name: "Destination Flag (D)",

    description:

      "Destination Flag (D): Route the result out to memory instead of back into the destination register.",

    examples: [

      { code: `\
; result stays in R0
ADD R0, R1`, offset: [0, -140] },

      { code: `\
; D=1 writes result to memory
ADD.D R0, R1`, offset: [0, 140] },

    ],

  });

  yield* waitUntil("modifier-jump");

  yield* presentModifier({

    index: 2,

    color: "#a855f7",

    name: "Jump Flag (J)",

    description:

      "Jump Flag (J): Tag the next instruction as a jump so control flow branches immediately.",

    examples: [

      { code: `\
; normal fall-through
ADD R2, R3`, offset: [0, -140] },

      { code: `\

JMP #0x40 ; branch to address 0x40`, offset: [0, 140] },

    ],

  });

  yield* waitUntil("modifier-condition");

  yield* presentModifier({

    index: 3,

    color: "#f472b6",

    name: "Condition Flag (C)",

    description:

      "Condition Flag (C): Only run this instruction when the checked status flag is cleared (0).",

    examples: [

      { code: `\
; always executes
ADD R4, R5`, offset: [0, -140] },

      { code: `\
; execute only when Z flag is 0
ADD.CZ R4, R5`, offset: [0, 140] },

    ],

  });

  yield* waitUntil("next");

  yield* all(

    glass_info.x(-3000, 0.8, easeInCubic),

    info_icon.scale(0, 0.5, easeInCubic),

    modifiers.position(positions[2], 0.6, easeInOutBack),

    modifiers.scale(1.6, 0.6, easeInOutBack),

    ...otherGroups.map((group) => group.opacity(1, 0.6))

  );

});
