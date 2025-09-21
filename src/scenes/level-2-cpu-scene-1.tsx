import {
  Camera,
  Code,
  Icon,
  Layout,
  lines,
  makeScene2D,
  Node,
  Rect,
  Txt,
  Video,
} from "@motion-canvas/2d";
import { buildCPULevel2, FLAG_DEFS } from "../utils/cpus/buildCPULevel2";
import { createScene } from "../components/presets";
import {
  all,
  chain,
  Color,
  createSignal,
  DEFAULT,
  delay,
  easeInCubic,
  easeInOutBack,
  easeInOutCirc,
  easeInOutCubic,
  easeInOutElastic,
  easeInSine,
  easeOutBack,
  easeOutCubic,
  loop,
  range,
  run,
  sequence,
  useRandom,
  Vector2,
  waitFor,
  waitUntil,
} from "@motion-canvas/core";
import { RAM_SCALE } from "../utils/cpus/buildCPULevel0";
import { Layers, Vector3 } from "three";
import { Label3D } from "../components/Label3D";
import { buildCPULevel1 } from "../utils/cpus/buildCPULevel1";
import { Glass } from "../components/GlassRect";
import { ShaderBackground } from "../components/background";
import Scene3D from "../libs/Thrash/Scene";
import { Switch } from "../components/switch";
import { Bitnumber } from "../utils/bitnumber";
import { AsmHighlighter } from "../utils/AsmHighlighter";

