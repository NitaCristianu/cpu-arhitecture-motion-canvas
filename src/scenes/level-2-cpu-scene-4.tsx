import { Code, lines, makeScene2D, Rect, Txt } from "@motion-canvas/2d";
import {
  all,
  any,
  chain,
  Color,
  createRefArray,
  DEFAULT,
  easeInOutCubic,
  easeOutBack,
  easeOutCubic,
  easeOutSine,
  loop,
  range,
  sequence,
  tween,
  useRandom,
  Vector2,
  waitFor,
  waitUntil,
} from "@motion-canvas/core";
import { createScene } from "../components/presets";
import { buildCPULevel2 } from "../utils/cpus/buildCPULevel2";
import { Vector3 } from "three";
import { RAM_SCALE } from "../utils/cpus/buildCPULevel0";
import { createInfoCard } from "../utils/infocard";
import { AsmHighlighter } from "../utils/AsmHighlighter";
import { Label3D } from "../components/Label3D";
import { Bitnumber } from "../utils/bitnumber";
import { Glass } from "../components/GlassRect";

export default makeScene2D(function* (view) {
  const generator = useRandom(3);

  const scene = createScene();
  const level2_cpu = buildCPULevel2(scene);

  const camera = scene.getCameraClass();

  view.add(scene);
  yield* camera.zoomTo(2.2);
  yield* camera.moveTo(
    level2_cpu.cu.getGlobalPosition().add(new Vector3(-0.19, 1, 0.45)),
    0
  );
  yield* camera.lookTo(new Vector3(-0.19, -0.1, 0.15));
  yield* all(level2_cpu.group.popIn(0), level2_cpu.ram.popIn(0, RAM_SCALE));
  yield* level2_cpu.initWires();

  yield* waitUntil("begin");
  yield* loop(4, () =>
    level2_cpu.wire_decode_cu.currentFlow(0.3, easeOutSine, 50)
  );

  const context_title = createInfoCard("Decoder Unit (DU)", {
    props: { top: [0, -view.size().y / 2 - 250] },
    width: 1900,
  });
  view.add(context_title.node);
  yield* waitUntil("decode");
  yield* all(
    camera.moveTo(new Vector3(-0.35, 1, 1.1), 1.5),
    camera.lookForward(0.05, 1.5, easeInOutCubic),
    camera.zoomTo(4.2, 1.5),
    context_title.node.y(context_title.node.y() + 350, 1)
  );
  const instructions_lbls: Label3D[] = range(10)
    .map((i) =>
      generator
        .nextInt(0, Math.pow(2, 32 - 1))
        .toString(2)
        .padEnd(32, "0")
    )
    .map(
      (instr) =>
        (
          <Label3D
            scene={scene}
            worldPosition={level2_cpu.ram.getGlobalPosition()}
            position={new Vector2(-1430, -841)}
            text={instr}
            width={instr.length * 30 * 1.8 + 100}
            fontSize={100}
            height={75 * 1.8}
            ignorePosition
          />
        ) as Label3D
    );

  const instructions_raw = [
    "LOAD R1, [0x10]", // load from memory
    "STORE R1, [0x20]", // store into memory
    "ADD R1, R2", // arithmetic with two registers
    "XOR R3, R1", // bitwise XOR
    "NOT R4", // bitwise NOT
    "SHL R1, 1", // shift left
    "JZ  0x50", // jump if zero
    "JNZ 0x60", // jump if not zero
    "CMP R1, R2", // compare registers
    "LOOP R3, 0x80", // loop until counter = 0
  ];
  const instructions_lbls2: Label3D[] = instructions_raw.map(
    (instr, i) =>
      (
        <Label3D
          scene={scene}
          worldPosition={level2_cpu.ram.getGlobalPosition()}
          position={new Vector2(-1430, -841)}
          text={instr}
          width={instr.length * 30 * 1.8 + 100}
          fontSize={100}
          height={75 * 1.8}
          ignorePosition
        />
      ) as Label3D
  );
  instructions_lbls.forEach((a) => view.add(a));
  instructions_lbls2.forEach((a) => view.add(a));
  yield sequence(
    0.5, // spacing between items
    ...instructions_lbls.map((label, i) =>
      all(
        label.scale(0.5, 1, easeOutSine),
        chain(
          tween(1, (progress) => {
            const t = easeInOutCubic(progress);
            const finalPos = new Vector2(-472, 19);
            const startpos = new Vector2(-1430, -841);

            label.position(Vector2.arcLerp(startpos, finalPos, t, true, 2));
          }),
          label.popOut()
        )
      )
    )
  );
  yield* waitFor(0.7);
  yield* sequence(
    0.5, // spacing between items
    ...instructions_lbls2.map((label, i) =>
      all(
        label.scale(0.5, 0.4, easeOutSine),
        chain(
          tween(1, (progress) => {
            const t = easeInOutCubic(progress);
            const finalPos = new Vector2(-171, 1157);
            const startpos = new Vector2(104, 256);

            label.position(Vector2.arcLerp(startpos, finalPos, t, true, 10));
          }),
          label.popOut()
        )
      )
    )
  );

  yield* waitUntil("IR");
  yield* all(
    camera.lookTo(level2_cpu.ir.getGlobalPosition(), 1, easeInOutCubic),
    context_title.node.y(context_title.node.y() - 350, 1)
  );
  const getRawInstruction = (count: number) =>
    generator
      .nextInt(0, Math.pow(2, count - 1))
      .toString(2)
      .padEnd(count, "0");

  const splitting: [number, string, string][] = [
    [8, "operand", "#ff3864"],
    [4, "modifier", "#facc15"],
    [12, "source", "#2dd4bf"],
    [12, "destination", "#60a5fa"],
  ];
  const formatBits = (value: string, groupSize = 4) =>
    value.match(new RegExp(`.{1,${groupSize}}`, "g"))?.join(" ") ?? value;
  const sumThroughIndex = (n: number) =>
    splitting.reduce(
      (total, [value], idx) => (idx <= n ? total + value : total),
      0
    );
  const decodedValues = splitting.map(([bits]) => getRawInstruction(bits));

  const splits = createRefArray<Txt>();
  const interpreted_bits = (
    <Label3D
      worldPosition={new Vector3(0, 0, 0)}
      scene={scene}
      ignorePosition
      text=""
      position={new Vector2(-21, -80)}
      height={90}
      width={1200}
      borderModifier={-1}
    >
      {...splitting.map((data, i) => (
        <Txt
          zIndex={1}
          ref={splits}
          fontFamily={"Fira Code"}
          fill={new Color(data[2]).brighten(12)}
          shadowBlur={50}
          shadowColor={new Color(data[2]).brighten(12).alpha(0.5)}
          text={decodedValues[i]}
          x={() =>
            (i === 0 ? 0 : sumThroughIndex(i - 1) * 32 + data[0] * 16 - 110) -
            450
          }
        />
      ))}
    </Label3D>
  ) as Label3D;
  view.add(interpreted_bits);
  yield* interpreted_bits.popIn();

  yield camera.lookTo(level2_cpu.decode.getGlobalPosition(), 2);
  yield* sequence(
    0.5, // spacing between items
    all(
      chain(
        tween(2, (progress) => {
          const t = easeInOutCubic(progress);
          const finalPos = new Vector2(0, -57);
          const startpos = new Vector2(-21, -80);

          interpreted_bits.position(
            Vector2.arcLerp(startpos, finalPos, t, true, 2)
          );
        })
      )
    )
  );
  const namings = splitting.map((data, i) => {
    const positions = [
      new Vector2(-1353, -54),
      new Vector2(-723, -54),
      new Vector2(49, -58),
      new Vector2(1203, -58),
    ];

    const t = (
      <Txt
        zIndex={1}
        fontFamily={"Fira Code"}
        fill={new Color(data[2]).brighten(2)}
        shadowBlur={50}
        shadowColor={new Color(data[2]).darken(5).alpha(0.5)}
        text={data[1]}
        key={"naming-" + data[1]}
        position={positions[i].addY(200 * (i % 2 == 0 ? 1 : -1))}
        scale={0}
        fontSize={100}
      ></Txt>
    );
    return t;
  });
  namings.forEach((t) => view.add(t));

  yield interpreted_bits.scale(3, 2);
  yield* waitFor(1);
  yield* sequence(
    0.3,
    ...splits.map((split, i) =>
      all(
        split.fill(
          new Color(splitting[i][2]).brighten(1),
          0.3,
          easeOutBack
        ),
        split.shadowColor(
          new Color(splitting[i][2]).darken(3),
          0.3,
          easeOutSine
        )
      )
    )
  );
  yield* waitUntil("namings");
  yield* sequence(
    0.5,
    ...namings.map((name) => name.scale(1, 0.75, easeOutBack))
  );
  yield* waitUntil("translator");
  yield* chain(
    all(
      interpreted_bits.scale(0.75, 1),
      ...namings.map((name) =>
        all(name.scale(0, 1), name.position(name.position().div(10), 1))
      )
    ),
    all(
      camera.lookTo(level2_cpu.ir.getGlobalPosition(), 1),
      interpreted_bits.position(new Vector2(1502, 912), 1)
    )
  );

  const raw_instruction_example = (
    <Label3D
      worldPosition={new Vector3(0, 0, 0)}
      scene={scene}
      ignorePosition
      text=""
      position={new Vector2(-21, -80)}
      height={90}
      width={1200}
      borderModifier={-1}
    >
      {...splitting.map((data, i) => (
        <Txt
          zIndex={1}
          ref={splits}
          fontFamily={"Fira Code"}
          fill={new Color(data[2]).brighten(12)}
          shadowBlur={50}
          shadowColor={new Color(data[2]).brighten(12).alpha(0.5)}
          text={decodedValues[i]}
          x={() =>
            (i === 0 ? 0 : sumThroughIndex(i - 1) * 32 + data[0] * 16 - 110) -
            450
          }
        />
      ))}
    </Label3D>
  ) as Label3D;
  view.add(raw_instruction_example);
  yield* raw_instruction_example.popIn();
  yield* waitUntil("CPU");
  yield* raw_instruction_example.scale(2,1);
  
  yield* waitUntil("registers");
  yield all(
    raw_instruction_example.popOut(),
    interpreted_bits.popOut(),
  );
  yield* camera.lookTo(level2_cpu.decode.getGlobalPosition().add(new Vector3(0.05,0,0)),1);

  const registerRows = createRefArray<Glass>();
  const registerFrameSize: [number, number] = [2160, 1470];
  const registerRowSize: [number, number] = [2000, 195];
  const rowGap = 240;
  const rowOriginY = -((splitting.length - 1) * rowGap) / 2 + 100;
  const headerY = -registerFrameSize[1] / 2 + 180;
  const dividerY = headerY + 90;
  const labelX = -registerRowSize[0] / 2 + 200;
  const bitsX = registerRowSize[0] / 2 - 200;
  const registerRowElements = splitting.map(([bits, label, hex], index) => {
    const base = new Color(hex);
    const rowY = rowOriginY + index * rowGap;
    return (
      <Glass
        key={`decode-register-${label}`}
        width={registerRowSize[0]}
        height={registerRowSize[1]}
        zIndex={1}
        y={rowY}
        lightness={-0.35}
        blurstrength={12}
        borderModifier={-0.4}
        fill={base.alpha(0.15)}
        ref={registerRows}
        scale={0}
      >
        <Txt
          zIndex={1}
          fontSize={76}
          fontWeight={600}
          fontFamily={"Poppins"}
          fill={base.brighten(8)}
          width={300}
          shadowBlur={18}
          shadowColor={base.alpha(0.4)}
          text={label.toUpperCase()}
          x={labelX}
        />
        <Txt
          zIndex={1}
          fontSize={64}
          fontFamily={"Fira Code"}
          fill={new Color("#f8fafc")}
          shadowBlur={24}
          shadowColor={"#0009"}
          text={formatBits(decodedValues[index])}
        />
        <Txt
          zIndex={1}
          fontSize={62}
          fontWeight={300}
          fontFamily={"Poppins"}
          fill={new Color("#e2e8f0").alpha(0.85)}
          shadowBlur={14}
          shadowColor={"#0007"}
          text={`${bits} bits`}
          x={bitsX}
        />
      </Glass>
    );
  });
  const register_contents = (
    <Glass
      size={registerFrameSize}
      fill={new Color("#0f172a").alpha(0.55)}
      position={[380, -420]}
      scale={0}
      rotation={45}
      skew={[-40, 30]}
      lightness={-0.25}
      borderModifier={-1}
    >
      <Txt
        zIndex={1}
        fontSize={120}
        fontWeight={500}
        fill={new Color("#e2e8f0")}
        shadowBlur={12}
        shadowColor={"#000a"}
        text={"DECODE REGISTER SPACE"}
        fontFamily={"Poppins"}
        y={headerY}
      />
      <Rect
        width={registerRowSize[0]}
        height={6}
        fill={new Color("#e2e8f0")}
        zIndex={1}
        y={dividerY}
        radius={120}
      />
      {...registerRowElements}
    </Glass>
  );
  view.add(register_contents);

  yield* any(
    register_contents.scale(0.8, 1, easeOutCubic),
    register_contents.rotation(0, 1, easeOutCubic),
    register_contents.skew([0, 0], 1, easeOutCubic),
    register_contents.position(
      () =>
        scene.projectToScreen(level2_cpu.decode.getGlobalPosition()).add([
          1500,
          -570,
        ]),
      2,
      easeOutBack
    )
  );
  yield* sequence(
    0.3,
    ...registerRows.map((row) => row.scale(1, 0.33, easeOutBack))
  );

  yield* waitUntil('restore');
  yield* all(
    register_contents.position(0,1),
    register_contents.scale(0,1),
    camera.zoomOut(0.5,1,easeInOutCubic),
    camera.moveTo(new Vector3(-1,1,1), 1,easeInOutCubic),
  )

  yield* waitUntil("code");

  const code = (
    <Glass
      size={[2000, 1800]}
      x={-950}
      lightness={-0.1}
      fill={"#0005"}
      scaleY={0}
      translucency={1}
      borderModifier={-1}
      clip
    >
      <Code
        zIndex={1}
        fontSize={80}
        width={2000}
        top={[0, -20]}
        height={1100}
        highlighter={new AsmHighlighter()}
        code={""}
      />
    </Glass>
  ) as Glass;
  view.add(code);

  const program = code.childAs<Code>(0);
  let lineCursor = 0;
  let isFirstLine = true;
  const appendLine = (content: string, duration = 0.6) => {
    const prefix = isFirstLine ? "" : "\n";
    const normalized = content.endsWith("\n") ? content : `${content}`;
    const selectionLine = lineCursor;
    const animation = program.code.append(`${prefix}${normalized}`, duration);
    // const focus = program.selection(lines(selectionLine, selectionLine), duration);
    isFirstLine = false;
    lineCursor += 1;
    return all(animation);
  };

  yield* code.scale(1, 1);

  
  yield* waitUntil("operands-intro");
  yield* appendLine("; Let's do a demo!\n; we write memory as [x]\n; registers as RX\n; values as #x\n\n");

  yield* waitUntil("load-r0");
  yield* appendLine("LOAD R0, [0x10] 0000");

  yield* waitUntil("imm-flag");

  yield* waitUntil("imm-off");

  yield* waitUntil("load-r1");
  yield* appendLine("LOAD R1, [0x11] 0000 ; same trick");

  yield* waitUntil("add-r0-r1");
  yield* appendLine("ADD R0, R1 0000 ; R0 += R1");

  yield* waitUntil("sum-note");
  // yield* appendLine("; R0 now holds 8 (3 + 5)");

  yield* waitUntil("store-r0");
  yield* appendLine("STORE  R0, [0x14] 0000 ;");

  yield* waitUntil("flags-check");
  // yield* appendLine("; Check Z/N flags before optionally bumping the result");

  yield* waitUntil("cmp-zero");
  yield* appendLine("\nGRT0 R0, [0xf20] 0000; jmp to f20 if > 0");

  yield* waitUntil("branch-negative");
  yield* appendLine("JMP [0xf21] 0000 ; otherwise skip to ");

  yield* waitUntil("inc-positive");
  yield* appendLine("ADD R0, #1 1000; // this is f20 ");
  yield* appendLine("HLT; // this is f21. HLT does nothing ");

  yield* waitUntil("label-skip");

  yield* waitUntil("while-intro");
  yield* appendLine("\n; While loop:");

  yield program.y(-500,1);
  yield* waitUntil("loop-load");
  yield* appendLine("LOAD R2, [0x10] 0000 ;");

  yield* waitUntil("loop-label");
  // yield* appendLine("loop_start:");

  yield* waitUntil("loop-sub");
  yield* appendLine("SUB R2, #1 0000 ;");

  yield* waitUntil("loop-store");
  yield* appendLine("STORE  R2, [0x10] 0000 ; Persist the countdown");

  yield* waitUntil("loop-cmp");
  yield* appendLine("CMP    R2, #0 0000 ; Zero flag tells us when to stop");

  yield* waitUntil("loop-branch");
  yield* appendLine("BREQ   loop_end 0000 ; If zero, break out");

  yield* waitUntil("loop-jump");
  yield* appendLine("JMP    loop_start 0000 ; JUMP rewrites PC for our loop");
  yield* waitUntil("loop-end");
  yield* appendLine("loop_end:");

  yield* program.selection(DEFAULT, 1);

  yield* waitUntil("next");
});
