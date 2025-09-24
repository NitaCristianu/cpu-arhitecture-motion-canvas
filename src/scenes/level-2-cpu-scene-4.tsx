import { Icon, makeScene2D, Rect, Txt } from "@motion-canvas/2d";
import {
  all,
  any,
  chain,
  Color,
  createRef,
  createRefArray,
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
  const sumThroughIndex = (n: number) =>
    splitting.reduce(
      (total, [value], idx) => (idx <= n ? total + value : total),
      0
    );

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
          fill={new Color(data[2] as string).brighten(12)}
          shadowBlur={50}
          shadowColor={new Color(data[2] as string).brighten(12).alpha(0.5)}
          text={getRawInstruction(data[0] as number)}
          x={() =>
            (i == 0 ? 0 : sumThroughIndex(i - 1) * 32 + data[0] * 16 - 110) -
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
        fill={new Color(data[2] as string).brighten(2)}
        shadowBlur={50}
        shadowColor={new Color(data[2] as string).darken(5).alpha(0.5)}
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
          new Color(splitting[i][2] as string).brighten(1),
          0.3,
          easeOutBack
        ),
        split.shadowColor(
          new Color(splitting[i][2] as string).darken(3),
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
          fill={new Color(data[2] as string).brighten(12)}
          shadowBlur={50}
          shadowColor={new Color(data[2] as string).brighten(12).alpha(0.5)}
          text={getRawInstruction(data[0] as number)}
          x={() =>
            (i == 0 ? 0 : sumThroughIndex(i - 1) * 32 + data[0] * 16 - 110) -
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

  const vr_ref = createRef<Glass>();
  const ar_ref = createRef<Glass>();
  const register_contents = (
    <Glass
      size={[1100, 600]}
      fill={new Color("#eee").alpha(0.1)}
      position={[300, -400]}
      scale={0}
      rotation={45}
      skew={[-40, 30]}
      lightness={-0.2}
    >
      <Txt
        zIndex={1}
        fontSize={120}
        fontWeight={400}
        fill={new Color("#eee").brighten(4)}
        shadowBlur={10}
        shadowColor={"#000a"}
        text={"GPR CONTENT"}
        fontFamily={"Poppins"}
        y={-180}
      />
      <Rect
        width={800}
        height={5}
        fill={new Color("#eee").brighten(4)}
        zIndex={1}
        y={-100}
        radius={100}
      />
      <Glass
        width={900}
        height={130}
        zIndex={1}
        y={30}
        lightness={-0.3}
        blurstrength={10}
        ref={ar_ref}
        scale={0}
      >
        <Txt
          zIndex={1}
          fontSize={70}
          fontWeight={300}
          shadowBlur={10}
          fill={"#fff"}
          fontFamily={"Poppins"}
          shadowColor={"#000a"}
          text={"AR: 0x001"}
          width={800}
        />
        <Txt
          zIndex={1}
          fontSize={70}
          fontWeight={200}
          fill={"999"}
          shadowBlur={10}
          fontFamily={"Poppins"}
          shadowColor={"#000a"}
          text={"8bit"}
          width={800}
          textAlign={"right"}
        />
        <Icon
          icon={"tabler:lock-filled"}
          color={"999"}
          scale={0}
          size={60}
          zIndex={1}
          x={230}
        />
      </Glass>
      <Glass
        width={900}
        height={130}
        zIndex={1}
        y={200}
        lightness={-0.3}
        blurstrength={10}
        scale={0}
        ref={vr_ref}
      >
        <Txt
          zIndex={1}
          fontSize={70}
          fontWeight={300}
          shadowBlur={10}
          fontFamily={"Poppins"}
          fill={new Color("#fff").brighten(5)}
          shadowColor={"#000a"}
          text={"VR: 0001 1110"}
          width={800}
        />
        <Txt
          zIndex={1}
          fontSize={70}
          fontWeight={200}
          fill={"999"}
          shadowBlur={10}
          fontFamily={"Poppins"}
          shadowColor={"#000a"}
          text={"8bit"}
          width={800}
          textAlign={"right"}
        />
      </Glass>
    </Glass>
  );
  view.add(register_contents);

   yield* any(
    register_contents.scale(0.8, 1, easeOutCubic),
    register_contents.rotation(0, 1, easeOutCubic),
    register_contents.skew([0, 0], 1, easeOutCubic),
    register_contents.position(
      () =>
        scene.projectToScreen(level2_cpu.decode.getGlobalPosition()).add([1500, -570]),
      2,
      easeOutBack
    )
  );
  yield* all(ar_ref().scale(1, 0.33, easeOutBack));
  yield* all(vr_ref().scale(1, 0.33, easeOutBack));

  yield* waitUntil("next");
});