export default   makeScene2D(function* (view) {
  const generator = useRandom(3);

  const scene = createScene(new Vector3(-1.5, 0.6, 1.2));
  const level2_cpu = buildCPULevel2(scene);
  const level1_cpu = buildCPULevel1(scene);

  const camera = scene.getCameraClass();

  view.add(scene);
  yield* camera.lookTo(level2_cpu.base.getGlobalPosition());

  yield* waitUntil("begin");
  yield* sequence(
    0.3,
    level2_cpu.group.popIn(1),
    level2_cpu.ram.popIn(1, RAM_SCALE)
  );
  yield* level2_cpu.initWires(
    level2_cpu.wires.filter(
      (w) =>
        w != level2_cpu.wire_mc_ram_address && w != level2_cpu.wire_mc_ram_data
    )
  );
  yield* waitFor(0.25);
  yield* level2_cpu.group.rotateTo(
    level2_cpu.group
      .localRotation()
      .clone()
      .add(new Vector3(0, 0, Math.PI * 2)),
    1.5
  );
  yield* level2_cpu.initWires([
    level2_cpu.wire_mc_ram_address,
    level2_cpu.wire_mc_ram_data,
  ]);

  yield* waitUntil("activate");
  yield loop(4, () =>
    sequence(
      0.15,
      // Step 1: Fetch instruction (MC → IR → Decode)
      level2_cpu.wire_mc_ir.currentFlow(0.3, undefined, 120),
      level2_cpu.wire_ir_decode.currentFlow(0.3, undefined, 120),
      level2_cpu.wire_decode_cu.currentFlow(0.3, undefined, 120),

      // Step 2: Decode to registers
      level2_cpu.wire_decode_gpr.currentFlow(0.3, undefined, 120),
      level2_cpu.wire_gpr_iu.currentFlow(0.3, undefined, 120),

      // Step 3: Execute in ALU
      level2_cpu.wire_cu_iu.currentFlow(0.3, undefined, 120),

      // Step 4: Writeback (ALU → MC → RAM)
      level2_cpu.wire_iu_mc.currentFlow(0.3, undefined, 120),
      level2_cpu.wire_mc_ram_data.currentFlow(0.3, undefined, 120)
    )
  );

  const instructions_raw = [
    "LOAD R1, [0x10]", // load from memory
    "STORE R1, [0x20]", // store into memory
    "ADD R1, R2", // arithmetic with two registers
    "MUL R1, R4", // multiply registers
    "AND R1, R5", // bitwise AND
    "XOR R3, R1", // bitwise XOR
    "NOT R4", // bitwise NOT
    "SHL R1, 1", // shift left
    "JZ  0x50", // jump if zero
    "JNZ 0x60", // jump if not zero
    "CALL 0x100", // subroutine call
    "RET", // return from subroutine
    "CMP R1, R2", // compare registers
    "LOOP R3, 0x80", // loop until counter = 0
  ];
  const instructions_lbls: Label3D[] = instructions_raw.map(
    (instr) =>
      (
        <Label3D
          scene={scene}
          worldPosition={level2_cpu.ram.getGlobalPosition()}
          position={new Vector2(1054, -418)}
          text={instr}
          width={instr.length * 30 * 1.8 + 100}
          fontSize={100}
          height={75 * 1.8}
          ignorePosition
        />
      ) as Label3D
  );
  instructions_lbls.forEach((a) => view.add(a));
  yield* sequence(
    0.4, // spacing between items
    ...instructions_raw.map((_, i) =>
      all(
        instructions_lbls[i].popIn(),
        chain(
          instructions_lbls[i].position(new Vector2(-40, 328), 1),
          instructions_lbls[i].popOut()
        )
      )
    )
  );

  yield* waitUntil("level 1 cpu");
  yield* level1_cpu.container.moveBack(5);
  yield camera.lookTo(level1_cpu.base.getGlobalPosition(), 2);
  yield camera.zoomIn(1.2, 2, easeInOutCubic);
  yield delay(0.3, level2_cpu.container.moveForward(5, 2));
  yield* sequence(
    0.3,
    level1_cpu.group.popIn(1),
    level1_cpu.ram.popIn(1, RAM_SCALE)
  );
  yield* level1_cpu.initWires(level1_cpu.wires);
  yield* camera.moveTo(
    camera
      .localPosition()
      .clone()
      .sub(level2_cpu.container.getGlobalPosition().clone()),
    2
  );
  yield* waitUntil("alu");

  const operations = ["ADD 5", "SUB 3", "DIV 0"];
  const results = ["0", "-2", 0];

  const labels: Label3D[] = operations.map((operation, i) => (
    <Label3D
      text={operation}
      scene={scene}
      offset2D={[-2000, -7000]}
      ignorePosition
      position={new Vector2(175, 56).add([400 * i - 400, 250 * i - 250])}
      fontSize={100}
      size={[800, 200]}
      worldPosition={level1_cpu.alu
        .getGlobalPosition()
        .clone()
        .add(
          new Vector3(generator.nextFloat(-1, 1), 0, generator.nextFloat(-1, 1))
        )}
    />
  )) as any;
  const overlay = <Rect size={"100%"} fill={"#010a1b"} opacity={0} />;
  view.add(overlay);
  const labels_results: Txt[] = labels.map((label, i) => (
    <Node
      scale={0}
      position={label.position}
      shadowColor={[FLAG_DEFS.Z.on, FLAG_DEFS.N.on, FLAG_DEFS.DZ.on][i % 3]}
    >
      {typeof results[i] == "string" ? (
        <Txt
          text={results[i]}
          fontFamily={"Poppins"}
          fill={new Color([FLAG_DEFS.Z.on, FLAG_DEFS.N.on][i % 2]).brighten(2)}
          fontWeight={800}
          fontSize={120}
        />
      ) : (
        <Rect layout alignItems={"center"} gap={20}>
          <Icon
            icon={"mdi:bug"}
            shadowColor={FLAG_DEFS.DZ.on}
            color={new Color(
              [FLAG_DEFS.Z.on, FLAG_DEFS.N.on, FLAG_DEFS.DZ.on][i % 3]
            ).brighten(2)}
            size={150}
          />
          <Txt
            text={"D/Z"}
            fontFamily={"Poppins"}
            fontWeight={800}
            shadowColor={FLAG_DEFS.DZ.on}
            fill={new Color(
              [FLAG_DEFS.Z.on, FLAG_DEFS.N.on, FLAG_DEFS.DZ.on][i % 3]
            ).brighten(2)}
            fontSize={120}
          />
        </Rect>
      )}
    </Node>
  )) as any;
  // Soft neon-like glow layer behind results (drawn first for depth)
  const labels_results_glow: Txt[] = labels.map((label, i) => (
    <Txt
      text={typeof results[i] === "string" ? (results[i] as string) : "D/Z"}
      fontFamily={"Poppins"}
      fill={"#66CCFF"}
      fontSize={160}
      position={label.position}
      opacity={0}
      scale={0}
    />
  )) as any;
  labels.forEach((label, i) => {
    // Order matters: glow first, then the base label, then crisp result on top
    view.add(labels_results_glow[i]);
    view.add(label);
    view.add(labels_results[i]);
  });
  // Features unlocked once ALU flags are supported
  const functionality = [
    "conditional-moves", // execute MOV only if flag matches
    "branching", // conditional control flow via flags
    "zero-checks", // fast Z flag tests
    "comparisons", // CMP updates flags for decisions
    "short-circuit-logic", // flag-driven early exits in code paths
    "carry-borrow-handling", // future C/borrow behavior
    "error-traps-dz", // divide-by-zero signaling path
    "overflow-detection", // detect overflow via V flag
    "loops", // while/for style using conditional jumps
  ];
  yield* camera.lookTo(level1_cpu.alu.getGlobalPosition(), 1);
  yield* camera.moveTo(
    level1_cpu.alu
      .getGlobalPosition()
      .clone()
      .add(new Vector3(-0.5, 0.5, -0.5)),
    1
  );
  yield* sequence(0.3, ...labels.map((label) => label.popIn()));
  yield* waitFor(0.8);
  yield* sequence(
    0.25,
    ...labels.map((label, i) =>
      all(
        // Hide operation label
        labels[i].scale(0, 0.7, easeInOutCubic),
        // Bring in crisp result
        labels_results[i].scale(3, 0.7, easeOutBack),
        // Bring in glow slightly larger for halo
        labels_results_glow[i].scale(1.25, 0.7, easeOutBack)
      )
    )
  );
  // Emphasize results and slide them into their slots smoothly
  yield* sequence(
    0.25,
    ...labels.map((label, i) =>
      all(
        // Smooth slide to target with gentle overshoot feel
        labels_results[i].position(
          [-1100 + 800 * i + (i == 2 ? 400 : 0), 0],
          1.2,
          easeOutCubic
        ),
        labels_results_glow[i].position(
          [-1100 + 800 * i + (i == 2 ? 400 : 0), 0],
          1.2,
          easeOutCubic
        ),
        labels_results[i].shadowBlur(100, 1),
        // Stronger emphasis: pop big then settle larger than base
        chain(
          all(
            labels_results[i].scale(2.75, 0.35, easeOutBack),
            labels_results_glow[i].scale(2.1, 0.35, easeOutBack)
          ),
          all(
            labels_results[i].scale(2.25, 0.45, easeInOutCubic),
            labels_results_glow[i].scale(1.6, 0.45, easeInOutCubic)
          )
        )
      )
    )
  );
  // Gentle bounce to add life, then settle
  yield* sequence(
    0.2,
    ...labels_results.map((label, i) =>
      all(
        chain(
          labels_results[i].y(40, 0.45, easeOutCubic),
          labels_results[i].y(0, 0.55, easeInOutCirc)
        ),
        chain(
          labels_results_glow[i].y(40, 0.45, easeOutCubic),
          labels_results_glow[i].y(0, 0.55, easeInOutCirc)
        )
      )
    )
  );
  const shaderBackground = <ShaderBackground preset="ocean" opacity={0.3} />;
  overlay.add(shaderBackground);
  // Converge to center and fade down scale smoothly
  yield sequence(
    0.2,
    overlay.opacity(1, 3).do(() => scene.remove()),
    ...labels_results.map((label, i) =>
      all(
        labels_results[i].x(0, 1.5, easeInOutElastic),
        labels_results_glow[i].x(0, 1.5, easeInOutElastic),
        labels_results[i].scale(0.9, 1.5, easeInOutElastic),
        labels_results_glow[i].scale(1.2, 0.9, easeInOutCubic),
        labels_results[i].scale(0, 1.5, easeInCubic),
        labels_results_glow[i].scale(0, 1.5, easeInCubic)
      )
    )
  );
  const radius = createSignal(0);
  const ammount = 10;
  const offset = createSignal(0);
  const functionalities_offset = range(ammount).map((i) =>
    generator.nextFloat(-0.01, 0.02)
  );
  const texts = range(ammount).map((i) => (
    <Txt
      text={functionality[i % functionality.length]}
      fontSize={70}
      fontFamily={"Poppins"}
      fill={"white"}
      fontWeight={700}
      scale={0}
      position={() =>
        new Vector2(
          Math.cos(
            (i / ammount +
              easeInOutCubic(offset()) * 0.5 +
              (functionalities_offset[i] * radius()) / 600) *
              2 *
              Math.PI
          ) * radius(),
          Math.sin(
            (i / ammount +
              easeInOutCubic(offset()) * 0.5 +
              (functionalities_offset[i] * radius()) / 600) *
              2 *
              Math.PI
          ) * radius()
        )
      }
    />
  ));
  texts.forEach((text) => view.add(text));
  yield* waitFor(1);
  yield loop(3, () =>
    sequence(
      0.05,
      ...texts.map((text: Txt) =>
        all(
          text
            .fill(FLAG_DEFS.Z.on, 0.5)
            .to(FLAG_DEFS.N.on, 0.5)
            .to(FLAG_DEFS.DZ.on, 0.5),
          text
            .shadowColor(FLAG_DEFS.Z.on, 0.5)
            .to(FLAG_DEFS.N.on, 0.5)
            .to(FLAG_DEFS.DZ.on, 0.5)
        )
      )
    )
  );
  yield sequence(
    0.1,
    ...texts.map((text) => text.shadowBlur(90, 0.5, easeOutBack))
  );
  yield sequence(0.1, ...texts.map((text) => text.scale(1, 0.5, easeOutBack)));
  yield* radius(750, 3, easeOutCubic);
  yield* offset(1, 3, easeInOutBack);

  // Stylized light bulbs for ALU flags (Z, N, V, D/Z)
  const flagData = [
    {
      title: "Zero (Z)",
      scope: "Toggles when result equals 0",
      color: new Color(FLAG_DEFS.Z.on).brighten(1.5),
    },
    {
      title: "Negative (N)",
      scope: "Sign bit is 1 (two's complement)",
      color: new Color(FLAG_DEFS.N.on).brighten(1.5),
    },
    {
      title: "Overflow (V)",
      scope:
        "The overflow flag (V) is set whenever a signed operation\nproduces a result that goes beyond the range that can be represented,\ncausing the sign to flip unexpectedly.",
      color: new Color(FLAG_DEFS.V.on).brighten(1.5),
    },
    {
      title: "Divide by Zero (D/Z)",
      scope: "Division by zero detected",
      color: new Color(FLAG_DEFS.DZ.on).brighten(1.5),
    },
  ];

  const lightbulbs = (
    <Rect gap={80} x={3000} scale={0.5}>
      {flagData.map((b, i) => (
        <Rect
          x={-1800 + 900 / 2 + 900 * i}
          direction={"column"}
          alignItems={"center"}
          gap={824}
        >
          <Txt
            text={b.title}
            fontFamily={"Poppins"}
            fontWeight={800}
            y={-400}
            fontSize={72}
            fill={b.color}
            shadowColor={new Color(b.color).alpha(0.4)}
            shadowBlur={20}
          />
          <Layout layout={false} height={300}>
            <Switch initialState={false} accent={b.color} rotation={-90} />
          </Layout>
        </Rect>
      ))}
    </Rect>
  );
  const subtitle = (
    <Txt fontFamily={"Poppins"} y={200} fontSize={86} fill={"#fff8"} x={-450} />
  ) as Txt;
  view.add(subtitle);
  const bitnumber = (
    <Bitnumber
      bitgroups={2}
      x={-500}
      number={123}
      scale={1.5}
      shadowBlur={20}
      shadowColor={"#fff9"}
    />
  ) as Bitnumber;
  view.add(bitnumber);
  view.add(lightbulbs);

  yield* waitUntil("light bulbs");
  yield* all(
    ...texts.map((label, i) =>
      all(texts[i].opacity(0, 1), texts[i].scale(0, 1), texts[i].x(-2000, 1))
    ),
    lightbulbs.scale(1, 1, easeOutCubic),
    lightbulbs.x(0, 1, easeOutBack)
  );
  yield* all(
    ...lightbulbs.children().map((bulb, i) => {
      if (i > 0) {
        return all(i > 0 ? bulb.x(3500, 1) : null);
      }
      return all(bulb.scale(1.7, 1));
    }),
    lightbulbs.children()[0].x(1000, 1),
    delay(0.5, all(subtitle.text(flagData[0].scope, 1), bitnumber.pop()))
  );
  lightbulbs
    .children()
    .forEach((child, i) =>
      i > 0
        ? child.position(lightbulbs.childAs<Rect>(0).position().addY(-1500))
        : null
    );
  bitnumber.load(54);
  yield* waitFor(1);
  bitnumber.load(0.1);
  var sw = lightbulbs.childAs<Rect>(0).findFirst((c) => c instanceof Switch);
  yield* sw.toggle(1);
  bitnumber.load(29);
  yield* sw.toggle(1);

  yield* waitUntil("N");
  yield* all(
    lightbulbs.children()[0].y(2500, 1),
    lightbulbs.children()[1].y(0, 1),
    lightbulbs.children()[1].scale(lightbulbs.children()[0].scale(), 1),
    subtitle.text(flagData[1].scope, 1)
  );
  const signbit = bitnumber.childAs<Rect>(2);
  yield signbit.fill(new Color(flagData[1].color).alpha(0.21), 1);
  bitnumber.load(200);
  sw = lightbulbs.childAs<Rect>(1).findFirst((c) => c instanceof Switch);
  yield* sw.toggle(1);
  bitnumber.load(100);
  yield* sw.toggle(1);
  bitnumber.load(250);
  yield* sw.toggle(1);

  yield* waitUntil("V");
  sw = lightbulbs.childAs<Rect>(2).findFirst((c) => c instanceof Switch);
  const code = (
    <Glass
      size={[1800, 600]}
      x={-400}
      scaleY={0}
      y={-200}
      translucency={1}
      borderModifier={-1}
    >
      <Code
        zIndex={1}
        fontSize={80}
        width={1800}
        top={[0, -20]}
        height={600}
        highlighter={new AsmHighlighter()}
        code={`\
LOAD 1011
; LOAD 127 into ACC (from 0xb)
ADD 0001
; ADD 1 → result = -128, V flag toggled`}
      ></Code>
    </Glass>
  ) as Glass;
  view.add(code);
  yield* all(
    signbit.fill("#ff02", 1),
    lightbulbs.children()[1].y(2500, 1),
    lightbulbs.children()[2].y(0, 1),
    lightbulbs.children()[2].scale(lightbulbs.children()[0].scale(), 1),
    bitnumber.y(bitnumber.y() + 300, 1),
    subtitle.y(subtitle.y() + 480, 1),
    subtitle.x(subtitle.x() + 400, 1),
    code.childAs<Code>(0).selection(lines(0, 1), 1),
    code.scale(1, 1),
    subtitle.text(flagData[2].scope, 1),
    run(function* () {
      bitnumber.load(127);
    })
  );
  yield* waitFor(0.5);
  yield* all(
    code.childAs<Code>(0).selection(lines(2, 3), 1),
    code.scale(1, 1),
    sw.toggle(1),
    run(function* () {
      bitnumber.load(128);
    })
  );
  yield* all(
    code.childAs<Code>(0).code.append("\nSUB 0001", 1),
    code.childAs<Code>(0).selection(lines(4, 4), 1),
    run(function* () {
      bitnumber.load(127);
    })
  );
  yield* all(
    code.childAs<Code>(0).code.append("\nSUB 0111", 1),
    code.childAs<Code>(0).selection(lines(5, 5), 1),
    sw.toggle(1),
    code.height(670, 1),
    run(function* () {
      bitnumber.load(120);
    })
  );
  yield* code.childAs<Code>(0).selection(DEFAULT, 1);
  yield* waitUntil("DZ");
  sw = lightbulbs.childAs<Rect>(3).findFirst((c) => c instanceof Switch);
  yield* all(
    signbit.fill("#0000", 1),
    lightbulbs.children()[2].y(2500, 1),
    lightbulbs.children()[3].y(0, 1),
    lightbulbs.children()[3].scale(lightbulbs.children()[0].scale(), 1),
    code.childAs<Code>(0).code(
      `\
LOAD 1011 ; load something
DIV 0 ; raises flag`,
      1
    ),
    code.height(320, 1),
    code.childAs<Code>(0).x(-260, 1),
    code.y(code.y()+100, 1),
    subtitle.y(subtitle.y() - 100, 1),
    subtitle.x(subtitle.x() - 400, 1),
    subtitle.text(flagData[3].scope, 1),
    code.childAs<Code>(0).selection(lines(0, 0), 1),
    run(function* () {
      bitnumber.load(32);
    })
  );
  yield code.childAs<Code>(0).selection(lines(0,1), 1);
  yield* all(
    sw.toggle(1),
  );
  yield* waitFor(.7);
  yield code.childAs<Code>(0).code(`\
LOAD 1011 ; load something
DIV 2`, .6);
  yield* all(
    sw.toggle(1),
    run(function* () {
      bitnumber.load(32/2);
    })
  );

  yield* waitUntil("next");
});
