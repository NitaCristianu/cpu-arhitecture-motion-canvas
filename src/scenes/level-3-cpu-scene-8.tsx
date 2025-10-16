import { Grid, makeScene2D } from "@motion-canvas/2d";
import { createScene } from "../components/presets";
import { Vector2, Vector3 } from "three";
import { buildCPULevel3 } from "../utils/cpus/buildCPULevel3";
import {
  all,
  chain,
  createRefArray,
  createSignal,
  easeInOutCubic,
  easeInOutSine,
  easeOutBack,
  easeOutSine,
  range,
  sequence,
  waitFor,
  waitUntil,
  useRandom,
} from "@motion-canvas/core";
import { RAM_SCALE } from "../utils/cpus/buildCPULevel0";
import { Label3D } from "../components/Label3D";
import { GlassBodyText, GlowBadge, GlowPanelTitle } from "../components/TextPresets";

export default    makeScene2D(function* (view) {
  const scene = createScene(new Vector3(-1.5, 0.5, -1.5));
  const cpu = buildCPULevel3(scene);
  const generator = useRandom(8);

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

  yield* waitUntil("empty cache");

  yield* cpu.initWires([
    cpu.wire_cache_ram_address,
    cpu.wire_cache_ram_data,
    cpu.wire_mc_cache_data,
    cpu.wire_mc_cache_address
  ]);

  const spacing = createSignal<Vector2>(new Vector2(220, 160));
  const cacheSlots = createRefArray<GlowPanelTitle>();
  const emptyHint = (
    <GlassBodyText
      initialVisibility={false}
      text={"EMPTY"}
      fontSize={90}
      opacity={0.85}
      y={0}
    />
  ) as GlassBodyText;
  const cacheContents = (
    <Label3D
      scene={scene}
      worldPosition={() => cpu.cache.getGlobalPosition()}
      color="control"
      offset2D={[-1200, -420]}
      size={[1100, 860]}
      clip
      text={""}
    >
      <Grid
        lineWidth={3}
        stroke={"#ffffff30"}
        spacing={spacing}
        size="100%"
      />
      {emptyHint}
      {...range(4).flatMap((row) =>
        range(4).map((column) => (
          <GlowPanelTitle
            ref={cacheSlots}
            initialVisibility={false}
            text={""}
            fontSize={56}
            fontWeight={500}
            x={() => (column - 1.5) * spacing().x}
            y={() => (row - 1.5) * spacing().y}
          />
        ))
      )}
    </Label3D>
  ) as Label3D;
  const cacheTitle = (
    <GlowBadge
      initialVisibility={false}
      text={"CACHE"}
      bottom={cacheContents.top}
      x={cacheContents.x}
      padding={16}
    />
  ) as GlowBadge;
  const cacheMissLabel = (
    <GlowBadge
      initialVisibility={false}
      text={"CACHE MISS (X)"}
      y={() => cacheContents.bottom().y + 140}
      x={cacheContents.x}
    />
  ) as GlowBadge;

  view.add(cacheContents);
  view.add(cacheTitle);
  view.add(cacheMissLabel);

  yield* all(cacheContents.popIn(0.8), cacheTitle.popIn("CACHE", 0.6));
  yield* emptyHint.popIn("EMPTY", 0.4);

  yield* waitUntil("spatial fill");
  yield* emptyHint.popOut("", 0.4);

  const randomHex = () =>
    "0x" + generator.nextInt(0, 4096).toString(16).padStart(3, "0").toUpperCase();

  const runBurstFlow = () =>
    all(
      cpu.wire_cache_ram_address.currentFlow(0.6, easeInOutSine, 110),
      cpu.wire_cache_ram_data.currentFlow(0.6, easeOutSine, 110),
      cpu.wire_mc_cache_data.currentFlow(0.6, easeOutSine, 110)
    );

  const fillGroups = [
    [0, 1, 4, 5],
    [2, 3, 6, 7],
  ];

  for (const group of fillGroups) {
    const values = group.map(() => randomHex());
    yield* all(
      runBurstFlow(),
      ...group.map((index, i) => cacheSlots[index].popIn(values[i], 0.45))
    );
    yield* waitFor(0.12);
  }

  const searchOrder = fillGroups.flat();

  yield* waitUntil("cache search");
  yield* all(
    sequence(
      0.12,
      ...searchOrder.map((index) =>
        chain(
          cacheSlots[index].scale(1.12, 0.18, easeOutBack),
          all(
            cacheSlots[index].scale(1, 0.2, easeInOutSine),
            cacheSlots[index].opacity(0.4, 0.2)
          )
        )
      )
    ),
    cpu.wire_cache_ram_address.currentFlow(1.3, easeInOutSine, 80)
  );

  yield* waitUntil("cache miss fetch");
  yield* cacheMissLabel.popIn("CACHE MISS (X)", 0.6);
  yield* waitFor(0.2);

  const missBurst = () =>
    all(
      cpu.wire_cache_ram_address.currentFlow(0.9, easeInOutSine, 80),
      cpu.wire_cache_ram_data.currentFlow(0.9, easeOutSine, 80),
      cpu.wire_mc_cache_data.currentFlow(0.9, easeOutSine, 80)
    );

  const missGroup = [8, 9, 12, 13];
  const missValues = missGroup.map(() => randomHex());

  yield* all(
    missBurst(),
    ...missGroup.map((index, i) => cacheSlots[index].popIn(missValues[i], 0.55))
  );

  yield* sequence(
    0.08,
    ...missGroup.map((index) =>
      chain(
        cacheSlots[index].scale(1.1, 0.2, easeOutBack),
        cacheSlots[index].scale(1, 0.25, easeInOutSine)
      )
    )
  );

  yield* waitFor(0.4);
  yield* waitUntil("next");
});
