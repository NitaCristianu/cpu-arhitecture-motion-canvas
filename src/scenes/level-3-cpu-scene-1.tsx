import { makeScene2D } from "@motion-canvas/2d";
import { all, waitFor, waitUntil } from "@motion-canvas/core";
import { createScene } from "../components/presets";
import { Vector3 } from "three";
import { buildCPULevel3 } from "../utils/cpus/buildCPULevel3";
import { RAM_SCALE } from "../utils/cpus/buildCPULevel0";

export default makeScene2D(function* (view) {
  const scene = createScene(new Vector3(-1.5, 1.5, 1.5));
  const cpu = buildCPULevel3(scene);

  view.add(scene);
  scene.init();


  yield* all(cpu.group.popIn(1), cpu.ram.popIn(1, RAM_SCALE));
  yield* cpu.initWires(cpu.wires, 1);

  yield* waitUntil("begin");

  yield* waitFor(1);
  yield* waitUntil("next");
});
 