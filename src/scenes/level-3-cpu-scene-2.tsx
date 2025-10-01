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

  const labels = [cpu.fpu, cpu.fpr].map((component, i)=>(<Label3D
    scene={scene}
    worldPosition={()=>component.getGlobalPosition()}
    text={i == 0 ? "FPU" : "FPR (Floating Point Registers)"}
    width={i == 0 ? 400 : 1300}
    height={150}
    fontSize={80}
    offset2D={[0,-800]}
  />) as Label3D);
  labels.forEach(l=>view.add(l));

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
  yield labels[0].popIn();
  yield* all(cpu.fpu.rotateTo(new Vector3(0,0,Math.PI), .5, easeInOutSine));
  yield* waitUntil('wire');
  yield* cpu.initWires([cpu.wire_fpr_fpu], 1);
  yield* waitFor(1);
 
  yield* waitFor(1);
  yield* camera.lookTo(cpu.fpr.getGlobalPosition(),1.5,easeInOutSine);
  yield* labels[1].popIn();

  yield* waitUntil('mess');
  yield* cpu.initWires(cpu.wires, 1);
  yield* camera.lookTo(cpu.base.getGlobalPosition(),3);

  yield* waitUntil('hide');

  yield* waitUntil("next");
});
