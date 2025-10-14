import { Grid, makeScene2D, Txt } from "@motion-canvas/2d";
import {
  all,
  createRefArray,
  easeInOutCubic,
  easeInOutSine,
  easeInSine,
  easeOutBack,
  easeOutSine,
  loop,
  range,
  sequence,
  useRandom,
  waitFor,
  waitUntil,
} from "@motion-canvas/core";
import { createScene } from "../components/presets";
import { Vector3 } from "three";
import { buildCPULevel3 } from "../utils/cpus/buildCPULevel3";
import { RAM_SCALE } from "../utils/cpus/buildCPULevel0";
import { Label3D } from "../components/Label3D";
import { GlowBadge, GlowPanelTitle } from "../components/TextPresets";

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
      text={
        "I store now the number at X.\nI will return the value to the CPU.\nNext time the CPU will need X I will\nreturn it without fetching from RAM."
      }
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

  yield* waitUntil("post 3d scene");
  yield* all(address_dialogue.popOut(), data_dialogue.popOut());

  yield camera.zoomIn(2.3, 3, easeInOutCubic);
  yield camera.lookDown(0.35, 3, easeInOutCubic);
  yield* camera.moveTo(
    camera.localPosition().clone().add(new Vector3(-1, -3, -4)),
    3,
    easeInOutCubic
  );

  yield loop((i) =>
    i % 2
      ? cpu.wire_mc_cache_address.currentFlow(0.4, easeInSine, 100)
      : i % 3 == 0
      ? cpu.wire_mc_cache_data.currentFlow(0.4, easeInSine, 100)
      : cpu.wire_mc_cache_data.reverseFlow(0.4, easeInSine, 100)
  );

  yield* waitUntil("mainmemory");
  const cache_pos = camera.lookAt().clone();
  yield* camera.lookTo(cpu.ram.getGlobalPosition());

  const cache_data = createRefArray<Txt>();
  const cache_contents = (
    <Label3D
      scene={scene}
      worldPosition={cpu.cache.getGlobalPosition()}
      text={""}
      offset2D={[0, -500]}
      height={600}
      width={1200}
      color="control"
      clip
    >
      <Grid
        lineWidth={2}
        stroke={"#fff5"}
        size="100%"
        spacing={[100, 100]}
        zIndex={1}
      />
      {...range(12).flatMap((x) =>
        range(6).map((y) => (
          <GlowPanelTitle
            scale={0}
            ref={cache_data}
            text={
              generator.nextInt(0, 2) == 0
                ? "0x" + generator.nextInt(0, 256).toString(16)
                : generator.nextInt(0, 16).toString(2)
            }
            fontWeight={300}
            fontSize={30}
            fontFamily={"Fira Code"}
            x={x * 100 - 550}
            y={y * 100 - 250}
            fill={"white"}
            zIndex={1}
          />
        ))
      )}
    </Label3D>
  ) as Label3D;
  const title = (
    <GlowBadge
      scale={0}
      text={"CACHE CONTENTS"}
      bottom={cache_contents.top}
      padding={10}
    />
  );
  view.add(title);

  view.add(cache_contents);

  yield* waitUntil("lookat cache");
  yield* camera.lookTo(cache_pos, 1.5, easeInOutCubic);
  yield* title.scale(1, 0.5, easeOutBack);
  yield cache_contents.offset2D([-1200, -500], 1.5);
  yield cache_contents.scale(1.5,.8,easeOutSine);
  yield* sequence(
    0.025,
    ...cache_data.map((d) => d.scale(1, 0.5, easeOutBack))
  );

  yield loop((i) => {
    const randompositions = generator.intArray(
      generator.nextInt(0, 10),
      0,
      cache_data.length
    );
    return sequence(
      0.01,
      ...randompositions.map((pos) =>
        cache_data[pos].text(
          generator.nextInt(0, 2) == 0
            ? "0x" + generator.nextInt(0, 256).toString(16)
            : "",
          0.4
        )
      )
    );
  });

  yield* waitUntil("next");
});
