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
  const cacheHitLabel = (
    <GlowBadge
      initialVisibility={false}
      text={"CACHE HIT (OK)"}
      fill={"#f7c81f"}
      shadowColor={"#f7c81f88"}
      y={() => cacheContents.bottom().y + 140}
      x={cacheContents.x}
    />
  ) as GlowBadge;

  view.add(cacheContents);
  view.add(cacheTitle);
  view.add(cacheMissLabel);
  view.add(cacheHitLabel);

  yield* all(cacheContents.popIn(0.8), cacheTitle.popIn("CACHE", 0.6));
  yield* emptyHint.popIn("EMPTY", 0.4);

  yield* waitUntil("spatial fill");
  yield* emptyHint.popOut("", 0.4);

  const randomHex = () =>
    "0x" + generator.nextInt(0, 4096).toString(16).padStart(3, "0").toUpperCase();

  const driveCacheQuery = (duration = 0.6, speed = 110) =>
    cpu.wire_mc_cache_address.currentFlow(duration, easeInOutSine, speed);

  const driveRamPath = (duration = 0.6, speed = 110) =>
    all(
      cpu.wire_cache_ram_address.currentFlow(duration, easeInOutSine, speed),
      cpu.wire_cache_ram_data.currentFlow(duration, easeOutSine, speed),
      cpu.wire_mc_cache_data.currentFlow(duration, easeOutSine, speed)
    );

  const runBurstFlow = () => all(driveCacheQuery(), driveRamPath());

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
    driveCacheQuery(1.3, 80)
  );

  yield* waitUntil("cache miss fetch");
  yield* cacheMissLabel.popIn("CACHE MISS (X)", 0.6);
  yield* waitFor(0.2);

  const missBurst = () => all(driveCacheQuery(0.9, 80), driveRamPath(0.9, 80));

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
  yield* cacheMissLabel.popOut("", 0.3);

  const hitIndex = fillGroups[0][0];
  const hitSlot = cacheSlots[hitIndex];
  const HIT_COLOR = "#f7c81f";
  const HIT_SHADOW = "#f7c81fa0";

  yield* waitUntil("cache hit");
  yield* all(
    driveCacheQuery(0.75, 120),
    cpu.wire_mc_cache_data.currentFlow(0.75, easeOutSine, 120),
    chain(
      hitSlot.opacity(1, 0.001),
      hitSlot.fill(HIT_COLOR, 0.3),
      hitSlot.shadowColor(HIT_SHADOW, 0.3),
      hitSlot.scale(1.25, 0.35, easeOutBack),
      hitSlot.scale(1.15, 0.25, easeInOutSine)
    )
  );
  yield* cacheHitLabel.popIn("CACHE HIT (OK)", 0.5);

  const restSlots = searchOrder.filter((index) => index !== hitIndex);
  if (restSlots.length) {
    yield* all(...restSlots.map((index) => cacheSlots[index].opacity(0.7, 0.4)));
  }

  yield* waitFor(0.2);
  yield* waitUntil("maximize hits");
  yield* all(
    cacheHitLabel.scale(1.3, 0.45, easeOutBack),
    hitSlot.scale(1.35, 0.45, easeOutBack)
  );
  yield* all(
    cacheHitLabel.scale(1, 0.35, easeInOutSine),
    hitSlot.scale(1.15, 0.35, easeInOutSine)
  );

  const availableIndices = range(cacheSlots.length).filter(
    (index) => index !== hitIndex
  );

  function* loadSlot(slot: GlowPanelTitle, value: string) {
    yield* slot.scale(0.9, 0.2, easeInOutSine);
    yield* all(slot.text(value, 0.25), slot.opacity(1, 0.25));
    yield* slot.scale(1.15, 0.25, easeOutBack);
    yield* slot.scale(1, 0.2, easeInOutSine);
  }

  function* unloadSlot(slot: GlowPanelTitle) {
    yield* slot.scale(0.9, 0.2, easeInOutSine);
    yield* all(slot.text("", 0.3), slot.opacity(0.25, 0.3));
    yield* slot.scale(0.7, 0.2, easeInOutSine);
  }

  yield* waitUntil("random loads");
  for (const _ of range(4)) {
    const poolIndex = generator.nextInt(0, availableIndices.length);
    const index = availableIndices[poolIndex];
    const slot = cacheSlots[index];
    const canUnload = slot.opacity() > 0.3;
    const unload = canUnload && generator.nextInt(0, 3) === 0;

    yield* all(
      driveCacheQuery(0.7, 95),
      driveRamPath(0.7, 95),
      unload ? unloadSlot(slot) : loadSlot(slot, randomHex())
    );
    yield* waitFor(0.12);
  }

  yield* waitUntil("next");
});
