import {
  Circle,
  Code,
  findAllCodeRanges,
  Gradient,
  Grid,
  Icon,
  Layout,
  Line,
  lines,
  makeScene2D,
  Node,
  Rect,
  Txt,
  word,
} from "@motion-canvas/2d";
import {
  all,
  any,
  chain,
  Color,
  createRef,
  createRefArray,
  createSignal,
  DEFAULT,
  easeInBack,
  easeInCubic,
  easeInOutCubic,
  easeOutBack,
  easeOutCubic,
  easeOutSine,
  loop,
  range,
  Reference,
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
        split.fill(new Color(splitting[i][2]).brighten(1), 0.3, easeOutBack),
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
  yield* raw_instruction_example.scale(2, 1);

  yield* waitUntil("registers");
  yield all(raw_instruction_example.popOut(), interpreted_bits.popOut());
  yield* camera.lookTo(
    level2_cpu.decode.getGlobalPosition().add(new Vector3(0.05, 0, 0)),
    1
  );

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
        scene
          .projectToScreen(level2_cpu.decode.getGlobalPosition())
          .add([1500, -570]),
      2,
      easeOutBack
    )
  );
  yield* sequence(
    0.3,
    ...registerRows.map((row) => row.scale(1, 0.33, easeOutBack))
  );

  yield* waitUntil("restore");
  yield* all(
    register_contents.position(0, 1),
    register_contents.scale(0, 1),
    camera.zoomOut(0.5, 1, easeInOutCubic),
    camera.moveTo(new Vector3(-1, 1, 1), 1, easeInOutCubic)
  );

  yield* waitUntil("code");

  const codeRef = createRef<Code>();
  const programwindow = createRef<Node>();
  const ramwindow = createRef<Node>();
  const unitwindow = createRef<Node>();
  const windows = [programwindow, ramwindow, unitwindow];
  const navbar = createRef<Rect>();

  function* toggleWindowMode(window: Reference<Node>) {
    const icons = navbar().children();
    const icon =
      window == programwindow
        ? icons[0]
        : window == ramwindow
        ? icons[1]
        : icons[2];

    yield all(
      ...icons.map((ic) =>
        ic != icon
          ? all(ic.childAs<Icon>(0).color("#fffa", 1), ic.scale(0.6, 1))
          : all(ic.childAs<Icon>(0).color("#fff", 1), ic.scale(1, 1))
      )
    );
    yield* all(
      ...windows.map((windowref) =>
        windowref != window
          ? windowref().opacity(0, 0.3)
          : windowref().opacity(1, 0.3)
      )
    );
  }

  const values_refs = createRefArray<Txt>();
  const addresses_refs = createRefArray<Txt>();
  function* highlightMemoryByte(i: number, newtext?: string) {
    if (newtext) yield all(values_refs[i].text(newtext, 1));
    yield* all(
      values_refs[i].fill("#ff0", 1),
      values_refs[i].opacity(1, 1),
      values_refs[i].shadowBlur(50, 1),
      values_refs[i].shadowColor("#ff05", 1),
      addresses_refs[i].fill("#ff0", 1),
      values_refs[i].shadowBlur(50, 1),
      values_refs[i].shadowColor("#ff05", 1),
      addresses_refs[i].fill("#ff0", 1),
      addresses_refs[i].shadowBlur(50, 1),
      addresses_refs[i].shadowColor("#ff05", 1)
    );
  }
  const flags = [
    createSignal(0),
    createSignal(0),
    createSignal(0),
    createSignal(0),
  ];

  const window = (
    <Glass
      size={[2500, 1800]}
      x={-500}
      lightness={-0.1}
      fill={"#0005"}
      scaleY={0}
      translucency={1}
      borderModifier={-1}
      clip
    >
      <Rect
        ref={navbar}
        scale={0.75}
        x={830}
        zIndex={5}
        y={-800}
        width={2500}
        height={150}
      >
        <Glass scale={0} size={150} radius={400}>
          <Icon
            icon={"mdi:code-braces"}
            size={140}
            color={"#fff"}
            shadowColor={"#fffa"}
            shadowBlur={50}
            zIndex={3}
          />
        </Glass>
        <Glass scale={0} x={200} size={150} radius={400}>
          <Icon
            icon={"mdi:grid"}
            size={100}
            color={"#fffa"}
            shadowColor={"#fffa"}
            zIndex={3}
          />
        </Glass>
        <Glass scale={0} x={400} size={150} radius={400}>
          <Icon
            icon={"mdi:chip"}
            size={130}
            color={"#fffa"}
            shadowColor={"#fffa"}
            zIndex={3}
          />
        </Glass>
      </Rect>
      <Node zIndex={1} ref={programwindow} cache>
        <Code
          zIndex={1}
          fontSize={80}
          width={2000}
          top={[0, -20]}
          height={1100}
          highlighter={new AsmHighlighter()}
          ref={codeRef}
          code={""}
        />
        <Rect
          zIndex={2}
          compositeOperation={"darken"}
          fill={
            new Gradient({
              fromY: -800,
              toY: 1000,
              stops: [
                { offset: 0, color: "#0003" },
                { offset: 1, color: "#fff0" },
              ],
            })
          }
          size={[2500, 1800]}
        ></Rect>
      </Node>
      <Node zIndex={2} ref={ramwindow} opacity={0} cache>
        <Grid
          size={[2500, 2500]}
          spacing={[800, 300]}
          stroke={"#fff5"}
          lineWidth={3.5}
        />
        {range(24).map((i) => {
          const x = (i % 4) * 810 - 1200;
          const y = Math.floor(i / 4) * 300 - 800;
          return (
            <Txt
              position={new Vector2(x, y)}
              fontSize={100}
              fontFamily={"Fira Code"}
              fill={"#fffa"}
              ref={values_refs}
              opacity={Math.floor((i + 4) / 4) / 4}
              text={
                i == 10 || i == 17
                  ? i == 17
                    ? "000...101"
                    : "000..011"
                  : generator
                      .nextInt(0, Math.pow(2, 3) - 1)
                      .toString(2)
                      .padEnd(3, "0") +
                    "..." +
                    generator
                      .nextInt(0, Math.pow(2, 3) - 1)
                      .toString(2)
                      .padEnd(3, "0")
              }
            ></Txt>
          );
        })}
        {range(24).map((i) => {
          const x = (i % 4) * 810 - 1200;
          const y = Math.floor(i / 4) * 300 - 650;
          return (
            <Txt
              ref={addresses_refs}
              position={new Vector2(x, y)}
              fill={"#fff5"}
              fontFamily={"Fira Code"}
              text={"0x00" + i.toString(16)}
            ></Txt>
          );
        })}
        <Rect fill={"#0005"} size={[2500, 2500]} />
      </Node>
      <Node zIndex={3} ref={unitwindow} opacity={0}>
        <Grid
          size={"100%"}
          spacing={400}
          stroke={"#fff5"}
          lineWidth={2}
          zIndex={-1}
        ></Grid>
        <Glass size={[1200, 800]} fill={"#e9a61622"}>
          <Txt
            fontSize={220}
            y={-30}
            fill={"#0005"}
            zIndex={1}
            fontWeight={800}
          >
            ALU
          </Txt>{" "}
          <Txt fontSize={50} y={90} fill={"#0005"} zIndex={1} fontWeight={200}>
            By Banana Logic
          </Txt>
          <Line
            points={[
              [-1000, 0],
              [-700, 100],
              [-300, 0],
            ]}
            radius={400}
            lineWidth={5}
            x={-300}
            stroke={"white"}
            zIndex={-1}
          />
          <Line
            points={[
              [900, 0],
              [1500, -150],
              [2000, 0],
            ]}
            radius={400}
            lineWidth={5}
            x={-300}
            stroke={"white"}
            zIndex={-1}
          />
          <Line
            points={[
              [0, -400],
              [200, -1150],
              [0, -1200],
            ]}
            radius={400}
            lineWidth={5}
            stroke={"white"}
            zIndex={-1}
          />
          <Glass size={[500, 100]} zIndex={1} y={250}>
            <Circle
              shadowBlur={40}
              fill={"rgba(243, 222, 222, 1)"}
              shadowColor={"#f0babaff"}
              size={50}
              zIndex={1}
              x={-150}
              scale={() => 0.75 + 0.25 * flags[0]()}
              opacity={() => 0.5 + 0.5 * flags[0]()}
            ></Circle>
            <Circle
              shadowBlur={40}
              fill={"rgba(222, 236, 243, 1)"}
              shadowColor={"#bae5f0ff"}
              size={50}
              zIndex={1}
              x={-50}
              scale={() => 0.75 + 0.25 * flags[1]()}
              opacity={() => 0.5 + 0.5 * flags[1]()}
            ></Circle>
            <Circle
              shadowBlur={40}
              fill={"rgba(147, 255, 192, 1)"}
              shadowColor={"#baf0d7ff"}
              size={50}
              zIndex={1}
              x={50}
              scale={() => 0.75 + 0.25 * flags[2]()}
              opacity={() => 0.5 + 0.5 * flags[2]()}
            ></Circle>
            <Circle
              shadowBlur={40}
              fill={"rgba(243, 222, 243, 1)"}
              shadowColor={"#ebbaf0ff"}
              size={50}
              zIndex={1}
              x={150}
              scale={() => 0.75 + 0.25 * flags[3]()}
              opacity={() => 0.5 + 0.5 * flags[3]()}
            ></Circle>
          </Glass>
        </Glass>
      </Node>
    </Glass>
  ) as Glass;
  view.add(window);

  const program = codeRef();
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

  const registers = ["R0", "R1", "R2", "R3", "R4"].map((name, i) => (
    <Glass width={1000} height={200} x={1100} scaleX={0} y={i * 250 - 500}>
      <Txt
        text={name}
        fill={"#fffd"}
        fontFamily={"Poppins"}
        zIndex={1}
        x={-400}
        fontSize={90}
        fontWeight={500}
      />

      <Txt
        text={"0000 0000"}
        fill={"#fffd"}
        fontFamily={"Fira Code"}
        zIndex={1}
        x={200}
        fontSize={90}
        fontWeight={500}
      />
    </Glass>
  ));
  registers.forEach((r) => view.add(r));

  function* setRegister(i: number, value: number) {
    const register = registers[i];
    const t = register.childAs<Txt>(1);
    const val =
      value % 2 == 0
        ? value.toString(2).padStart(8, "0")
        : value.toString(2).padEnd(8, "0");
    yield t.scale(1.1, 0.4).wait(0.2).back(0.4);
    yield* t.text(
      val[7] +
        val[6] +
        val[5] +
        val[4] +
        " " +
        val[3] +
        val[2] +
        val[1] +
        val[0],
      0.5
    );
    yield* waitFor(0.5);
  }

  function* addRegisters(i: number, j: number, a: number, b: number) {
    const register0 = registers[i] as Glass;
    const register1 = registers[j] as Glass;
    const t = register0.childAs<Txt>(1);

    const val =
      (a + b) % 2 == 0
        ? (a + b).toString(2).padStart(8, "0")
        : (a + b).toString(2).padEnd(8, "0");

    const arrow = (
      <Line
        points={[
          register1.right(),
          register0.right().add(register1.right()).div(2).addX(100),
          register0.right(),
        ]}
        stroke={"#fff"}
        endOffset={20}
        startOffset={20}
        radius={100}
        endArrow
        lineWidth={10}
        end={0}
        lineDash={[30, 10]}
      />
    ) as Line;
    view.add(arrow);

    yield chain(arrow.end(1, 0.5), arrow.start(1, 0.5));
    yield t.scale(1.1, 0.4).wait(0.2).back(0.4);
    yield* t.text(
      val[7] +
        val[6] +
        val[5] +
        val[4] +
        " " +
        val[3] +
        val[2] +
        val[1] +
        val[0],
      0.5
    );
    yield* waitFor(0.5);
  }

  function* cloneRegisters(i: number, j: number, value: number) {
    const register0 = registers[i] as Glass;
    const register1 = registers[j] as Glass;
    const t = register0.childAs<Txt>(1);

    const val =
      value % 2 == 0
        ? value.toString(2).padStart(8, "0")
        : value.toString(2).padEnd(8, "0");

    const arrow = (
      <Line
        points={[
          register1.right(),
          register0.right().add(register1.right()).div(2).addX(100),
          register0.right(),
        ]}
        stroke={"#fff"}
        endOffset={20}
        startOffset={20}
        radius={100}
        endArrow
        lineWidth={10}
        end={0}
        lineDash={[30, 10]}
      />
    ) as Line;
    view.add(arrow);

    yield chain(arrow.end(1, 0.5), arrow.start(1, 0.5));
    yield t.scale(1.1, 0.4).wait(0.2).back(0.4);
    yield* t.text(
      val[7] +
        val[6] +
        val[5] +
        val[4] +
        " " +
        val[3] +
        val[2] +
        val[1] +
        val[0],
      0.5
    );
    yield* waitFor(0.5);
  }

  yield* window.scale(1, 1);

  yield* waitUntil("operands-intro");
  yield sequence(
    0.2,
    ...navbar()
      .children()
      .map((child) => child.scale(0.8, 0.6, easeOutBack))
  );
  yield* appendLine(
    "; Let's do a demo!\n; we write memory as [x]\n; registers as RX\n; values as #x\n\n"
  );

  yield sequence(
    0.1,
    ...registers.map((r) => all(r.scale(1, 0.7, easeOutBack)))
  );
  yield* waitUntil("load-r0");
  yield* appendLine("LOAD R0, [0x0a]");
  yield* setRegister(0, 3);

  yield* waitUntil("imm-flag");
  yield* toggleWindowMode(ramwindow);

  values_refs.forEach((ref) => ref.save());
  addresses_refs.forEach((ref) => ref.save());

  yield* waitFor(0.5);
  yield* highlightMemoryByte(10, "3");
  yield* highlightMemoryByte(17, "5");
  yield* waitFor(0.5);

  yield* waitUntil("imm-off");
  yield* toggleWindowMode(programwindow);
  values_refs.forEach((ref) => ref.restore());
  addresses_refs.forEach((ref) => ref.restore());

  yield* waitUntil("load-r1");
  yield* setRegister(1, 5);

  yield* appendLine("LOAD R1, [0x11] ; same trick");

  yield* waitUntil("memory");
  yield* toggleWindowMode(ramwindow);
  yield* waitFor(1);
  yield* toggleWindowMode(programwindow);

  yield* waitUntil("add-r0-r1");
  yield* appendLine("ADD R0, R1 ; R0 += R1");
  yield* addRegisters(0, 1, 3, 5);

  yield* waitUntil("store-r0");
  yield* appendLine("STORE  R0, [0x04]\n ");

  yield* waitUntil("where-modifiers");
  yield* all(program.code.append(" 1100", 0.5));
  yield* waitFor(0.5);
  yield* program.code.remove(program.findFirstRange("1100"), 0.5);
  yield* waitUntil("first-op");
  yield* program.selection(lines(6, 6), 1);
  yield* program.selection(word(6, 8, 10), 1);
  yield* waitFor(0.5);
  yield* toggleWindowMode(ramwindow);
  yield* waitFor(0.5);
  yield* toggleWindowMode(programwindow);

  yield* waitFor(0.5);
  const explination_string_raw =
    "\nLOAD R0, [0x0a]\noperation is translated to\n[00000100 1100 000000000000 000000001010]";
  yield* program.code.append(explination_string_raw, 1);
  yield* program.selection(lines(12, 15), 1);
  yield* program.selection(word(14, 15, 12), 0.5);
  yield* waitFor(0.5);

  yield* program.selection(DEFAULT, 0.5);
  yield* program.code.remove(lines(11, 15), 1);

  yield* waitUntil("cmp-zero");
  yield window.x(0, 1);
  yield sequence(0.1, ...registers.map((r) => all(r.x(2500, 0.7, easeInBack))));
  yield* appendLine("; Comparation:");
  yield* appendLine("GRT0 R0, [0xf20] ; jmp to f20 if > 0");
  yield* appendLine("JMP [0xf21] ; otherwise skip to f21");
  yield* appendLine("INC R0 ; here is 0xf20");
  yield* appendLine("HLT ; // this is f21. HLT does nothing ");

  yield* waitUntil("alu");
  yield* toggleWindowMode(unitwindow);
  yield* waitFor(0.3);
  yield* sequence(0.1, flags[0](1, 0.5), flags[1](1, 0.5));
  yield* waitFor(0.3);
  yield* toggleWindowMode(programwindow);

  yield* waitUntil("while-intro");
  yield* appendLine("\n; While loop:");

  yield program.y(-500, 1);
  yield* waitUntil("loop-load");
  yield* appendLine("LOAD R2, [0x10]");
  yield* appendLine("SUB R2, #1");
  yield* appendLine("STORE R2, [0x10] ; store in memory");
  yield* appendLine("GRT0 R2, [0xf30] ;  (f30 is the SUB above)");
  yield* appendLine("JMP [0xf31] ; Otherwise continue after the loop");
  yield* waitUntil("loop-end");
  yield* appendLine("HLT; // this is f31. HLT does nothing");

  yield* program.selection(DEFAULT, 1);

  yield* waitUntil("next");
});
