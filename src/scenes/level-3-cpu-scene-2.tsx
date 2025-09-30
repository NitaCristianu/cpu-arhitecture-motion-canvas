import { invert, makeScene2D, Rect, Txt } from "@motion-canvas/2d";
import {
  all,
  waitFor,
  waitUntil,
  Vector2,
  sequence,
  easeOutSine,
  useRandom,
  delay,
  chain,
  easeInSine,
  Color,
  createSignal,
  easeOutCirc,
  easeInOutSine,
} from "@motion-canvas/core";
import { createScene } from "../components/presets";
import { Vector3 } from "three";
import { buildCPULevel3 } from "../utils/cpus/buildCPULevel3";
import { RAM_SCALE } from "../utils/cpus/buildCPULevel0";
import { Label3D } from "../components/Label3D";
import Model from "../libs/Thrash/objects/Model";
import { addTowerSpotlight } from "../libs/Thrash/components/showlight";
import COLORS from "../utils/colors";
import { ShaderBackground } from "../components/background";

export default makeScene2D(function* (view) {
  const scene = createScene(new Vector3(-1.5, 0.5, -1.5));
  const cpu = buildCPULevel3(scene);

  const generator = useRandom(0);

  view.add(scene);
  scene.init();

  const camera = scene.getCameraClass();

  yield* camera.moveTo(
    cpu.fpu.getGlobalPosition().add(new Vector3(0.9, 0.5, 0.4)),
    0
  );
  yield* camera.lookTo(
    cpu.fpu.getGlobalPosition().add(new Vector3(0.1, -0.1, 0.05)),
    0
  );
  yield* all(cpu.group.popIn(1), cpu.ram.popIn(1, RAM_SCALE));

  yield* waitUntil("begin");
  yield* cpu.initWires([cpu.wire_fpr_fpu], 1);
  yield* waitFor(1);
  yield* chain(
    camera.lookTo(
      cpu.fpr.getGlobalPosition(),
      1.5
    )
  );

  yield* waitUntil("next");
});
