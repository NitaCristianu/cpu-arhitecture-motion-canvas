import { makeScene2D } from "@motion-canvas/2d";
import { all, easeInOutSine, useRandom, waitUntil } from "@motion-canvas/core";
import { createScene } from "../components/presets";
import { Vector3 } from "three";
import { buildCPULevel3 } from "../utils/cpus/buildCPULevel3";
import { RAM_SCALE } from "../utils/cpus/buildCPULevel0";

export default makeScene2D(function* (view) {
  const scene = createScene(new Vector3(-1.5, 0.5, -1.5));
  const cpu = buildCPULevel3(scene);

  const generator = useRandom(0);

  const camera = scene.getCameraClass();

  view.add(scene);
  scene.init();

  yield* waitUntil("begin");
  yield* camera.moveTo(
    cpu.fpu
      .getGlobalPosition()
      .add(new Vector3(0.9, 0.5, 0.4).multiplyScalar(2)),
    0
  );
  yield* camera.lookTo(
    cpu.fpu.getGlobalPosition().add(new Vector3(0.1, -0.1, 0.05)),
    0
  );
  yield* all(cpu.group.popIn(1), cpu.ram.popIn(1, RAM_SCALE));
  yield* camera.moveTo(
    cpu.fpu
      .getGlobalPosition()
      .add(new Vector3(-0.9, 0.5, -0.4).multiplyScalar(2)),
    3,
    easeInOutSine
  );

  yield* waitUntil('electricity flow');
  yield* cpu.initWires([cpu.wire_cu_alu, cpu.wire_decode_cu, cpu.wire_alu_mc, cpu.wire_cache_ram_data]);

  yield* waitUntil("next");
});
