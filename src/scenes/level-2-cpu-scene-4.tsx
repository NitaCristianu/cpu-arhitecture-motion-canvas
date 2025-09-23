import { makeScene2D } from "@motion-canvas/2d";
import {
  all,
  chain,
  easeInOutCubic,
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
    0.4, // spacing between items
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
    0.4, // spacing between items
    ...instructions_lbls2.map((label, i) =>
      all(
        label.scale(0.5, .4, easeOutSine),
        chain(
          tween(1, (progress) => {
            const t = easeInOutCubic(progress);
            const finalPos = new Vector2(-71, 1157);
            const startpos = new Vector2(104, 256);

            label.position(Vector2.arcLerp(startpos, finalPos, t, true, 10));
          }),
          label.popOut()
        )
      )
    )
  );

  yield* waitUntil("next");
});
