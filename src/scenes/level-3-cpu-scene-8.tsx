import { makeScene2D } from "@motion-canvas/2d";
import { createScene } from "../components/presets";
import { Vector3 } from "three";
import { buildCPULevel3 } from "../utils/cpus/buildCPULevel3";
import { all, useRandom, waitUntil } from "@motion-canvas/core";
import { RAM_SCALE } from "../utils/cpus/buildCPULevel0";

export default    makeScene2D(function* (view) {
  const scene = createScene(new Vector3(-1.5, 0.5, -1.5));
  const cpu = buildCPULevel3(scene);

  const camera = scene.getCameraClass();

  view.add(scene);
  scene.init();

  yield* waitUntil("begin");
  yield* camera.moveTo(
    cpu.fpu
      .getGlobalPosition()
      .add(new Vector3(-0.9, 0.5, -0.2).multiplyScalar(2)),
    0
  );
  yield* camera.lookTo(
    cpu.fpu.getGlobalPosition().add(new Vector3(0.3, -0.1, 0.05)),
    0
  );

  yield* all(cpu.group.popIn(1), cpu.ram.popIn(1, RAM_SCALE));
  yield camera.moveTo(
    cpu.fpu
      .getGlobalPosition()
      .add(new Vector3(0, 1, -0.2).multiplyScalar(2)),
    1.5
  );
  yield* camera.lookTo(
    cpu.fpu.getGlobalPosition().add(new Vector3(.5, -0.1, 0.05)),
    1.5
  );

  yield* waitUntil("next");
});
