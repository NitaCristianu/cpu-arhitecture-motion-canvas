import { Camera, makeScene2D } from "@motion-canvas/2d";
import { buildCPULevel2 } from "../utils/cpus/buildCPULevel2";
import { createScene } from "../components/presets";
import {
  all,
  chain,
  delay,
  easeInOutCirc,
  easeInOutCubic,
  easeInSine,
  loop,
  sequence,
  useRandom,
  Vector2,
  waitFor,
  waitUntil,
} from "@motion-canvas/core";
import { RAM_SCALE } from "../utils/cpus/buildCPULevel0";
import { Vector3 } from "three";
import { Label3D } from "../components/Label3D";
import { buildCPULevel1 } from "../utils/cpus/buildCPULevel1";

export default makeScene2D(function* (view) {
  const generator = useRandom();

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
  
  const operations = ['ADD 5', 'SUB 3', 'JMP 80'];
  const results = ['0', '-2', 0];

  const labels = operations.forEach(operation=>(<Label3D
    text={operation}
    scene={scene}
    worldPosition={level1_cpu.alu.getGlobalPosition().clone().add(new Vector3(
      generator.nextFloat(-1,1),
      0,
      generator.nextFloat(-1,1),
    ))}
  />));


  yield* camera.lookTo(level1_cpu.alu.getGlobalPosition(), 1);
  yield* camera.moveTo(
    level1_cpu.alu
      .getGlobalPosition()
      .clone()
      .add(new Vector3(-0.5, 0.5, -0.5)),
    1
  );

  yield* waitUntil("next");
});
