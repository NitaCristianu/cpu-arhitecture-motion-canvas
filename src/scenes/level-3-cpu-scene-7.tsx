import { makeScene2D } from "@motion-canvas/2d";
import {
  all,
  easeInOutCubic,
  easeInOutSine,
  easeInSine,
  easeOutSine,
  loop,
  useRandom,
  waitFor,
  waitUntil,
} from "@motion-canvas/core";
import { createScene } from "../components/presets";
import { Vector3 } from "three";
import { buildCPULevel3 } from "../utils/cpus/buildCPULevel3";
import { RAM_SCALE } from "../utils/cpus/buildCPULevel0";
import { Label3D } from "../components/Label3D";

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
  yield* all(cpu.cache.moveForward(2, 0), cpu.ram.moveLeft(0.1, 0));
  yield* all(cpu.group.popIn(1), cpu.ram.popIn(1, RAM_SCALE));
  yield* camera.moveTo(
    cpu.fpu
      .getGlobalPosition()
      .add(new Vector3(-0.9, 0.5, -0.4).multiplyScalar(2)),
    3,
    easeInOutSine
  );

  yield* waitUntil("electricity flow");
  yield* cpu.initWires([cpu.wire_decode_cu, cpu.wire_cu_alu, cpu.wire_alu_mc]);
  yield camera.lookTo(
    cpu.alu.getGlobalPosition().add(new Vector3(-0.2, -0.1, 0.05)),
    1
  );
  yield* cpu.wire_decode_cu.currentFlow(0.5, easeInOutSine, 150);
  yield* cpu.wire_cu_alu.currentFlow(0.5, easeInOutSine, 150);
  yield camera.lookTo(
    cpu.mc.getGlobalPosition().add(new Vector3(-0.2, 0.1, 0.05)),
    1
  );
  yield* cpu.wire_alu_mc.currentFlow(0.5, easeInOutSine, 150);

  yield* waitUntil("size");
  yield camera.lookTo(
    cpu.container.getGlobalPosition().add(new Vector3(0, -0.1, 0)),
    1
  );
  yield* cpu.container.shrink(0.2, 0.5);

  yield* waitUntil("ticks");
  yield camera.zoomIn(3.1, 1);
  yield camera.lookTo(
    cpu.clock.getGlobalPosition().add(new Vector3(-0.45, -0.1, 0)),
    1
  );
  yield* cpu.container.expand(5, 0.5);
  yield cpu.initWires([cpu.wire_clock_cu]);
  yield* loop(3, () => cpu.wire_clock_cu.currentFlow(0.25, easeOutSine, 120));

  yield* waitUntil("fetching");
  yield* camera.zoomOut(1 / 3.1, 1);
  yield* camera.lookTo(
    cpu.container.getGlobalPosition().add(new Vector3(0, -0.1, -0.25)),
    1
  );
  yield* camera.zoomOut(2, 1, easeInOutSine);

  yield* waitUntil("introduce cache");
  yield* all(cpu.cache.moveBack(2, 1), cpu.ram.moveRight(0.2, 1));

  yield* waitUntil("whatis");
  yield* all(
    camera.moveTo(new Vector3(0.75, 4, 0), 1),
    camera.lookTo(new Vector3(0.75 + 0.01, 0, 0), 0.8, easeInOutCubic)
  );
  yield* cpu.initWires([
    cpu.wire_cache_ram_address,
    cpu.wire_cache_ram_data,
    cpu.wire_mc_cache_data,
    cpu.wire_mc_cache_address,
  ]);

  const data_dialogue = (
    <Label3D
      scene={scene}
      worldPosition={cpu.cache.getGlobalPosition()}
      text={"I store now the number at X.\nI will return the value to the CPU.\nNext time the CPU will need X I will\nreturn it without fetching from RAM."}
      offset2D={[-1000, -500]}
      height={350}
      width={900}
      color="memory"
    />
  ) as Label3D;
  view.add(data_dialogue);
  const address_dialogue = (
    <Label3D
      scene={scene}
      worldPosition={cpu.cache.getGlobalPosition()}
      text={
        "CPU requested number at X.\nI don't store the number\nso I will fetch from ram."
      }
      offset2D={[1000, -500]}
      height={250}
      width={900}
      color="sky"
    />
  ) as Label3D;
  view.add(data_dialogue);
  view.add(address_dialogue);
  yield* waitUntil("communicate");
  yield* cpu.wire_mc_cache_address.currentFlow(0.4, easeInSine, 100);
  yield* address_dialogue.popIn(0.5);
  yield* waitFor(0.5);
  yield* cpu.wire_cache_ram_address.currentFlow(0.4, easeInSine, 100);
  yield* cpu.wire_cache_ram_data.reverseFlow(0.4, easeInSine, 100);
  yield* data_dialogue.popIn(0.5);
  yield* cpu.wire_mc_cache_data.reverseFlow(0.4, easeInSine, 100);

  yield* waitUntil("next");
});
